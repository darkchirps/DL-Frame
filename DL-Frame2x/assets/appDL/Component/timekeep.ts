/*******************************************************************************
 * 描述:    计时节点挂载 内含开始，暂停，继续，结束等功能
*******************************************************************************/
const { ccclass, property, menu, requireComponent } = cc._decorator;

@ccclass
@menu("常用组件/timekeep")
@requireComponent(cc.Label)
export default class TimeKeep extends cc.Component {

    @property({ tooltip: "倒计时时长（秒）" })
    public duration: number = 60;

    @property({ tooltip: "是否在 onLoad 时自动开始" })
    public autoStart: boolean = false;

    @property({ tooltip: "是否循环计时" })
    public loop: boolean = false;

    @property({ tooltip: "时间格式，默认 mm:s" })
    public timeFormat: string = "mm:s";

    private _remainingTime: number = 0;
    private _isRunning: boolean = false;
    private _tickCallback: (() => void) | null = null;

    // 事件名称常量
    private readonly EVENT_FINISHED = 'countdown-finished';
    private readonly EVENT_TICK = 'countdown-tick';
    private readonly EVENT_PAUSED = 'countdown-paused';
    private readonly EVENT_RESUMED = 'countdown-resumed';

    onLoad() {
        if (this.autoStart) {
            this.play();
        }
    }

    /**
     * 开始计时
     * @param duration 可选，指定计时时长
     */
    play(duration?: number): void {
        if (duration !== undefined) {
            this.duration = duration;
        }

        this.stop();
        this._remainingTime = Math.max(0, Math.floor(this.duration));
        this._updateDisplay();
        
        if (this._isRunning) return;

        this._tickCallback = () => {
            this._remainingTime--;
            this._updateDisplay();
            this.node.emit(this.EVENT_TICK, this._remainingTime);

            if (this._remainingTime <= 0) {
                this._handleCountdownFinish();
            }
        };

        this.schedule(this._tickCallback, 1);
        this._isRunning = true;
    }

    /**
     * 暂停计时
     */
    pause(): void {
        if (!this._isRunning) return;
        
        this.unschedule(this._tickCallback);
        this._isRunning = false;
        this.node.emit(this.EVENT_PAUSED, this._remainingTime);
    }

    /**
     * 继续计时
     */
    resume(): void {
        if (this._isRunning) return;

        if (!this._tickCallback) {
            this.play();
            return;
        }

        this.schedule(this._tickCallback, 1);
        this._isRunning = true;
        this.node.emit(this.EVENT_RESUMED, this._remainingTime);
    }

    /**
     * 停止计时
     */
    stop(): void {
        if (this._tickCallback) {
            this.unschedule(this._tickCallback);
        }
        this._isRunning = false;
        this._tickCallback = null;
    }

    /**
     * 重置计时器
     * @param duration 可选，重置计时时长
     */
    reset(duration?: number): void {
        if (duration !== undefined) {
            this.duration = Math.max(0, Math.floor(duration));
        }
        this._remainingTime = Math.max(0, Math.floor(this.duration));
        this._updateDisplay();
    }

    /**
     * 处理计时完成逻辑
     */
    private _handleCountdownFinish(): void {
        this.stop();
        this.node.emit(this.EVENT_FINISHED, this);

        if (this.loop) {
            this.play();
        }
    }

    /**
     * 更新显示
     */
    private _updateDisplay(): void {
        const label = this.node.getComponent(cc.Label);
        if (label) {
            label.string = X.timetostr(this._remainingTime, this.timeFormat);
        }
    }

    /**
     * 获取剩余时间
     */
    get remainingTime(): number {
        return this._remainingTime;
    }

    /**
     * 获取是否正在运行
     */
    get isRunning(): boolean {
        return this._isRunning;
    }

    /**
     * 设置剩余时间（用于外部干预）
     */
    set remainingTime(value: number) {
        this._remainingTime = Math.max(0, value);
        this._updateDisplay();
    }

    /**
     * 添加完成事件监听
     */
    onFinished(callback: Function, target?: any): void {
        this.node.on(this.EVENT_FINISHED, callback, target);
    }

    /**
     * 添加每秒触发事件监听
     */
    onTick(callback: Function, target?: any): void {
        this.node.on(this.EVENT_TICK, callback, target);
    }

    /**
     * 添加暂停事件监听
     */
    onPaused(callback: Function, target?: any): void {
        this.node.on(this.EVENT_PAUSED, callback, target);
    }

    /**
     * 添加继续事件监听
     */
    onResumed(callback: Function, target?: any): void {
        this.node.on(this.EVENT_RESUMED, callback, target);
    }

    /**
     * 移除所有事件监听
     */
    removeAllEventListeners(): void {
        this.node.targetOff(this);
    }

    onDestroy() {
        this.stop();
        this.removeAllEventListeners();
    }
}