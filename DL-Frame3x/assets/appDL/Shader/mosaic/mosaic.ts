import { CCBoolean, Component, Color, Material, _decorator, CCFloat, CCString, Sprite, SpriteFrame } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, menu, requireComponent, disallowMultiple, executeInEditMode } = _decorator;

//图片马赛克
@ccclass
@menu("常用Shader/图片马赛克")
@requireComponent(Sprite)
@executeInEditMode
@disallowMultiple
export default class mosaic extends Component {
    @property({ displayName: "材质", type: Material }) material: Material = null;
    materialTo: Material = null;

    @property({ displayName: "模糊度", type: CCFloat, min: 0.01, max: 0.5, step: 0.01, slide: true }) mSize: number = 0.1;

    onLoad() {
        this.updateMaterial();
    }
    updateMaterial() {
        if (this.material == null) return;
        if (this.materialTo == null) {
            this.materialTo = new Material;
            this.materialTo.copy(this.material);
            this.node.sprite.customMaterial = this.materialTo;
        }
        this.materialTo.setProperty("pixelSize", this.mSize);
        this.materialTo.setProperty("mainTexture", this.node.sprite.spriteFrame.getGFXTexture());
    }
    update(dt: number) {
        if (EDITOR && this.material != null) {
            this.updateMaterial();
        }
    }
}
