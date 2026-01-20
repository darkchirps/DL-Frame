import { CCBoolean, Component, Color, Material, _decorator, CCFloat, CCString, Sprite, SpriteFrame } from 'cc';
const { ccclass, property, menu, requireComponent, disallowMultiple } = _decorator;

//图片马赛克
@ccclass
@requireComponent(Sprite)
@disallowMultiple
@menu("常用组件/图片马赛克")
export default class jianbian extends Component {
    @property({ displayName: "材质", type: Material }) material: Material = null;
    materialTo: Material = null;

    _mSize: number = 0;
    @property({ displayName: "模糊度", type: CCFloat, min: 0.01, max: 0.5, step: 0.01, slide: true })
    get mSize(): number {
        return this._mSize;
    }
    set mSize(value: number) {
        this._mSize = value;
        if (!this.material) {
            console.error("Material not assigned!");
            return;
        }
        if (this.materialTo == null) {
            let meta = new Material;
            meta.copy(this.material);
            this.materialTo = meta;
            this.node.sprite.customMaterial = this.materialTo;
        }
        this.materialTo.setProperty("pixelSize", value);
        this.materialTo.setProperty("mainTexture", this.node.sprite.spriteFrame.getGFXTexture());
    }
}
