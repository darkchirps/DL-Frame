import { _decorator, ScrollView, js, Node, instantiate, Vec2, EventHandler, Component, Layout, Size, size, NodePool } from "cc";

/*******************************************************************************
 * 描述: 虚拟列表（核心逻辑整合版）
 * 支持: 单行、单列、网格布局、对象池、渲染回调、跳转到指定index
 * 优化: 计算缓存、事件节流、内存优化、渲染优化
 *******************************************************************************/
const { ccclass, property, disallowMultiple, menu, executionOrder, requireComponent } = _decorator;

@ccclass
@disallowMultiple()
@menu('常用组件/虚拟列表')
@requireComponent(ScrollView)
@executionOrder(-5000)
export default class virtualList extends Component {
    @property({ type: Node, tooltip: '模板Item' }) tmpNode: Node = null;

    // --- 内部计算变量 ---
    private _inited: boolean = false;
    private _scrollView: ScrollView = null;
    private content: Node = null;
    private _layout: Layout = null;

    private _itemSize: Size = size(0, 0);
    private _sizeType: boolean = true; // true: 垂直方向, false: 水平方向
    private _colLineNum: number = 1;   // 行/列数

    // 布局参数缓存
    private _topGap: number = 0;
    private _bottomGap: number = 0;
    private _leftGap: number = 0;
    private _rightGap: number = 0;
    private _columnGap: number = 0;
    private _lineGap: number = 0;

    private _actualNumItems: number = 0;
    private _pool: NodePool = new NodePool();
    private _renderEvent: EventHandler = new EventHandler();
    private _forceUpdate: boolean = false;

    // --- 性能优化缓存 ---
    private _viewSize: Size = size(0, 0); // 视图尺寸缓存（避免频繁调用getContentSize）
    private _itemStep: number = 0; // item步进值缓存（宽/高 + 间距）
    private _scrollThrottleTimer: number = 0; // 滚动节流计时器
    private _scrollThrottleInterval: number = 16; // 节流间隔（约60帧/秒）
    private _currentVisibleRange: { start: number, end: number } = { start: -1, end: -1 }; // 可视区域缓存

    // --- 外部接口 ---

    /** 绑定渲染回调 */
    bindRenderEvent(uiScr: any, handler: string) {
        this._renderEvent.target = uiScr.node;
        this._renderEvent.component = js.getClassName(uiScr);
        this._renderEvent.handler = handler;
    }

    /** 设置列表数量 */
    set numItems(val: number) {
        // 避免重复设置相同数值
        if (this._actualNumItems === val) return;

        this._actualNumItems = val;
        this._forceUpdate = true;
        if (this._inited) {
            this._resizeContent();
            this._updateVisibleItems(); // 替换直接调用_onScrolling，避免节流影响初始化
        }
    }

    get numItems() { return this._actualNumItems; }

    /**
     * 跳转到指定索引
     * @param index 目标索引
     * @param duration 滚动时间（秒），传0为瞬间跳转
     */
    scrollToIndex(index: number, duration: number = 0.3) {
        if (!this._inited || index < 0 || index >= this._actualNumItems) {
            console.warn(`VirtualList: 索引 ${index} 越界，列表总数为 ${this._actualNumItems}`);
            return;
        }

        // 核心补充：duration为0时，先停止所有滑动动画再跳转
        if (duration === 0) {
            this._scrollView.stopAutoScroll();
            this._scrollView.scrollToOffset(this._scrollView.getScrollOffset(), 0);
        }

        this._resizeContent();

        // 使用缓存的视图尺寸
        let targetOffset = Vec2.ZERO;

        if (this._sizeType) { // 垂直方向
            const row = Math.floor(index / this._colLineNum);
            const rowTopY = this._topGap + row * this._itemStep; // 使用缓存的步进值
            // @ts-ignore
            targetOffset.y = rowTopY;

            // 边界处理：防止滚动超出范围
            const maxOffsetY = Math.max(0, this.content.uiTransform.height - this._viewSize.height);
            // @ts-ignore
            targetOffset.y = Math.max(0, Math.min(targetOffset.y, maxOffsetY));
        } else { // 水平方向
            const col = Math.floor(index / this._colLineNum);
            const colLeftX = this._leftGap + col * this._itemStep; // 使用缓存的步进值
            // @ts-ignore
            targetOffset.x = colLeftX;

            // 边界处理：防止滚动超出范围
            const maxOffsetX = Math.max(0, this.content.uiTransform.width - this._viewSize.width);
            // @ts-ignore
            targetOffset.x = Math.max(0, Math.min(targetOffset.x, maxOffsetX));
        }

        // 执行跳转
        this._scrollView.scrollToOffset(targetOffset, duration);

        // 强制更新列表渲染，确保目标item显示（使用微任务，避免帧内阻塞）
        this.unschedule(this._forceUpdateVisible); // 取消之前的调度，避免重复执行
        this.scheduleOnce(this._forceUpdateVisible, 0);
    }

    onLoad() {
        this._init();
    }

    start() {
        // 延迟获取视图尺寸，确保节点布局完成
        this._viewSize = this.node.uiTransform.contentSize;
        // 预计算item步进值（减少重复计算）
        this._calcItemStep();
    }

    private _init() {
        if (this._inited) return;

        this._scrollView = this.node.getComponent(ScrollView);
        this.content = this._scrollView.content;

        // 强制 Content 锚点为左上角 (0, 1)
        this.content.uiTransform.anchorX = 0;
        this.content.uiTransform.anchorY = 1;

        this._layout = this.content.getComponent(Layout);

        if (this._layout && this.tmpNode) {
            this._topGap = this._layout.paddingTop;
            this._bottomGap = this._layout.paddingBottom;
            this._leftGap = this._layout.paddingLeft;
            this._rightGap = this._layout.paddingRight;
            this._lineGap = this._layout.spacingY;
            this._columnGap = this._layout.spacingX;

            this._itemSize = size(this.tmpNode.uiTransform.width, this.tmpNode.uiTransform.height);
            this._sizeType = this._layout.type === Layout.Type.VERTICAL ||
                (this._layout.type === Layout.Type.GRID && this._layout.startAxis === Layout.AxisDirection.HORIZONTAL);

            this._layout.enabled = false;
        }

        // 优化：使用节流的滚动事件处理
        this.node.on('scrolling', this._onScrollingThrottle, this);
        this.content.removeAllChildren();

        // 隐藏模板节点（避免渲染开销）
        if (this.tmpNode) {
            this.tmpNode.active = false;
            this.tmpNode.parent = null; // 从场景树移除，减少节点遍历开销
        }

        this._inited = true;
    }

    // --- 性能优化核心方法 ---

    /** 计算item步进值（宽/高 + 间距），缓存起来避免重复计算 */
    private _calcItemStep() {
        if (this._sizeType) {
            this._itemStep = this._itemSize.height + this._lineGap;
        } else {
            this._itemStep = this._itemSize.width + this._columnGap;
        }
    }

    /** 滚动事件节流处理（避免高频触发_onScrolling） */
    private _onScrollingThrottle() {
        const now = Date.now();
        if (now - this._scrollThrottleTimer < this._scrollThrottleInterval) {
            return;
        }
        this._scrollThrottleTimer = now;
        this._updateVisibleItems();
    }

    /** 强制更新可视区域（用于跳转/初始化） */
    private _forceUpdateVisible() {
        this._forceUpdate = true;
        this._updateVisibleItems();
    }

    /** 更新可视区域item（核心渲染逻辑，抽离出来方便复用） */
    private _updateVisibleItems() {
        if (!this._inited) return;

        let offset = this._scrollView.getScrollOffset();
        // 缓存视图尺寸，避免频繁调用getContentSize
        if (!this._viewSize.equals(this.node.uiTransform.contentSize)) {
            this._viewSize = this.node.uiTransform.contentSize;
            this._calcItemStep(); // 尺寸变化时重新计算步进值
        }

        let startIdx = 0, endIdx = 0;

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

        // 边界处理
        startIdx = Math.max(0, startIdx);
        endIdx = Math.min(this._actualNumItems - 1, endIdx);

        // 优化：如果可视区域范围未变化且无需强制更新，直接返回（避免重复计算）
        if (!this._forceUpdate && this._currentVisibleRange.start === startIdx && this._currentVisibleRange.end === endIdx) {
            return;
        }
        this._currentVisibleRange.start = startIdx;
        this._currentVisibleRange.end = endIdx;

        // 回收超出可视区域的item
        for (let i = this.content.children.length - 1; i >= 0; i--) {
            let item = this.content.children[i];
            let idx = (item as any)._listId;
            if (idx < startIdx || idx > endIdx || this._forceUpdate) {
                this._pool.put(item);
            }
        }

        // 创建/更新可视区域内的item
        // 优化：使用对象缓存减少数组遍历（some方法）
        const existIds = new Set<number>();
        this.content.children.forEach(child => existIds.add((child as any)._listId));

        for (let i = startIdx; i <= endIdx; i++) {
            if (!existIds.has(i)) {
                this._createItem(i);
            }
        }

        this._forceUpdate = false;
    }

    private _setItemPosition(node: Node, index: number) {
        let row = Math.floor(index / this._colLineNum);
        let col = index % this._colLineNum;

        // 获取 Item 自身的锚点偏移
        let anchorOffsetX = node.uiTransform.anchorX * this._itemSize.width;
        let anchorOffsetY = (1 - node.uiTransform.anchorY) * this._itemSize.height;

        if (this._sizeType) { // 垂直滑动模式
            // 1. 计算所有列占用的总宽度（包含间距，但不包含 Padding）
            let totalItemsWidth = (this._colLineNum * this._itemSize.width) + ((this._colLineNum - 1) * this._columnGap);

            // 2. 计算居中偏移量：(容器可用空间 - Items总空间) / 2
            let availableW = this.content.uiTransform.width - this._leftGap - this._rightGap;
            let centerOffsetX = (availableW - totalItemsWidth) / 2;
            centerOffsetX = Math.max(0, centerOffsetX); // 简化写法

            // 3. 最终 X/Y 计算（使用缓存的步进值）
            let x = this._leftGap + centerOffsetX + col * (this._itemSize.width + this._columnGap) + anchorOffsetX;
            let y = -(this._topGap + row * this._itemStep + anchorOffsetY);

            node.setPosition(x, y);
        } else {
            // 水平滑动模式
            let totalItemsHeight = (this._colLineNum * this._itemSize.height) + ((this._colLineNum - 1) * this._lineGap);
            let availableH = this.content.uiTransform.height - this._topGap - this._bottomGap;
            let centerOffsetY = (availableH - totalItemsHeight) / 2;
            centerOffsetY = Math.max(0, centerOffsetY);

            let x = this._leftGap + col * (this._itemSize.width + this._columnGap) + anchorOffsetX;
            let y = -(this._topGap + centerOffsetY + row * this._itemStep + anchorOffsetY);

            node.setPosition(x, y);
        }
    }

    // --- 核心计算 ---

    private _resizeContent() {
        let result = 0;
        if (this._layout.type === Layout.Type.GRID) {
            if (this._sizeType) { // 垂直
                let availableW = this.content.uiTransform.width - this._leftGap - this._rightGap;
                this._colLineNum = Math.floor((availableW + this._columnGap) / (this._itemSize.width + this._columnGap)) || 1;
                let rows = Math.ceil(this._actualNumItems / this._colLineNum);
                result = this._topGap + (rows * this._itemSize.height) + (rows > 1 ? (rows - 1) * this._lineGap : 0) + this._bottomGap;
                this.content.uiTransform.height = result;
            } else { // 水平
                let availableH = this.content.uiTransform.height - this._topGap - this._bottomGap;
                this._colLineNum = Math.floor((availableH + this._lineGap) / (this._itemSize.height + this._lineGap)) || 1;
                let cols = Math.ceil(this._actualNumItems / this._colLineNum);
                result = this._leftGap + (cols * this._itemSize.width) + (cols > 1 ? (cols - 1) * this._columnGap : 0) + this._rightGap;
                this.content.uiTransform.width = result;
            }
        } else {
            this._colLineNum = 1;
            if (this._sizeType) {
                result = this._topGap + (this._actualNumItems * this._itemSize.height) + (this._actualNumItems > 1 ? (this._actualNumItems - 1) * this._lineGap : 0) + this._bottomGap;
                this.content.uiTransform.height = result;
            } else {
                result = this._leftGap + (this._actualNumItems * this._itemSize.width) + (this._actualNumItems > 1 ? (this._actualNumItems - 1) * this._columnGap : 0) + this._rightGap;
                this.content.uiTransform.width = result;
            }
        }

        // 尺寸变化后重新计算步进值
        this._calcItemStep();
    }

    // 兼容旧的_onScrolling方法（避免事件绑定失效）
    private _onScrolling() {
        this._onScrollingThrottle();
    }

    private _createItem(index: number) {
        let node = this._pool.size() > 0 ? this._pool.get() : instantiate(this.tmpNode);
        (node as any)._listId = index;
        node.parent = this.content;
        node.active = true; // 确保item激活（对象池取出可能是隐藏的）
        this._setItemPosition(node, index);
        // 优化：使用数组形式调用，减少临时对象创建
        EventHandler.emitEvents([this._renderEvent], node, index);
    }

    onDestroy() {
        // 优化：取消所有调度，避免内存泄漏
        this.unscheduleAllCallbacks();
        // 移除事件监听
        this.node.off('scrolling', this._onScrolling, this);
        this.node.off('scrolling', this._onScrollingThrottle, this);
        // 清空对象池
        this._pool.clear();
        // 释放缓存引用
        this._currentVisibleRange = { start: -1, end: -1 };
        this._viewSize = size(0, 0);
    }
}