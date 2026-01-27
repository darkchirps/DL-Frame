/*******************************************************************************
 * 描述:    圆形shader 挂载到圆形图节点上
*******************************************************************************/
const { ccclass, property, menu, executeInEditMode } = cc._decorator;

@ccclass
@menu("常用组件/圆形")
export default class circle extends cc.Component {
  @property({ displayName: "材质", type: cc.Material }) material: cc.Material = null;

  materialTo: cc.MaterialVariant = null;

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
      this.materialTo.name = "circleTo";
    }
    this.materialTo.setProperty('wh_ratio', this.node.width / this.node.height);
    this.node.getComponent(cc.Sprite).setMaterial(0, this.materialTo);
  }
  private sure: boolean = false;

  onLoad() {
    this.mateSure = true;
  }

}

