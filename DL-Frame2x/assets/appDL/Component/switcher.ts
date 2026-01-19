/*******************************************************************************
 * 单节点状态切换器（优化保持逻辑不变）
 * 功能：为多个节点存储不同状态，并可在编辑器中一键切换、保存
*******************************************************************************/
const { ccclass, property, executeInEditMode, menu } = cc._decorator;

/** 编辑器状态枚举 */
let EditIndex = cc.Enum({
    状态1: 0,
    状态2: 1,
    状态3: 2,
    状态4: 3,
    状态5: 4,
    状态6: 5,
    状态7: 6,
});

/** 单个节点的属性记录结构 */
@ccclass("cData")
export class cData {

    @property(cc.Boolean)
    public active: boolean = true;

    @property(cc.Vec3)
    public position: cc.Vec3 = cc.v3(0, 0, 0);

    @property(cc.Vec2)
    public scale: cc.Vec2 = cc.v2(1, 1);

    @property(cc.Vec2)
    public size: cc.Vec2 = cc.v2(0, 0);

    @property(cc.Vec3)
    public color: cc.Vec3 = cc.v3(255, 255, 255);

    @property(cc.Integer)
    public opacity: number = 255;

    @property(cc.SpriteFrame)
    public spriteFrame: cc.SpriteFrame = null;

    @property(cc.Vec3)
    public labelOutlineColor: cc.Vec3 = cc.v3(255, 255, 255);
    @property(cc.Integer)
    public labelOutlineWidth: number = 2;
}

/** 包装类：存储一个状态对应的多个节点数据 */
@ccclass("StateDataWrapper")
export class StateDataWrapper {
    @property({ type: [cData] })
    data: cData[] = [];
}

@ccclass
@menu("常用组件/状态切换器")
@executeInEditMode()
export default class switcher extends cc.Component {

    /** 内部真实状态索引 */
    @property({ displayName: "visible_false", type: cc.Integer, visible: false })
    public _statusIndex: number = -1;

    /** 可在编辑器选择的状态 */
    @property({ displayName: "切换状态", type: EditIndex })
    get statusIndex() {
        return this._statusIndex;
    }
    set statusIndex(val: number) {
        this._statusIndex = val;
        this.changeState();
    }

    /** 需要被管理的节点数组 */
    @property({ displayName: "选中节点", type: [cc.Node] })
    nodeArr: cc.Node[] = [];

    /** 编辑器点击保存按钮 */
    private _isEditing = false;

    @property({ displayName: "点击保存", type: cc.Boolean })
    get isEditing() {
        return this._isEditing;
    }
    set isEditing(val: boolean) {
        this._isEditing = val;
        this._save();
    }

    /** 所有状态的数据 */
    @property({ displayName: "节点属性", type: [StateDataWrapper] })
    statusData: StateDataWrapper[] = [];

    protected onLoad(): void {
        // 初始化状态（避免空引用）
        if (this._statusIndex >= 0) {
            this.changeState();
        }
    }

    /**
     * 切换状态
     */
    changeState() {
        const state = this.statusData[this.statusIndex];
        if (!state) return;
        if (!state.data) return;

        this.changeNodeProp(state.data);
    }

    /**
     * 将状态属性应用到节点
     * @param datas cData 数组，对应 nodeArr
     */
    private changeNodeProp(datas: cData[]) {
        const len = Math.min(datas.length, this.nodeArr.length);

        for (let i = 0; i < len; i++) {
            const node = this.nodeArr[i];
            const data = datas[i];
            if (!node || !data) continue;

            node.active = data.active;
            node.position = data.position.clone();
            node.scaleX = data.scale.x;
            node.scaleY = data.scale.y;
            node.setContentSize(data.size.x, data.size.y);
            node.color = new cc.Color(data.color.x, data.color.y, data.color.z);
            node.opacity = data.opacity;

            const sprite = node.getComponent(cc.Sprite);
            if (sprite) {
                sprite.spriteFrame = data.spriteFrame || null;
            }
            const labelOutline = node.getComponent(cc.LabelOutline);
            if (labelOutline) {
                labelOutline.color = new cc.Color(data.labelOutlineColor.x, data.labelOutlineColor.y, data.labelOutlineColor.z);
                labelOutline.width = data.labelOutlineWidth;
            }
        }
    }

    /**
     * 采集当前节点状态，用于保存按钮
     */
    private _getNodeSaveData(): cData[] {
        const datas: cData[] = [];

        for (let i = 0; i < this.nodeArr.length; i++) {
            const node = this.nodeArr[i];
            if (!node) continue;

            const data = new cData();
            data.active = node.active;
            data.position = node.position.clone();
            data.size = cc.v2(node.width, node.height);
            data.scale = cc.v2(node.scaleX, node.scaleY);
            data.color = cc.v3(node.color.r, node.color.g, node.color.b);
            data.opacity = node.opacity;

            const sprite = node.getComponent(cc.Sprite);
            if (sprite) {
                data.spriteFrame = sprite ? sprite.spriteFrame : null;
            }
            const labelOutline = node.getComponent(cc.LabelOutline);
            if (labelOutline) {
                data.labelOutlineColor = cc.v3(labelOutline.color.r, labelOutline.color.g, labelOutline.color.b);
                data.labelOutlineWidth = labelOutline.width;
            }

            datas[i] = data;
        }
        return datas;
    }

    /**
     * 保存当前状态数据（编辑器用）
     */
    private _save() {
        if (this.statusIndex < 0) return;

        // 保证数组长度
        while (this.statusData.length <= this.statusIndex) {
            this.statusData.push(new StateDataWrapper());
        }

        this.statusData[this.statusIndex].data = this._getNodeSaveData();
        console.log("状态保存成功\n确认编辑完毕后，请保存预置体或场景");
    }
}
