/*******************************************************************************
 * 描述:    列表组件上挂载减少dc
*******************************************************************************/
const { ccclass, property, menu, inspector } = cc._decorator;
@ccclass
@menu('常用组件/列表组件减少dc')
export default class scrollViewDC extends cc.Component {

    private _sv: cc.ScrollView = null;
    private _viewport: cc.Node = null;
    private _content: cc.Node = null;

    protected onLoad(): void {
        this._sv = this.node.getComponent(cc.ScrollView);
        if (this._sv) {
            this._viewport = this._sv.node;
            this._content = this._sv.content;
        }
    }

    protected update(dt: number): void {
        this.calcChildVisibility();
    }

    private calcChildVisibility() {
        if (!this._sv) return;

        // 获取视口在世界坐标系中的包围盒
        const viewportWorldRect = this.getWorldBoundingBox(this._viewport);

        // 处理所有子节点
        for (const child of this._content.children) {
            const childWorldRect = this.getWorldBoundingBox(child);
            child.opacity = viewportWorldRect.intersects(childWorldRect) ? 255 : 0;
        }
    }

    // 获取节点在世界坐标系中的轴对齐包围盒
    private getWorldBoundingBox(node: cc.Node): cc.Rect {
        const center = node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const width = node.width * Math.abs(node.scaleX);
        const height = node.height * Math.abs(node.scaleX);

        return new cc.Rect(
            center.x - width * node.anchorX,
            center.y - height * node.anchorY,
            width,
            height
        );
    }
}