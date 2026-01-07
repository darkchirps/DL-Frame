/*******************************************************************************
 * 描述:    扩展组件
*******************************************************************************/
import { Node, v2, EventTouch, sp, Touch } from "cc";
import { Gvent } from "./GlobalEventEnum";

declare module "cc" {
    namespace sp {
        interface Skeleton {
            /**
             * @param name 动效名字
             * @param loop 循环
             * @param endCall 一次播放完成回调
             * @param loop 关键帧回调
             */
            runAni(name: string, loop: boolean, endCall?: () => void, eventCall?: (event: string) => void): void;
            stopAllAni(): void;
            stopAni(): void;
            getLastAnimationName(): string;
        }
    }
    namespace AssetManager {
        interface Bundle {
            config: {
                paths: Cache;
            };
        }
    }
    interface Node {
        schedule: Component["schedule"];
        scheduleOnce: Component["scheduleOnce"];
        unschedule: Component["unschedule"];
        unscheduleAllCallbacks: Component["unscheduleAllCallbacks"];
        nodeScheduleComponent: Component;
        /**设置节点是否置灰true置灰反之取消置灰*/
        setGray(isGray: boolean): void;
    }
}
sp.Skeleton.prototype.stopAni = function (this: sp.Skeleton) {
    this.setEventListener(null);
    this.setCompleteListener(null);
};
sp.Skeleton.prototype.stopAllAni = function (this: sp.Skeleton) {
    this.setEventListener(null);
    this.setCompleteListener(null);
    this.clearTracks();
};
sp.Skeleton.prototype.runAni = function (this: sp.Skeleton, name: string, loop: boolean, endCall?: () => void, eventCall?: (event: string) => void) {
    if (endCall) {
        this.setCompleteListener(() => {
            this.setCompleteListener(null);
            endCall();
        });
    }
    if (eventCall) {
        this.setEventListener((x, ev: any) => {
            eventCall(ev.data.name);
        });
    }
    //@ts-ignore
    this._lastAni = name;
    this.setAnimation(0, name, loop);
};
sp.Skeleton.prototype.getLastAnimationName = function () {
    //@ts-ignore
    return this._lastAni;
};

Node.prototype.schedule = function (this: Node, callback: Function, interval?: number, repeat?: number, delay?: number) {
    return this.nodeScheduleComponent.schedule(callback, interval, repeat, delay);
};

Node.prototype.scheduleOnce = function (this: Node, callback: Function, delay?: number) {
    return this.nodeScheduleComponent.scheduleOnce(callback, delay);
};

Node.prototype.unschedule = function (this: Node, callback_fn: Function) {
    return this.nodeScheduleComponent.unschedule(callback_fn);
};

Node.prototype.unscheduleAllCallbacks = function (this: Node) {
    return this.nodeScheduleComponent.unscheduleAllCallbacks();
};

Node.prototype.setGray = function (this: Node, isGray: boolean) {
    if (this.sprite) this.sprite.grayscale = isGray;
    if (this.spine) {
        this.spine.customMaterial = isGray ? G.materials["spine-gray"] : null;
    }
};

//全局点击锁
// 全局点击锁（单例模式）
const clickLock = {
    nextClickTime: 0,
    get canClick() {
        return Date.now() >= this.nextClickTime;
    },
    lock(duration: number) {
        this.nextClickTime = Date.now() + duration * 1000;
    }
};

// 事件类型常量
const TouchEvents = {
    DEFAULT: [
        Node.EventType.TOUCH_START,
        Node.EventType.TOUCH_MOVE,
        Node.EventType.TOUCH_END,
        Node.EventType.TOUCH_CANCEL
    ],
    CLICK: [Node.EventType.TOUCH_END],
    LONG_PRESS: [Node.EventType.TOUCH_START, Node.EventType.TOUCH_CANCEL, Node.EventType.TOUCH_END]
};

// 核心触摸事件处理器
Node.prototype.touch = function (fun: Function, conf: any = {}) {
    // 清理旧事件绑定
    if (this._touchHandler) {
        this._touchHandler.cleanup();
    }
    // 创建新处理器
    this._touchHandler = new TouchHandler(this, fun, {
        touchTypes: conf.onTouchTypes || TouchEvents.DEFAULT,
        longPressDelay: conf.longTouchDelay,
        clickDelay: conf.touchDelay || 0,
        stopPropagation: conf.propagationStopped !== false,
        preventSwallow: conf.preventSwallow || false
    });
};

// 点击事件快捷方法
Node.prototype.click = function (fun: Function, enableScale: boolean = true) {
    const scaleStart = this.scaleXY;
    const scaleEffect = enableScale ? 0.05 : 0;

    // 创建点击动画效果
    new TouchHandler(this, (_, type) => {
        if (type === Node.EventType.TOUCH_START) this.scaleXY = scaleStart - scaleEffect;
        if ([Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL].includes(type)) {
            this.scaleXY = scaleStart;
        }
    }, { touchTypes: TouchEvents.LONG_PRESS });

    // 创建点击事件处理器
    new TouchHandler(this, (sender, type) => {
        if (type === Node.EventType.TOUCH_END) fun(sender);
    }, {
        touchTypes: TouchEvents.CLICK,
        clickDelay: 0.2
    });
};

// 触摸处理器（封装核心逻辑）
class TouchHandler {
    private node: Node;
    private callback: Function;
    private config: any;
    private longPressTimer: number = 0;
    private moveDistance = v2();

    constructor(node: Node, callback: Function, config: any) {
        this.node = node;
        this.callback = callback;
        this.config = config;

        this.bindEvents();
    }

    private bindEvents() {
        this.config.touchTypes.forEach((type: string) => {
            this.node.on(type, this.handleEvent, this);
        });
    }

    cleanup() {
        this.config.touchTypes.forEach((type: string) => {
            this.node.off(type, this.handleEvent, this);
        });
        this.clearLongPressTimer();
    }

    private handleEvent(event: EventTouch) {
        if (this.node._touchEnabled === false) return;

        // 事件传播控制
        event.propagationStopped = this.config.stopPropagation;
        event.preventSwallow = this.config.preventSwallow;

        const now = Date.now();
        const type = event.type;

        switch (type) {
            case Node.EventType.TOUCH_START:
                this.handleTouchStart(event);
                break;
            case Node.EventType.TOUCH_MOVE:
                this.handleTouchMove(event);
                break;
            case Node.EventType.TOUCH_END:
                this.handleTouchEnd(event, now);
                break;
            case Node.EventType.TOUCH_CANCEL:
                this.handleTouchCancel();
                break;
        }

        this.safeCallback(type, event);
    }

    private handleTouchStart(event: EventTouch) {
        this.moveDistance = v2();
        this.setupLongPressTimer();
    }

    private handleTouchMove(event: EventTouch) {
        this.moveDistance.add2f(Math.abs(event.getDeltaX()), Math.abs(event.getDeltaY()));
    }

    private handleTouchEnd(event: EventTouch, timestamp: number) {
        if (this.config.clickDelay > 0) {
            clickLock.lock(this.config.clickDelay);
        }

        // 触发无移动点击
        if (this.moveDistance.length() < 5) {
            this.callback(this.node, Node.EventType.TOUCH_NOMOVE, event);
        }

        this.clearLongPressTimer();
        G.event.emit(Gvent.NodeClick, this.node);
    }

    private handleTouchCancel() {
        this.clearLongPressTimer();
    }

    private setupLongPressTimer() {
        if (!this.config.longPressDelay) return;

        this.longPressTimer = setTimeout(() => {
            if (!this.node.isValid) return;
            this.callback(this.node, Node.EventType.TOUCH_LONG, null);
        }, this.config.longPressDelay) as unknown as number;
    }

    private clearLongPressTimer() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = 0;
        }
    }

    private safeCallback(type: string, event: EventTouch) {
        try {
            this.callback(this.node, type, event);
        } catch (error) {
            console.error('Touch callback error:', error);
        }
    }
}
//触发指定事件
Node.prototype.triggerTouch = function (type: string) {
    if (!this._touchFunction) return null;
    let event = new EventTouch([new Touch(0, 0)], false, type);
    event.type = type;
    this.emit(type, event, 'fromcode');
};
