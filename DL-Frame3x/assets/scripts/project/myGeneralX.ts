/*******************************************************************************
 * 描述:    项目全局方法
*******************************************************************************/
import { SpriteFrame, v3, Tween, tween, Node, Vec3, Texture2D, ImageAsset, Sprite, Vec2 } from "cc";

class myGeneralX {

    /**核心 生成icon种类*/
    public static randowIconKind(len: number): number {
        // 定义每个区间的起始和结束值
        const thresholds = [10, 20, 30, 40, 5000];
        const ranges = [
            [0, 5],   // 对应 len <= 10
            [5, 5],   // 对应 len <= 20
            [10, 5],  // 对应 len <= 30
            [15, 4],  // 对应 len <= 40
            [34, 34]   // 对应 len <= 500
        ];
        // 找到适合的区间
        let index = thresholds.findIndex(threshold => len <= threshold);
        if (index >= 4) return 34;
        // 获取对应区间的起始和结束值
        const [startOffset, rangeSize] = ranges[index];
        const randomStart = len - startOffset;
        const randomEnd = randomStart + rangeSize;

        let random = X.randomInt(randomStart, randomEnd);
        return random;
    }
    /**呼吸效果*/
    public static breatheEffect(node: Node): Tween {
        return tween(node)
            .by(0.5, { scaleXY: -0.1 })
            .by(0.5, { scaleXY: 0.1 })
            .union()
            .repeatForever()
            .start();
    }
}

/** mah项目公用方法 */
export default class myX extends myGeneralX { }
declare global { var myX: typeof myGeneralX }
globalThis["myX"] = myX;