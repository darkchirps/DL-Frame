import { Label } from 'cc';
import { CCBoolean, Component, Color, Material, _decorator, CCFloat, CCString } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, menu, executeInEditMode, requireComponent, disallowMultiple } = _decorator;

//材质渐变
@ccclass
@menu("常用Shader/文本渐变")
@requireComponent(Label)
@executeInEditMode
@disallowMultiple
export default class gradient extends Component {
    @property({ displayName: "材质", type: Material }) material: Material = null;

    @property({ displayName: "渐变色三", type: Color, group: "渐变色值" })
    color: Color[] = [];
    @property({ displayName: "从无色到1号色", type: CCFloat, min: 0, max: 0.99, step: 0.01, slide: true, group: "渐变比例" })
    mix1: number = 0;
    @property({ displayName: "从1号色到2号色", type: CCFloat, min: 0, max: 0.99, step: 0.01, slide: true, group: "渐变比例" })
    mix2: number = 0;
    @property({ displayName: "注意", group: "渐变比例", readonly: true })
    zhuyi = "上面数值一定要小于下面数值";
    @property({ displayName: "渐变色方向", type: CCFloat, min: 0, max: 1, step: 0.01, slide: true, group: "渐变设置" })
    mix3: number = 0;
    @property({ displayName: "渐变色透明度", type: CCFloat, min: 0, max: 1, step: 0.01, slide: true, group: "渐变设置" })
    mix4: number = 0;
    @property({ displayName: "注意", group: "渐变设置", readonly: true })
    zhuyi1 = "方向0竖1横 透明0无1显";

    materialTo: Material = null;
    onLoad() {
        this.updateMaterial();
    }
    updateMaterial() {
        if (this.material == null) return;
        if (this.materialTo == null) {
            this.materialTo = new Material;
            this.materialTo.copy(this.material);
            this.node.label.customMaterial = this.materialTo;
        }
        for (let i = 0; i < this.color.length; i++) {
            this.materialTo.setProperty(`color${i + 1}`, this.color[i]);
        }
        for (let i = 1; i < 5; i++) {
            this.materialTo.setProperty(`mix${i}`, this[`mix${i}`]);
        }
    }
    update(dt: number) {
        if (EDITOR && this.color.length != 0 && this.material != null) {
            this.updateMaterial();
        }
    }
}
