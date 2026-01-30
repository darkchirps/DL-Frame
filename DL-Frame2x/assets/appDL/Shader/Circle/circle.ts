/*******************************************************************************
 * 描述:    圆形shader 挂载到圆形图节点上
*******************************************************************************/
const { ccclass, property, menu, executeInEditMode } = cc._decorator;

@ccclass
@menu("常用Shader/圆形图片")
@executeInEditMode
export default class circle extends cc.Component {
  @property({ displayName: "材质", type: cc.Material }) material: cc.Material = null;

  materialTo: cc.MaterialVariant = null;

  onLoad() {
    this.updateMaterial();
  }

  update(dt) {
    if (CC_EDITOR) {
      this.updateMaterial();
    }
  }
  updateMaterial() {
    if (!this.material) return;

    let renderComp = this.node.getComponent(cc.Sprite);
    if (!renderComp) return;

    if (this.materialTo == null) {
      this.materialTo = cc.MaterialVariant.create(this.material, renderComp);
    }
    this.materialTo.setProperty('wh_ratio', this.node.width / this.node.height);
    renderComp.setMaterial(0, this.materialTo);
  }
}

