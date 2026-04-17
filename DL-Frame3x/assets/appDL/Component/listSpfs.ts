/*******************************************************************************
 * 描述:    图片切换
*******************************************************************************/
import { Rect, CCInteger, Sprite, SpriteFrame, _decorator, Component } from "cc";

const { ccclass, property, menu } = _decorator;
@ccclass
@menu("常用组件/图片切换")
export default class listSpfs extends Component {

    @property(SpriteFrame)
    spfs: Array<SpriteFrame> = [];
    @property({
        type: CCInteger,
        min: 0,
        max: 10,
        step: 1,
        slide: true
    })
    get spriteIndex() {
        return this._spriteIndex;
    }
    set spriteIndex(index: number) {
        const spr = this.node.getComponent(Sprite);
        if (spr) spr.spriteFrame = this.spfs[index] ?? null;
        this._spriteIndex = index;
        this.nowIdx = index; // 统一维护 nowIdx
    }
    private _spriteIndex: number = 0;

    getSpf(idx) {
        return this.spfs[idx];
    }

    setSpf(idx: number) {
        const spr = this.node.getComponent(Sprite);
        if (spr) {
            this.nowIdx = idx;
            this._spriteIndex = idx;
            spr.spriteFrame = this.spfs[idx] ?? null;
        }
    }

    nowIdx: number = 0;

    get rectData(): Rect {
        const spf = this.spfs[this.nowIdx];
        if (!spf) {
            console.warn(`listSpfs: spfs[${this.nowIdx}] is null or out of range`);
            return new Rect();
        }
        return spf.rect;
    }
}