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
    /**随机num个数,指定范围和个数 min取不到*/
    public randomRange(min: number, max: number, num: number) {
        if (num > max - min) {
            return [];
        }
        var range = max - min,
            minV = min + 1, //实际上可以取的最小值
            arr = [];
        function GenerateANum(i) {
            for (i; i < num; i++) {
                var rand = Math.random(); //  rand >=0  && rand < 1
                let tmp = Math.floor(rand * range + minV);

                if (arr.indexOf(tmp) == -1) {
                    arr.push(tmp);
                } else {
                    GenerateANum(i);
                    break;
                }
            }
        }
        GenerateANum(0);
        return arr;
    }
}