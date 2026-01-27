const { ccclass, property, disallowMultiple, menu, executionOrder, requireComponent } = cc._decorator;

@ccclass
@disallowMultiple()
@menu('常用组件/虚拟列表(含分页)')
@requireComponent(cc.ScrollView)
@executionOrder(-5000)
export default class virtualList extends cc.Component {
    @property({ type: cc.Node, tooltip: '模板Item' })
    tmpNode: cc.Node = null;

    // --- 模式选择 ---
    @property({ tooltip: '是否启用分页吸附模式 (开启后将强制关闭惯性滚动)' })
    isPageView: boolean = false;

    // --- PageView 专用属性 (使用 visible 控制显示) ---
    
    @property({
        tooltip: '翻页阈值 (0.1-0.9)\n滑动距离超过 View 宽/高的多少比例时自动翻页',
        min: 0.1, max: 0.9,
        slide: true,
        step: 0.1,
        visible() { return this.isPageView; } // 仅在分页模式显示
    })
    turnPageThreshold: number = 0.2;

    @property({
        tooltip: '翻页/吸附动画时间 (秒)',
        min: 0,
        visible() { return this.isPageView; } // 仅在分页模式显示
    })
    scrollDuration: number = 0.3;

    @property({
        tooltip: '快速滑动翻页的最小速度 (像素/秒)\n即使距离不够，速度够快也能翻页',
        min: 100,
        visible() { return this.isPageView; } // 仅在分页模式显示
    })
    autoPageSpeed: number = 500;

    // --- 内部变量 ---
    private _inited: boolean = false;
    private _scrollView: cc.ScrollView = null;
    private content: cc.Node = null;
    private _layout: cc.Layout = null;

    private _itemSize: cc.Size = cc.size(0, 0);
    private _sizeType: boolean = true; // true: 垂直, false: 水平
    private _colLineNum: number = 1;   // 网格模式下的 列数(垂直时) 或 行数(水平时)

    // 布局参数缓存
    private _topGap: number = 0;
    private _bottomGap: number = 0;
    private _leftGap: number = 0;
    private _rightGap: number = 0;
    private _columnGap: number = 0;
    private _lineGap: number = 0;

    private _actualNumItems: number = 0;
    private _pool: cc.NodePool = new cc.NodePool();
    private _renderEvent: cc.Component.EventHandler = new cc.Component.EventHandler();
    private _pageTurnEvent: cc.Component.EventHandler = new cc.Component.EventHandler(); 
    private _forceUpdate: boolean = false;

    // --- 性能优化缓存 ---
    private _viewSize: cc.Size = cc.size(0, 0);
    private _itemStep: number = 0;
    private _scrollThrottleTimer: number = 0;
    private _scrollThrottleInterval: number = 16;
    private _currentVisibleRange: { start: number, end: number } = { start: -1, end: -1 };

    // --- PageView 逻辑变量 ---
    private _curPageIdx: number = 0; 
    private _startTouchPos: cc.Vec2 = null;
    private _startTime: number = 0;

    // --- 外部接口 ---

    /** 绑定渲染回调 (uiScr: 脚本实例, handler: 函数名) */
    bindRenderEvent(uiScr: cc.Component, handler: string) {
        this._renderEvent.target = uiScr.node;
        this._renderEvent.component = cc.js.getClassName(uiScr);
        this._renderEvent.handler = handler;
    }

    /** 绑定翻页/选中回调 (参数: 当前 Index) */
    bindPageTurnEvent(uiScr: cc.Component, handler: string) {
        this._pageTurnEvent.target = uiScr.node;
        this._pageTurnEvent.component = cc.js.getClassName(uiScr);
        this._pageTurnEvent.handler = handler;
    }

    /** 设置列表总数量 */
    set numItems(val: number) {
        if (this._actualNumItems === val) return;

        this._actualNumItems = val;
        this._forceUpdate = true;

        // 如果是分页模式，数量改变可能导致当前页越界
        if (this.isPageView && this._curPageIdx >= this._actualNumItems) {
            this._curPageIdx = Math.max(0, this._actualNumItems - 1);
        }

        if (this._inited) {
            this._resizeContent();
            this._updateVisibleItems();
            
            // 分页模式下，数据重置后需要重新对齐
            if (this.isPageView) {
                this.scheduleOnce(() => {
                    this.scrollToIndex(this._curPageIdx, 0);
                }, 0);
            }
        }
    }

    get numItems() { return this._actualNumItems; }
    
    /** 获取当前吸附的索引 (仅分页模式有效) */
    get currentPage() { return this._curPageIdx; }

    /**
     * 跳转到指定索引
     * @param index 目标索引
     * @param duration 动画时间，0 为瞬间跳转，-1 使用默认值
     */
    scrollToIndex(index: number, duration: number = -1) {
        if (!this._inited) return;
        
        // 索引修正
        if (index < 0) index = 0;
        if (this._actualNumItems > 0 && index >= this._actualNumItems) {
            index = this._actualNumItems - 1;
        }

        if (duration < 0) {
            duration = this.isPageView ? this.scrollDuration : 0.3;
        }

        this._scrollView.stopAutoScroll();

        // 记录当前页
        this._curPageIdx = index;
        
        // 触发事件
        if (this.isPageView) {
            cc.Component.EventHandler.emitEvents([this._pageTurnEvent], this._curPageIdx);
        }

        this._resizeContent(); 

        let targetOffset = cc.Vec2.ZERO;
        const maxOffset = this._scrollView.getMaxScrollOffset();

        // --- 计算目标 Offset ---
        
        // 修复：分页模式下，首尾强制对齐，解决浮点数计算导致的"回弹" bug
        if (this.isPageView && index === 0) {
            targetOffset.x = 0;
            targetOffset.y = 0;
        } else if (this.isPageView && index === this._actualNumItems - 1) {
            targetOffset.x = maxOffset.x;
            targetOffset.y = maxOffset.y;
        } else {
            // 常规计算
            if (this._sizeType) { // 垂直
                const row = Math.floor(index / this._colLineNum);
                const rowTopY = this._topGap + row * this._itemStep;
                targetOffset.y = Math.min(rowTopY, maxOffset.y);
            } else { // 水平
                const col = Math.floor(index / this._colLineNum);
                const colLeftX = this._leftGap + col * this._itemStep;
                targetOffset.x = Math.min(colLeftX, maxOffset.x);
            }
        }

        // --- 执行滚动 ---
        if (duration === 0) {
            this._scrollView.scrollToOffset(targetOffset);
        } else {
            this._scrollView.scrollToOffset(targetOffset, duration);
        }

        // 强制刷新
        this.unschedule(this._forceUpdateVisible);
        this.scheduleOnce(this._forceUpdateVisible, 0);
    }

    onLoad() {
        this._init();
    }

    start() {
        this._viewSize = this.node.getContentSize();
        this._calcItemStep();
        if (this.isPageView) {
            this.scheduleOnce(() => {
                this.scrollToIndex(this._curPageIdx, 0);
            }, 0);
        }
    }

    private _init() {
        if (this._inited) return;

        this._scrollView = this.node.getComponent(cc.ScrollView);
        this.content = this._scrollView.content;

        // 根据模式设置 ScrollView 物理属性
        if (this.isPageView) {
            this._scrollView.elastic = false; 
            this._scrollView.inertia = false;
            this._scrollView.brake = 1;
        } else {
            // 普通列表模式：保持编辑器中的设置
            // 通常是 elastic=true, inertia=true
        }

        this._layout = this.content.getComponent(cc.Layout);

        if (this._layout && this.tmpNode) {
            this._topGap = this._layout.paddingTop;
            this._bottomGap = this._layout.paddingBottom;
            this._leftGap = this._layout.paddingLeft;
            this._rightGap = this._layout.paddingRight;
            this._lineGap = this._layout.spacingY;
            this._columnGap = this._layout.spacingX;

            this._itemSize = cc.size(this.tmpNode.width, this.tmpNode.height);
            this._sizeType = this._layout.type === cc.Layout.Type.VERTICAL ||
                (this._layout.type === cc.Layout.Type.GRID && this._layout.startAxis === cc.Layout.AxisDirection.HORIZONTAL);

            this._layout.enabled = false;
        }

        this.node.on('scrolling', this._onScrollingThrottle, this);
        
        // 注册触摸事件
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);

        this.content.removeAllChildren();
        if (this.tmpNode) {
            this.tmpNode.active = false;
            if (this.tmpNode.parent === this.content) {
                this.tmpNode.removeFromParent();
            }
        }

        this._inited = true;
    }

    private _onTouchStart(event: cc.Event.EventTouch) {
        if (!this.isPageView) return; 

        this._startTouchPos = event.getLocation();
        this._startTime = Date.now();
        this._scrollView.stopAutoScroll(); 
    }

    private _onTouchEnd(event: cc.Event.EventTouch) {
        if (!this._inited || this._actualNumItems <= 0) return;
        if (!this.isPageView) return; 

        let endPos = event.getLocation();
        let dt = (Date.now() - this._startTime) / 1000;
        
        let offset = 0;
        let axisSize = 0;

        if (this._sizeType) { // 垂直
            offset = this._startTouchPos.y - endPos.y; // >0 下一页
            axisSize = this._itemSize.height;
        } else { // 水平
            offset = this._startTouchPos.x - endPos.x; // >0 下一页
            axisSize = this._itemSize.width;
        }

        let velocity = Math.abs(offset / dt);
        let nextIndex = this._curPageIdx;

        // 翻页判断逻辑
        if (offset > 0) { // 下一页
            if (this._curPageIdx < this._actualNumItems - 1) {
                if (Math.abs(offset) > axisSize * this.turnPageThreshold || velocity > this.autoPageSpeed) {
                    nextIndex++; 
                }
            }
        } else { // 上一页
            if (this._curPageIdx > 0) {
                if (Math.abs(offset) > axisSize * this.turnPageThreshold || velocity > this.autoPageSpeed) {
                    nextIndex--;
                }
            }
        }

        this.scrollToIndex(nextIndex);
    }

    private _calcItemStep() {
        if (this._sizeType) {
            this._itemStep = this._itemSize.height + this._lineGap;
        } else {
            this._itemStep = this._itemSize.width + this._columnGap;
        }
    }

    private _onScrollingThrottle() {
        const now = Date.now();
        if (now - this._scrollThrottleTimer < this._scrollThrottleInterval) return;
        this._scrollThrottleTimer = now;
        this._updateVisibleItems();
    }

    private _forceUpdateVisible() {
        this._forceUpdate = true;
        this._updateVisibleItems();
    }

    private _updateVisibleItems() {
        if (!this._inited) return;

        let offset = this._scrollView.getScrollOffset();
        if (!this._viewSize.equals(this.node.getContentSize())) {
            this._viewSize = this.node.getContentSize();
            this._calcItemStep();
        }

        let startIdx = 0, endIdx = 0;

        // 计算可视范围索引
        if (this._sizeType) { 
            let startY = offset.y;
            let endY = offset.y + this._viewSize.height;
            startIdx = Math.floor((startY - this._topGap) / this._itemStep) * this._colLineNum;
            endIdx = Math.ceil((endY - this._topGap) / this._itemStep) * this._colLineNum + (this._colLineNum - 1);
        } else { 
            let startX = -offset.x;
            let endX = -offset.x + this._viewSize.width;
            startIdx = Math.floor((startX - this._leftGap) / this._itemStep) * this._colLineNum;
            endIdx = Math.ceil((endX - this._leftGap) / this._itemStep) * this._colLineNum + (this._colLineNum - 1);
        }

        // 扩大缓冲区
        startIdx -= this._colLineNum; 
        endIdx += this._colLineNum;

        startIdx = Math.max(0, startIdx);
        endIdx = Math.min(this._actualNumItems - 1, endIdx);

        if (!this._forceUpdate && this._currentVisibleRange.start === startIdx && this._currentVisibleRange.end === endIdx) {
            return;
        }
        this._currentVisibleRange.start = startIdx;
        this._currentVisibleRange.end = endIdx;

        // 回收
        for (let i = this.content.childrenCount - 1; i >= 0; i--) {
            let item = this.content.children[i];
            let idx = (item as any)._listId;
            if (idx < startIdx || idx > endIdx || this._forceUpdate) {
                this._pool.put(item);
            }
        }

        // 显示
        const existIds = new Set<number>();
        this.content.children.forEach(child => existIds.add((child as any)._listId));

        for (let i = startIdx; i <= endIdx; i++) {
            if (!existIds.has(i)) {
                this._createItem(i);
            }
        }
        this._forceUpdate = false;
    }

    private _setItemPosition(node: cc.Node, index: number) {
        let row = 0;
        let col = 0;

        if (this._sizeType) { // 垂直
            col = index % this._colLineNum;
            row = Math.floor(index / this._colLineNum);
        } else { // 水平
            row = index % this._colLineNum;
            col = Math.floor(index / this._colLineNum);
        }

        let itemAnchorOffsetX = node.anchorX * this._itemSize.width;
        let itemAnchorOffsetY = (1 - node.anchorY) * this._itemSize.height;

        const contentStartX = -this.content.width * this.content.anchorX;
        const contentStartY = this.content.height * (1 - this.content.anchorY);

        if (this._sizeType) { 
            let totalItemsWidth = (this._colLineNum * this._itemSize.width) + ((this._colLineNum - 1) * this._columnGap);
            let availableW = this.content.width - this._leftGap - this._rightGap;
            let centerOffsetX = (availableW - totalItemsWidth) / 2;
            centerOffsetX = Math.max(0, centerOffsetX);

            let offsetX = this._leftGap + centerOffsetX + col * (this._itemSize.width + this._columnGap) + itemAnchorOffsetX;
            let offsetY = this._topGap + row * this._itemStep + itemAnchorOffsetY;
            node.setPosition(contentStartX + offsetX, contentStartY - offsetY);
        } else { 
            let totalItemsHeight = (this._colLineNum * this._itemSize.height) + ((this._colLineNum - 1) * this._lineGap);
            let availableH = this.content.height - this._topGap - this._bottomGap;
            let centerOffsetY = (availableH - totalItemsHeight) / 2;
            centerOffsetY = Math.max(0, centerOffsetY);

            let offsetX = this._leftGap + col * this._itemStep + itemAnchorOffsetX;
            let offsetY = this._topGap + centerOffsetY + row * (this._itemSize.height + this._lineGap) + itemAnchorOffsetY;
            node.setPosition(contentStartX + offsetX, contentStartY - offsetY);
        }
    }

    private _resizeContent() {
        let result = 0;
        // 计算行/列数逻辑
        if (this._layout.type === cc.Layout.Type.GRID) {
            if (this._sizeType) { // 垂直
                let availableW = this.content.width - this._leftGap - this._rightGap;
                this._colLineNum = Math.floor((availableW + this._columnGap) / (this._itemSize.width + this._columnGap)) || 1;
                let rows = Math.ceil(this._actualNumItems / this._colLineNum);
                result = this._topGap + (rows * this._itemSize.height) + (rows > 1 ? (rows - 1) * this._lineGap : 0) + this._bottomGap;
                this.content.height = result;
                if (this.isPageView) this.content.width = Math.max(this.content.width, this._viewSize.width);
            } else { // 水平
                let availableH = this.content.height - this._topGap - this._bottomGap;
                this._colLineNum = Math.floor((availableH + this._lineGap) / (this._itemSize.height + this._lineGap)) || 1;
                let cols = Math.ceil(this._actualNumItems / this._colLineNum);
                result = this._leftGap + (cols * this._itemSize.width) + (cols > 1 ? (cols - 1) * this._columnGap : 0) + this._rightGap;
                this.content.width = result;
                if (this.isPageView) this.content.height = Math.max(this.content.height, this._viewSize.height);
            }
        } else {
            // 单行/单列
            this._colLineNum = 1;
            if (this._sizeType) { 
                result = this._topGap + (this._actualNumItems * this._itemSize.height) + (this._actualNumItems > 1 ? (this._actualNumItems - 1) * this._lineGap : 0) + this._bottomGap;
                this.content.height = result;
                if (this.isPageView) this.content.width = Math.max(this.content.width, this._viewSize.width);
            } else { 
                result = this._leftGap + (this._actualNumItems * this._itemSize.width) + (this._actualNumItems > 1 ? (this._actualNumItems - 1) * this._columnGap : 0) + this._rightGap;
                this.content.width = result;
                if (this.isPageView) this.content.height = Math.max(this.content.height, this._viewSize.height);
            }
        }
        this._calcItemStep();
    }

    private _createItem(index: number) {
        let node = this._pool.size() > 0 ? this._pool.get() : cc.instantiate(this.tmpNode);
        (node as any)._listId = index;
        node.parent = this.content;
        node.active = true;
        this._setItemPosition(node, index);
        cc.Component.EventHandler.emitEvents([this._renderEvent], node, index);
    }

    onDestroy() {
        this.unscheduleAllCallbacks();
        this.node.off('scrolling', this._onScrollingThrottle, this);
        this.node.off(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        this._pool.clear();
        this._currentVisibleRange = { start: -1, end: -1 };
        this._viewSize = cc.size(0, 0);
    }
}
