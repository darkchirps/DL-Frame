/*******************************************************************************
 * 描述:    框架全局方法管理器 数值相关
*******************************************************************************/
export default class GeneralValue {
    /**数值格式化*/
    public formatValue(n: number) {
        //策划要求保留一位小数，直接向下取(到千万开始用M)
        let str = "";
        if (n < 10000) {
            str = n.toString();
        } else if (n < 10000000) {
            str = ((n / 1000).toFixed(1)).toString() + "K";
        } else if (n < 10000000000) {
            str = ((n / 1000000).toFixed(1)).toString() + "M";
        } else {
            str = ((n / 1000000000).toFixed(1)).toString() + "B";
        }
        return str;
    }
    /**
     * 返回大于等于i1 小于等于i2的随机整数
     * @param i1 
     * @param i2 
     */
    public randomInt(i1: number, i2: number): number {
        if (i1 == i2) {
            return i1;
        }
        var range = Math.abs(i1 - i2) + 1;
        return Math.floor(Math.random() * range + Math.min(i1, i2));
    }
    /**
     * 随机 num 个不重复整数，范围 [min, max)，即 min 可取到，max 取不到
     * @param min 最小值（包含）
     * @param max 最大值（不包含）
     * @param num 个数
     */
    public randomRange(min: number, max: number, num: number): number[] {
        const rangeSize = max - min;
        // num 超过可用范围时无法取到足够不重复的数
        if (num > rangeSize || rangeSize <= 0) return [];
        const set = new Set<number>();
        while (set.size < num) {
            set.add(Math.floor(Math.random() * rangeSize) + min);
        }
        return Array.from(set);
    }
}