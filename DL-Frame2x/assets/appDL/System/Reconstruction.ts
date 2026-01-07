/*******************************************************************************
 * 描述:    引擎扩展
*******************************************************************************/
declare namespace sp {
    interface Skeleton {
        /**
         * 播放动画
         * @param name 动效名字
         * @param loop 是否循环播放
         * @param endCall 动画播放完成后的回调函数
         * @param eventCall 关键帧事件回调函数
         */
        runAni(name: string, loop: boolean, endCall?: () => void, eventCall?: (event: string) => void): void;
        /**停止当前播放的动画*/
        stopAni(): void;
        /**停止所有动画*/
        stopAllAni(): void;
        /**获取当前播放的动画名称*/
        getLastAnimationName(): string;
    }
}

// 扩展 sp.Skeleton 类
sp.Skeleton.prototype.stopAni = function (this: sp.Skeleton) {
    // 清除动画事件监听器
    this.setEventListener(null);
    // 清除动画播放完成监听器
    this.setCompleteListener(null);
};

sp.Skeleton.prototype.stopAllAni = function (this: sp.Skeleton) {
    // 清除动画事件监听器
    this.setEventListener(null);
    // 清除动画播放完成监听器
    this.setCompleteListener(null);
    // 清除所有动画轨迹
    this.clearTracks();
};

sp.Skeleton.prototype.runAni = function (this: sp.Skeleton, name: string, loop: boolean, endCall?: () => void, eventCall?: (event: string) => void) {
    if (endCall) {
        this.setCompleteListener(() => {
            // 清除动画播放完成监听器
            this.setCompleteListener(null);
            endCall();
        });
    }
    if (eventCall) {
        this.setEventListener((trackIndex, event) => {
            // 触发事件回调
            eventCall(event.data.name);
        });
    }
    // 保存当前动画名称
    //@ts-ignore
    this._lastAni = name;
    // 设置动画
    this.setAnimation(0, name, loop);
};

sp.Skeleton.prototype.getLastAnimationName = function (this: sp.Skeleton) {
    //@ts-ignore
    return this._lastAni;
};

cc.Node.prototype.click = function (callback: Function, enableScale: boolean = true, clickSoundBool: boolean = true) {
    const node = this;
    node.unclick?.();

    const originalScale = node.scale;
    let lastClickTime = 0;

    // 1. 保存回调函数并绑定正确的 this
    const boundCallback = callback.bind(node["_prefab"]["root"].getComponent(node["_prefab"]["root"].name));

    function touchStartHandler(event: cc.Event.EventTouch) {
        if (clickSoundBool) G.event.emit("NodeClick");
        if (enableScale) node.scale = originalScale * 0.95;
    }

    function touchEndHandler(event: cc.Event.EventTouch) {
        if (event.getID() !== 0) return;
        const now = performance.now();
        if (now - lastClickTime < 200) {
            restoreScale();
            return;
        }
        lastClickTime = now;
        restoreScale();
        // 2. 调用绑定后的回调
        boundCallback(node["_prefab"]["root"].getComponent(node["_prefab"]["root"].name), cc.Node.EventType.TOUCH_END, event);

        event.stopPropagation();
    }
    function touchCancelHandler() {
        restoreScale();
    }
    const restoreScale = () => {
        if (enableScale) node.scale = originalScale;
    };
    node.on(cc.Node.EventType.TOUCH_START, touchStartHandler);
    node.on(cc.Node.EventType.TOUCH_END, touchEndHandler);
    enableScale && node.on(cc.Node.EventType.TOUCH_CANCEL, touchCancelHandler);

    node.unclick = () => {
        node.off(cc.Node.EventType.TOUCH_START, touchStartHandler);
        node.off(cc.Node.EventType.TOUCH_END, touchEndHandler);
        enableScale && node.off(cc.Node.EventType.TOUCH_CANCEL, touchCancelHandler);
        delete node.unclick;
    };
    // 3. 保存组件实例引用
    if (!node._componentInstance) {
        node._componentInstance = this;
    }
};