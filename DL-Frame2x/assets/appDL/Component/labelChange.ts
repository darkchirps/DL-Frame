/*******************************************************************************
 * 描述:    数字变化组件
*******************************************************************************/
const { ccclass, property, menu } = cc._decorator;
@ccclass
@menu("常用组件/labelChange")
export default class labelChange extends cc.Label {
    @property({ tooltip: "默认为每帧都改变" })
    private frameNum: number = 1;

    private duration: number = 0; // 持续时间
    private callback: Function | null = null; // 完成回调
    private isAnimating: boolean = false; // 是否开始
    private speed: number = 0; // 变化速度
    private end: number = 0; // 最终值
    private isPaused: boolean = false; // 是否暂停
    private dtCount: number = 0; // 更新计数

    private _num: number = 0;
    public set num(value: number) {
        this._num = value;
        this.updateLabel();
    }
    public get num(): number {
        return this._num;
    }

    @property({ tooltip: "是否显示逗号" })
    isComma: boolean = false;

    @property({ tooltip: "是否去整" })
    isInteger: boolean = true;

    @property({ tooltip: "最前面添加内容" })
    public prefix: string = "";

    public numChange: (num: number) => void = null;

    /** 刷新label */
    protected updateLabel() {
        if (typeof this._num !== "number") return;

        const formattedNum = this.isInteger
            ? this.formatInteger(this._num)
            : this.formatCurrency(this._num, 3);

        this.string = this.prefix + formattedNum;
        this.numChange?.(Number(formattedNum));
    }

    /** 格式化为整数 */
    private formatInteger(num: number): string {
        const absNum = Math.abs(num);
        const isNegative = num < 0;
        const integerPart = Math.floor(absNum);
        return (isNegative ? '-' : '') + this.convertToFormattedString(integerPart.toString());
    }

    /** 格式化为货币 */
    private formatCurrency(num: number, decimalPlaces: number): string {
        const absNum = Math.abs(num);
        const isNegative = num < 0;
        const str = absNum.toFixed(decimalPlaces);
        const [integerPart, decimalPart] = str.split(".");
        return (isNegative ? '-' : '') +
            this.convertToFormattedString(integerPart) + "." + decimalPart;
    }

    /** 转换为带逗号的字符串 */
    private convertToFormattedString(value: string): string {
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    onDestroy() {
        this.numChange = null; // 避免内存泄漏
    }

    /** 暂停 */
    public pause() {
        this.isPaused = true;
    }

    /** 恢复 */
    public resume() {
        this.isPaused = false;
    }

    /**
     * 变化到某值
     * @param {number} duration
     * @param {number} end
     * @param {Function} [callback]
     */
    public changeTo(duration: number, end: number, callback?: Function) {
        if (duration <= 0) {
            this.num = end;
            callback?.();
            return;
        }
        this.startAnimation(duration, this.num, end, callback);
    }

    /**
     * 变化值
     * @param {number} duration
     * @param {number} value
     * @param {Function} [callback]
     */
    public changeBy(duration: number, value: number, callback?: Function) {
        this.changeTo(duration, this.num + value, callback);
    }

    /** 立刻停止 */
    public stop(excCallback: boolean = true) {
        this.num = this.end;
        this.isAnimating = false;
        if (excCallback && this.callback) this.callback();
    }

    /** 开始播放动画 */
    private startAnimation(duration: number, begin: number, end: number, callback?: Function) {
        this.duration = duration;
        this.end = end;
        this.callback = callback;
        this.speed = (end - begin) / duration;
        this.num = begin;
        this.isAnimating = true;
    }

    /** 更新 */
    update(dt: number) {
        if (this.isPaused || !this.isAnimating) return;

        const frameMod = this.dtCount++ % this.frameNum;
        if (frameMod === 0) {
            if (this.num === this.end) {
                this.isAnimating = false;
                this.callback?.();
                return;
            }

            this.num += dt * this.speed * this.frameNum;
            if (this.hasReachedEnd(this.num)) {
                this.num = this.end;
                this.isAnimating = false;
                this.callback?.();
            }
        }
    }

    /** 检查是否到达结束值 */
    private hasReachedEnd(num: number): boolean {
        return this.speed > 0 ? num >= this.end : num <= this.end;
    }
}