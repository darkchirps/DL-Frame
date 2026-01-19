/*******************************************************************************
 * 描述:    节点上挂载多个图片资源 随意切换
*******************************************************************************/
const { ccclass, property, menu } = cc._decorator;
@ccclass
@menu("常用组件/图片切换")
export default class listSpfs extends cc.Component {

  @property(cc.SpriteFrame)
  spfs: Array<cc.SpriteFrame> = [];
  @property({
    type: cc.Integer,
    min: 0,
    max: 10,
    step: 1,
    slide: true
  })
  get spriteIndex() {
    return this._spriteIndex;
  }
  set spriteIndex(index: number) {
    this.node.getComponent(cc.Sprite).spriteFrame = this.spfs[index] || null;
    this._spriteIndex = index;
  }
  private _spriteIndex: number = 0;

  /**当前图idx*/
  get idx() {
    return this.index;
  }
  index: number = 0;

  getSpf(idx) {
    return this.spfs[idx];
  }

  setSpf(idx: number) {
    let spr = this.node.getComponent(cc.Sprite)
    if (spr) {
      this.index = idx;
      spr.spriteFrame = this.spfs[idx];
    }
  }

}
