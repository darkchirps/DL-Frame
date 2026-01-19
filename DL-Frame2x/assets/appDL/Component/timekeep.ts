/*******************************************************************************
 * 描述:    通用倒计时组件（整合纯逻辑帧计时 + UI显示功能）
 * 特性：1. 支持帧级精准计时（毫秒级）/ 秒级计时  2. 可选是否绑定Label显示  3. 支持自定义时间格式
 *******************************************************************************/
const { ccclass, property, menu, requireComponent, disallowMultiple } = cc._decorator;

@ccclass
@menu("常用组件/倒计时管理器")
@disallowMultiple // 禁止同一节点挂载多个
export default class timeKeep extends cc.Component {

    @property({ tooltip: "倒计时时长（秒）" })
    public duration: number = 60;

    @property({ tooltip: "是否在 onLoad 时自动开始" })
    public autoStart: boolean = false;

    @property({ tooltip: "是否循环计时" })
    public loop: boolean = false;

    @property({ tooltip: "是否启用UI显示（需要节点挂载cc.Label组件）" })
    public enableDisplay: boolean = true;

    @property({ tooltip: "时间显示格式，默认 mm:s（支持y/m/d/h/mm/s占位符，天数自动带d，如7d）" })
    public timeFormat: string = "mm:s";

    @property({ tooltip: "计时精度：true=帧级（毫秒级） false=秒级（每秒更新）" })
    public framePrecision: boolean = true;

    private _remainingTime: number = 0; // 剩余时间（浮点型，保留毫秒级精度）
    private _isRunning: boolean = false;
    private _tickCallback: ((dt: number) => void) | null = null; // 帧回调（接收dt）
    private _label: cc.Label | null = null; // 显示用的Label组件

    // 事件名称常量
    private readonly EVENT_FINISHED = 'countdown-finished';
    private readonly EVENT_TICK = 'countdown-tick';
    private readonly EVENT_PAUSED = 'countdown-paused';
    private readonly EVENT_RESUMED = 'countdown-resumed';

    onLoad() {
        // 初始化剩余时间（保留毫秒级精度）
        this._remainingTime = Math.max(0, this.duration);

        // 如果启用UI显示，获取Label组件
        if (this.enableDisplay) {
            this._label = this.node.getComponent(cc.Label);
            if (!this._label) {
                cc.warn(`[UniversalTimeKeep] 节点${this.node.name}启用了UI显示，但未挂载cc.Label组件！`);
            }
            this._updateDisplay(); // 初始化显示
        }

        // 自动开始计时
        if (this.autoStart) {
            this.play();
        }
    }

    /**
     * 开始计时
     * @param duration 可选，指定计时时长（秒）
     */
    play(duration?: number): void {
        if (duration !== undefined) {
            this.duration = Math.max(0, duration);
        }

        // 停止现有计时
        this.stop();
        this._remainingTime = Math.max(0, this.duration);

        // 初始化显示
        if (this.enableDisplay) {
            this._updateDisplay();
        }

        if (this._isRunning) return;

        // 根据计时精度创建回调
        if (this.framePrecision) {
            // 帧级精度：每帧扣除dt（秒），毫秒级精准
            this._tickCallback = (dt: number) => {
                this._remainingTime -= dt;
                this._remainingTime = Math.max(0, this._remainingTime);

                // 每帧触发事件（携带精确剩余时间）
                this.node.emit(this.EVENT_TICK, this._remainingTime);

                // 帧级仅在UI开启且剩余时间整数部分变化时更新显示（避免过度刷新）
                if (this.enableDisplay && Math.floor(this._remainingTime) !== Math.floor(this._remainingTime + dt)) {
                    this._updateDisplay();
                }

                // 计时完成判断
                if (this._remainingTime <= 0) {
                    this._handleCountdownFinish();
                }
            };
            this.schedule(this._tickCallback, 0); // 每帧执行
        } else {
            // 秒级精度：每秒减1
            this._tickCallback = () => {
                this._remainingTime = Math.max(0, Math.floor(this._remainingTime) - 1);

                // 每秒触发事件（携带整数剩余时间）
                this.node.emit(this.EVENT_TICK, this._remainingTime);

                // 秒级每次都更新显示
                if (this.enableDisplay) {
                    this._updateDisplay();
                }

                // 计时完成判断
                if (this._remainingTime <= 0) {
                    this._handleCountdownFinish();
                }
            };
            this.schedule(this._tickCallback, 1); // 每秒执行
        }

        this._isRunning = true;
    }

    /**
     * 暂停计时
     */
    pause(): void {
        if (!this._isRunning) return;

        if (this._tickCallback) {
            this.unschedule(this._tickCallback);
        }

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

        // 根据精度重新调度
        if (this.framePrecision) {
            this.schedule(this._tickCallback, 0);
        } else {
            this.schedule(this._tickCallback, 1);
        }

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
     * @param duration 可选，重置计时时长（秒）
     */
    reset(duration?: number): void {
        if (duration !== undefined) {
            this.duration = Math.max(0, duration);
        }
        this._remainingTime = Math.max(0, this.duration);

        // 重置后更新显示
        if (this.enableDisplay) {
            this._updateDisplay();
        }
    }

    /**
     * 处理计时完成逻辑
     */
    private _handleCountdownFinish(): void {
        this.stop();
        this.node.emit(this.EVENT_FINISHED, this);

        // 循环计时
        if (this.loop) {
            this.play();
        }
    }

    /**
     * 更新UI显示（内置时间格式化方法）
     */
    private _updateDisplay(): void {
        if (!this._label || !this.enableDisplay) return;

        // 取整数秒数进行格式化（显示用）
        const sec = Math.max(0, Math.floor(this._remainingTime));
        this._label.string = X.timetostr(sec, this.timeFormat);
    }

    // ========== 对外暴露的属性和方法 ==========
    /**
     * 获取剩余时间（毫秒级精度）
     */
    get remainingTime(): number {
        return this._remainingTime;
    }

    /**
     * 设置剩余时间（用于外部干预）
     */
    set remainingTime(value: number) {
        this._remainingTime = Math.max(0, value);
        if (this.enableDisplay) {
            this._updateDisplay();
        }
    }

    /**
     * 获取是否正在运行
     */
    get isRunning(): boolean {
        return this._isRunning;
    }

    /**
     * 添加完成事件监听
     */
    onFinished(callback: Function, target?: any): void {
        this.node.on(this.EVENT_FINISHED, callback, target);
    }

    /**
     * 添加计时回调事件（帧级=每帧触发，秒级=每秒触发）
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