/*******************************************************************************
 * 描述:    图片切换
*******************************************************************************/
import { Rect, CCInteger, SpriteFrame, _decorator, Component } from "cc";

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
        this.node.sprite.spriteFrame = this.spfs[index] || null;
        this._spriteIndex = index;
    }
    private _spriteIndex: number = 0;

    getSpf(idx) {
        return this.spfs[idx];
    }

    setSpf(idx: number) {
        let spr = this.node.sprite;
        if (spr) {
            this.nowIdx = idx;
            spr.spriteFrame = this.spfs[idx];
        }
    }

    nowIdx: number = 0;

    get rectData(): Rect {
        return this.spfs[this.nowIdx].rect;
    }
}