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
}