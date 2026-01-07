//本项目额外全局通用方法
class myGeneralX {
    /**节点中多边形物理组件坐标组转换为基于同节点层级的情况下坐标组*/
    public static getPhysicsPolygonColliderPos(node): cc.Vec2[] {
        let point = node.physicsPolygonCollider.points;
        let pos = node.position.clone();
        let points = [];
        for (let i = 0; i < point.length; i++) {
            let p = point[i].clone();
            points.push(myX.getChildPositionAfterRotation(pos, p, node.angle));
        }
        return points;
    }

    /**父节点旋转后的子节点基于父节点同层级的情况下的坐标*/
    public static getChildPositionAfterRotation(parentPos: cc.Vec2 | cc.Vec3, childLocalPos: cc.Vec2 | cc.Vec3, rotation: number): cc.Vec3 {
        // 将角度转换为弧度
        const rad = rotation * Math.PI / 180;
        // 应用旋转矩阵: [cosθ -sinθ] [x]  [sinθ  cosθ] [y]
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rotatedX = childLocalPos.x * cos - childLocalPos.y * sin;
        const rotatedY = childLocalPos.x * sin + childLocalPos.y * cos;
        // 计算子节点与父节点同层级时的坐标
        const newX = parentPos.x + rotatedX;
        const newY = parentPos.y + rotatedY;
        return cc.v3(newX, newY);
    }

    /**返回块的螺丝数
     * @param id 块的id
    */
    public static returnScrewNum(id: number) {
        let num: number = 0;
        if (id >= 40) {
            num = 12;
        } else if (id >= 30) {
            num = 9;
        } else if (id >= 20) {
            num = 6;
        } else {
            num = 3;
        }
        return num;
    }
}
export default class myX extends myGeneralX { }
declare global { var myX: typeof myGeneralX }
globalThis["myX"] = myX;