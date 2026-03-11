const { ccclass, property } = cc._decorator;

// 原有渲染回调：渲染单个页面节点时触发
export type RenderPageCallback = (node: cc.Node, data: any, index: number) => void;
// 新增核心回调：翻页开始时触发，参数：方向(1=上一页，-1=下一页)、目标页面索引
export type PageChangeStartCallback = (dir: number, targetIndex: number) => void;
// 跳转完成的回调类型
export type PageJumpCompleteCallback = Function;

@ccclass
export default class pageViewPlus extends cc.Component {

    @property(cc.Node) view: cc.Node = null;
    @property(cc.Node) content: cc.Node = null;
    @property(cc.Node) pageNode: cc.Node = null;

    @property({ tooltip: "滑动翻页阈值 (0-1)", range: [0, 1] })
    threshold: number = 0.2;

    @property({ tooltip: "翻页动画时间，建议0.25更丝滑" })
    animTime: number = 0.25;

    // --- 内部状态 ---
    private _dataList: any[] = [];
    private _currDataIndex: number = 0;
    private _renderCallback: RenderPageCallback = null;
    private _pageChangeCallback: PageChangeStartCallback = null;

    // 三节点循环复用核心引用
    private _nodePrev: cc.Node = null;
    private _nodeCurr: cc.Node = null;
    private _nodeNext: cc.Node = null;

    private _isDragging: boolean = false;
    private _isPlaying: boolean = false; // 动画执行锁：翻页/回弹动画中都为true
    private _pageSize: cc.Size = null;
    private _startY: number = 0;

    onLoad() {
        this.content.y = 0;
        // 绑定触摸事件
        this.view.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.view.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.view.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.view.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.view.on(cc.Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    onDestroy() {
        // 解绑所有事件 防止内存泄漏
        this.view.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.view.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.view.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.view.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.view.off(cc.Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
        this.unscheduleAllCallbacks();
    }

    /** 设置单页尺寸 */
    setPageSize(w: number, h: number) {
        this._pageSize = cc.size(w, h);
        this.content.setContentSize(this._pageSize);
        this.content.y = 0;
    }

    /**
     * 初始化方法
     * @param dataList 数据源
     * @param renderHandler 页面渲染回调
     * @param pageChangeHandler 翻页开始回调
     * @param startIndex 起始索引
     */
    public init(
        dataList: any[],
        renderHandler: RenderPageCallback,
        pageChangeHandler?: PageChangeStartCallback,
        startIndex: number = 0
    ) {
        this._dataList = dataList || [];
        this._renderCallback = renderHandler;
        this._pageChangeCallback = pageChangeHandler;
        this._currDataIndex = this.getSafeIndex(startIndex);

        this._isPlaying = false;
        this._isDragging = false;
        this.content.stopAllActions();
        this.content.y = 0;

        if (this._dataList.length <= 0) return;
        this.createNodes();
        this.refreshAllNodes();
    }

    private onSizeChanged() {
        this.content.stopAllActions();
        this._isPlaying = false;
        this._isDragging = false;
        this.content.y = 0;
        this.resizePageNodes();
        this.resetNodePositions();
    }

    private createNodes() {
        if (this.content.childrenCount >= 3) {
            this._nodePrev = this.content.children[0];
            this._nodeCurr = this.content.children[1];
            this._nodeNext = this.content.children[2];
        } else {
            this.content.removeAllChildren();
            this._nodePrev = cc.instantiate(this.pageNode);
            this._nodeCurr = cc.instantiate(this.pageNode);
            this._nodeNext = cc.instantiate(this.pageNode);
            this.content.addChild(this._nodePrev);
            this.content.addChild(this._nodeCurr);
            this.content.addChild(this._nodeNext);
        }
        this.resizePageNodes();
        this.resetNodePositions();
    }

    private resizePageNodes() {
        if (!this._pageSize) return;
    }

    private resetNodePositions() {
        const h = this._pageSize?.height || 0;
        if (h <= 0) return;
        this._nodePrev.y = h;
        this._nodeCurr.y = 0;
        this._nodeNext.y = -h;
    }

    private refreshAllNodes() {
        this.safeRender(this._nodePrev, this._currDataIndex - 1);
        this.safeRender(this._nodeCurr, this._currDataIndex);
        this.safeRender(this._nodeNext, this._currDataIndex + 1);
    }

    private safeRender(node: cc.Node, dataIndex: number) {
        const total = this._dataList.length;
        if (total === 0 || !this._renderCallback) return;
        const safeIndex = (dataIndex % total + total) % total;
        this._renderCallback(node, this._dataList[safeIndex], safeIndex);
    }

    // ======================== ✅ 修复点1：触摸事件 无任何延迟 精准计算 ========================
    private onTouchStart(event: cc.Event.EventTouch) {
        if (this._isPlaying || this._dataList.length <= 1) {
            return;
        }
        this._isDragging = true;
        const touchY = event.getLocationY();
        this._startY = touchY - this.content.y;
        this.content.stopAllActions();
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        if (!this._isDragging || this._dataList.length <= 1) return;
        const delta = event.getLocationY() - this._startY;
        this.content.y = delta;
    }

    private onTouchEnd(event: cc.Event.EventTouch) {
        if (!this._isDragging || this._dataList.length <= 1) return;
        this._isDragging = false;

        const delta = event.getLocationY() - this._startY;
        const h = this._pageSize.height;
        let targetY = 0;
        let dir = 0;

        if (h > 0 && Math.abs(delta) > h * this.threshold) {
            // ✅✅✅ 核心修复：方向逻辑彻底纠正【最关键】
            // delta > 0 → 手指向上滑 → 想看下面的内容 → 下一页 (dir=-1)
            // delta < 0 → 手指向下滑 → 想看上面的内容 → 上一页 (dir=1)
            dir = delta > 0 ? -1 : 1;
            targetY = dir === 1 ? h : -h;
        }
        this.playAnim(targetY, dir);
    }

    // ======================== ✅ 修复点2：删除异步延迟，动画结束立即执行，零渲染延迟 ========================
    private playAnim(targetY: number, dir: number) {
        this._isPlaying = true;

        if (dir === 0) {
            cc.tween(this.content)
                .to(this.animTime, { y: 0 }, { easing: 'sineOut' })
                .call(() => {
                    this._isPlaying = false;
                })
                .start();
            return;
        }

        const targetIndex = this.getSafeIndex(this._currDataIndex + dir);
        this._pageChangeCallback && this._pageChangeCallback(dir, targetIndex);

        cc.tween(this.content)
            .to(this.animTime, { y: targetY }, { easing: 'sineOut' })
            // ✅✅✅ 删掉scheduleOnce异步延迟，动画结束【立即同步】执行切换逻辑，数据渲染零延迟
            .call(() => {
                this.onPageChanged(dir);
            })
            .start();
    }

    // ======================== ✅ 修复点3：最终版onPageChanged 逻辑最优，零延迟零错乱 ========================
    private onPageChanged(dir: number) {
        this.content.y = 0;
        const total = this._dataList.length;
        if (total <= 1) {
            this._isPlaying = false;
            return;
        }

        // 安全更新当前索引
        this._currDataIndex = this.getSafeIndex(this._currDataIndex + dir);

        // 节点位置互换 (原有逻辑不变)
        if (dir === 1) {
            // 向下滑 → 上一页 节点交换逻辑
            const temp = this._nodePrev;
            this._nodePrev = this._nodeCurr;
            this._nodeCurr = this._nodeNext;
            this._nodeNext = temp;
        } else {
            // 向上滑 → 下一页 节点交换逻辑
            const temp = this._nodeNext;
            this._nodeNext = this._nodeCurr;
            this._nodeCurr = this._nodePrev;
            this._nodePrev = temp;
        }

        // 全量刷新+重置坐标，数据渲染和位置同步完成，无任何延迟
        this.refreshAllNodes();
        this.resetNodePositions();
        this._isPlaying = false;
    }

    // --- 工具方法 ---
    public getCurrentIndex() {
        return this.getSafeIndex(this._currDataIndex);
    }

    /** 获取安全索引，防止越界 */
    private getSafeIndex(index: number): number {
        const total = this._dataList.length;
        return total === 0 ? 0 : (index % total + total) % total;
    }

    // ======================== 保留你所有的跳转方法 无任何修改 ========================
    public jumpToPage(targetIndex: number, animTime?: number, completeCallback?: PageJumpCompleteCallback) {
        const total = this._dataList.length;
        if (total <= 0 || this._isPlaying || this.getCurrentIndex() === targetIndex) {
            completeCallback && completeCallback();
            return;
        }

        const safeTargetIndex = this.getSafeIndex(targetIndex);
        const dir = safeTargetIndex > this.getCurrentIndex() ? -1 : 1;
        const useAnimTime = animTime === 0 ? 0 : (animTime || this.animTime);
        const h = this._pageSize?.height || 0;
        const targetY = dir === 1 ? h : -h;

        this._isPlaying = true;
        this.content.stopAllActions();
        this._pageChangeCallback && this._pageChangeCallback(dir, safeTargetIndex);

        if (useAnimTime > 0) {
            cc.tween(this.content)
                .to(useAnimTime, { y: targetY }, { easing: 'sineOut' })
                .call(() => {
                    this._jumpPageChanged(safeTargetIndex, completeCallback);
                })
                .start();
        } else {
            this.content.y = targetY;
            this._jumpPageChanged(safeTargetIndex, completeCallback);
        }
    }

    private _jumpPageChanged(targetIndex: number, completeCallback?: PageJumpCompleteCallback) {
        this.content.y = 0;
        this._currDataIndex = targetIndex;
        this.refreshAllNodes();
        this.resetNodePositions();
        this._isPlaying = false;
        completeCallback && completeCallback();
    }
}