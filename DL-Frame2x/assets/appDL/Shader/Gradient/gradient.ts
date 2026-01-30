/*******************************************************************************
 * 描述:    文本渐变效果
 * 修改:    增加了对材质宏定义(Defines)的切换逻辑，支持水平/垂直切换
*******************************************************************************/

/** 编辑器状态枚举 */
let EditIndex = cc.Enum({
    Horizontal: 0,
    Vertical: 1
});

const { ccclass, property, menu, executeInEditMode, requireComponent, disallowMultiple } = cc._decorator;

@ccclass
@menu("常用Shader/文本渐变")
@executeInEditMode
@requireComponent(cc.Label) // 确保节点上有渲染组件(Sprite或Label)
@disallowMultiple()
export default class gradient extends cc.Component {

    @property({ displayName: "材质", type: cc.Material })
    material: cc.Material = null;

    // 内部使用的材质变体，保证不修改原始材质资源
    private materialTo: cc.MaterialVariant = null;

    @property({ displayName: "开始色" })
    color1: cc.Color = new cc.Color(255, 255, 255, 255);

    @property({ displayName: "结束色" })
    color2: cc.Color = new cc.Color(0, 0, 0, 255);

    @property({ displayName: "方向", type: EditIndex, tooltip: "Horizontal: 水平\nVertical: 垂直" })
    direction = 0;

    onLoad() {
        this.updateMaterial();
    }

    update(dt) {
        if (CC_EDITOR) {
            this.updateMaterial();
        }
    }

    private updateMaterial() {
        if (!this.material) return;
        let renderComp = this.node.getComponent(cc.Label);
        if (!renderComp) return;
        // 1. 创建材质变体 (MaterialVariant)
        // 使用变体是为了确保修改只会影响当前节点，而不会影响所有使用该材质的节点
        if (this.materialTo == null) {
            this.materialTo = cc.MaterialVariant.create(this.material, renderComp);
        }
        // 2. 处理方向逻辑 (修改 Defines)
        // 0: Horizontal (水平), 1: Vertical (垂直)
        let isHorizontal = (this.direction === 0);
        // define 方法的第三个参数是 pass/technique 索引，通常是 0
        this.materialTo.define("IS_HORIZONTAL", isHorizontal, 0);
        this.materialTo.define("IS_VERTICAL", !isHorizontal, 0);
        // 3. 设置颜色属性 (修改 Uniforms)
        this.materialTo.setProperty("beginColor", this.color1);
        this.materialTo.setProperty("endColor", this.color2);
        // 4. 应用材质给组件
        // 获取当前使用的材质，如果不是我们创建的变体，才重新赋值，避免频繁 setMaterial
        if (renderComp.getMaterial(0) !== this.materialTo) {
            renderComp.setMaterial(0, this.materialTo);
        }
    }
}
