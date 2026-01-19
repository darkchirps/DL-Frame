/*******************************************************************************
 * 描述:    文本,图片渐变效果
*******************************************************************************/
const { ccclass, property, menu, executeInEditMode } = cc._decorator;

@ccclass
@menu("常用组件/文本图片渐变")
export default class jianbian extends cc.Component {
    @property({ displayName: "材质", type: cc.Material }) material: cc.Material = null;

    materialTo: cc.MaterialVariant = null;

    @property({ displayName: "开始色" }) color1: cc.Color = new cc.Color(0, 0, 0);
    @property({ displayName: "结束色" }) color2: cc.Color = new cc.Color(0, 0, 0);


    @property({ displayName: "效果确定展示", type: cc.Boolean })
    get mateSure() {
        return this.sure;
    }
    set mateSure(state: boolean) {
        this.sure = state;
        if (!this.material) {
            console.error("Material not assigned!");
            return;
        }
        if (this.materialTo == null) {
            this.materialTo = cc.MaterialVariant.create(this.material, this.node.getComponent(cc.RenderComponent));
            this.materialTo.name = "jianbianTo";
            (this.node.getComponent(cc.Label) ? this.node.getComponent(cc.Label) : this.node.getComponent(cc.Sprite)).setMaterial(0, this.materialTo);
        }
        this.materialTo.setProperty("beginColor", this.color1);
        this.materialTo.setProperty("endColor", this.color2);
    }
    private sure: boolean = false;

    onLoad() {
        this.mateSure = true;
    }
}
