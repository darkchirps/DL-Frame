/*******************************************************************************
 * 描述:    数字变化组件
*******************************************************************************/
import { _decorator, Label } from "cc";

const { ccclass, property, menu } = _decorator;

@ccclass('labelChange')
@menu("常用组件/labelChange")
export default class LabelChange extends Label {
    //默认为每帧都改变
    private frameNum: number = 1;

    // @property({ tooltip: "是否显示逗号" })
    public isComma: boolean = false;

    // @property({ tooltip: "是否去整" })
    public isInteger: boolean = true;

    // @property({ tooltip: "最前面添加内容" })
    public prefix: string = "";

    // 动画状态
    private duration: number = 0;
    private callback: (() => void) | null = null;
    private isAnimating: boolean = false;
    private speed: number = 0;
    private begin: number = 0;
    private end: number = 0;
    private elapsed: number = 0;
    private isPaused: boolean = false;
    private tickCount: number = 0; // 用于减少界面更新频率

    private _num: number = 0;
    public set num(value: number) {
        this._num = value;
        // 节流更新，如果 frameNum 为 1 则每帧都刷新
        if (this.tickCount++ % Math.max(1, this.frameNum) === 0) {
            this.updateLabel();
        }
    }
    public get num(): number {
        return this._num;
    }

    public numChange: ((num: number) => void) | null = null;

    protected updateLabel() {
        if (typeof this._num !== 'number' || isNaN(this._num)) return;

        const formatted = this.formatNumber(this._num);
        this.string = this.prefix + formatted;
        // 回调传递真实数字，避免把带逗号的字符串转为 Number 导致 NaN
        this.numChange?.(this._num);
    }

    private formatNumber(value: number, decimalPlaces: number = 3): string {
        const sign = value < 0 ? '-' : '';
        const abs = Math.abs(value);

        if (this.isInteger) {
            let intStr = Math.trunc(abs).toString();
            if (this.isComma) intStr = this.addCommas(intStr);
            return sign + intStr;
        }

        const fixed = abs.toFixed(decimalPlaces);
        const [intPart, decPart] = fixed.split('.');
        const intFmt = this.isComma ? this.addCommas(intPart) : intPart;
        return sign + intFmt + '.' + decPart;
    }

    private addCommas(s: string) {
        return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    onDestroy() {
        this.numChange = null;
        this.callback = null;
        this.isAnimating = false;
    }

    public pause() {
        this.isPaused = true;
    }

    public resume() {
        this.isPaused = false;
    }

    public changeTo(duration: number, end: number, callback?: () => void) {
        if (duration <= 0) {
            this.num = end;
            callback?.();
            return;
        }
        this.startAnimation(duration, this.num, end, callback);
    }

    public changeBy(duration: number, value: number, callback?: () => void) {
        this.changeTo(duration, this.num + value, callback);
    }

    public stop(excCallback: boolean = true) {
        this.num = this.end;
        this.isAnimating = false;
        if (excCallback) this.callback?.();
        this.callback = null;
    }

    private startAnimation(duration: number, begin: number, end: number, callback?: () => void) {
        this.duration = duration;
        this.begin = begin;
        this.end = end;
        this.callback = callback ?? null;
        this.elapsed = 0;
        this.speed = (end - begin) / duration;
        this.isAnimating = true;
    }

    update(dt: number) {
        if (this.isPaused || !this.isAnimating) return;

        this.elapsed += dt;
        const t = Math.min(this.elapsed, this.duration);
        const current = this.begin + this.speed * t;
        this.num = current;

        if (this.elapsed >= this.duration) {
            this.num = this.end;
            this.isAnimating = false;
            const cb = this.callback;
            this.callback = null;
            cb?.();
        }
    }
}