import { Vec3, Tween, tween, v3, Graphics, Node } from "cc";

/*******************************************************************************
 * 描述:    框架全局方法管理器 效果相关
*******************************************************************************/
export default class GeneralEffect {
    /**
     * 贝塞尔tween动画
     * @param target 对象
     * @param time 动画时间
     * @param startPos 开始坐标
     * @param controlPos 控制点
     * @param endPos 结束坐标
     * @returns
     */
    public bezierTween(target: any, time: number, startPos: Vec3, controlPos: Vec3, endPos: Vec3, sc?: number): Tween<Node> {
        let quadraticCurve = (t: number, p1: Vec3, cp: Vec3, p2: Vec3, out: Vec3) => {
            out.x = (1 - t) * (1 - t) * p1.x + 2 * t * (1 - t) * cp.x + t * t * p2.x;
            out.y = (1 - t) * (1 - t) * p1.y + 2 * t * (1 - t) * cp.y + t * t * p2.y;
            out.z = (1 - t) * (1 - t) * p1.z + 2 * t * (1 - t) * cp.z + t * t * p2.z;
        };
        let tempVec3 = v3();
        let curTween = tween(target).to(
            time,
            { position: endPos, scale: sc ? sc : target.scale },
            {
                onUpdate: (tar, ratio) => {
                    quadraticCurve(ratio, startPos, controlPos, endPos, tempVec3);
                    target.setPosition(tempVec3);
                },
            },
        );
        return curTween;
    }
    /**画线 循环流动
     * @param graphics 画布
     * @param startPos 开始坐标
     * @param endPos 结束坐标
     * @param dashLength 虚线长度
     * @param gapLength 虚线间隔
     * @param offset 起点偏移量
    */
    public drawDashedLine(graphics: Graphics, startPos: Vec3, endPos: Vec3, dashLength: number, gapLength: number, offset: number) {
        if (!graphics) return;
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const totalDashGapLength = dashLength + gapLength;
        let currentX = startPos.x + (dx / length) * offset;
        let currentY = startPos.y + (dy / length) * offset;
        for (let dist = offset; dist < length; dist += totalDashGapLength) {
            graphics.moveTo(currentX, currentY);
            // 计算虚线结束点
            const nextX = currentX + (dx / length) * dashLength;
            const nextY = currentY + (dy / length) * dashLength;
            // 如果虚线超出终点，则截断
            if (dist + dashLength > length) {
                graphics.lineTo(endPos.x, endPos.y);
                break;
            }
            graphics.lineTo(nextX, nextY);
            // 更新起点为间隔结束
            currentX = nextX + (dx / length) * gapLength;
            currentY = nextY + (dy / length) * gapLength;
        }
    }
    /**呼吸效果*/
    public breatheEffect(node: Node) {
        return tween(node)
            .by(0.5, { scaleXY: -0.1 })
            .by(0.5, { scaleXY: 0.1 })
            .union()
            .repeatForever()
            .start();
    }
}