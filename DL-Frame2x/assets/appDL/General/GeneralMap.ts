/*******************************************************************************
 * 描述:    框架全局方法管理器 map相关
*******************************************************************************/
class GeneralMap {

    /**找到map中指定key值相同的一组返回
     * @param map map数据
     * @param key map中的key
    */
    public findMapGroup<T>(map: Map<string, T>, key: string): T[] {
        // 创建一个映射来存储每个元素的索引
        const indexMap: Map<string, T> = new Map();
        for (let k in map) {
            let sign = map[k][key];
            if (indexMap.get(sign)) {
                return [indexMap.get(sign), map[k]]
            } else {
                indexMap.set(sign, map[k]);
            }
        }
        // 如果没有找到重复的元素，返回 undefined
        return [];
    }
}
export default class GM extends GeneralMap { }
declare global { var GM: typeof GeneralMap }
globalThis["GM"] = GM;