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
     * @param sc 缩放
     * @returns
     */
    public bezierTween(target: any, time: number, startPos: cc.Vec3, controlPos: cc.Vec3, endPos: cc.Vec3, sc?: number): cc.Tween<cc.Node> {
        let quadraticCurve = (t: number, p1: cc.Vec3, cp: cc.Vec3, p2: cc.Vec3, out: cc.Vec3) => {
            out.x = (1 - t) * (1 - t) * p1.x + 2 * t * (1 - t) * cp.x + t * t * p2.x;
            out.y = (1 - t) * (1 - t) * p1.y + 2 * t * (1 - t) * cp.y + t * t * p2.y;
        };
        let tempVec3: cc.Vec3 = cc.v3();
        let curTween = cc.tween(target).to(
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
    /**呼吸效果*/
    public breatheEffect(node: cc.Node) {
        return cc.tween(node)
            .by(0.5, { scale: -0.1 })
            .by(0.5, { scale: 0.1 })
            .union()
            .repeatForever()
            .start();
    }
}