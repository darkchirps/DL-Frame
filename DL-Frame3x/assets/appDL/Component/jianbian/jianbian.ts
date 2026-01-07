import { CCBoolean, Component, Color, Material, _decorator, CCFloat, CCString } from 'cc';
const { ccclass, property, menu } = _decorator;

//材质渐变
@ccclass
@menu("常用材质组件/jianbian")
export default class jianbian extends Component {
    @property({ displayName: "材质", type: Material }) material: Material = null;

    @property({ displayName: "渐变色三", type: Color, group: "渐变色值" })
    color: Color[] = [];
    @property({ displayName: "从无色到1号色", type: CCFloat, min: 0, max: 0.99, step: 0.01, slide: true, group: "渐变比例" })
    mix1: number = 0;
    @property({ displayName: "从1号色到2号色", type: CCFloat, min: 0, max: 0.99, step: 0.01, slide: true, group: "渐变比例" })
    mix2: number = 0;
    @property({ displayName: "注意", group: "渐变比例", readonly: true })
    zhuyi = "颜色从2号到3号色比例为1-1号到2号比例";
    @property({ displayName: "渐变色方向", type: CCFloat, min: 0, max: 1, step: 0.01, slide: true, group: "渐变设置" })
    mix3: number = 0;
    @property({ displayName: "渐变色透明度", type: CCFloat, min: 0, max: 1, step: 0.01, slide: true, group: "渐变设置" })
    mix4: number = 0;
    @property({ displayName: "注意", group: "渐变设置", readonly: true })
    zhuyi1 = "方向0竖1横 透明0无1显";
    @property({ displayName: "效果确定展示", type: CCBoolean })
    get mateSure() {
        return this.sure;
    }
    set mateSure(state: boolean) {
        this.sure = state;
        let mate = new Material;
        if (!this.material) {
            console.error("Material not assigned!");
            return;
        }
        mate.copy(this.material);
        for (let i = 0; i < this.color.length; i++) {
            mate.setProperty(`color${i + 1}`, this.color[i]);
        }
        for (let i = 1; i < 5; i++) {
            mate.setProperty(`mix${i}`, this[`mix${i}`]);
        }
        (this.node.label ? this.node.label : this.node.sprite).customMaterial = mate;
    }
    private sure: boolean = false;

    onLoad() {
        this.mateSure = true;
    }
}
