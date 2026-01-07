/*******************************************************************************
 * 描述:    项目专用枚举类型等
*******************************************************************************/
export enum mahSize {
    x = 152,
    y = 185,
}
/**块或地图配置*/
export class mahMapType {
    wNum: number;
    hNum: number;
    layer: number;
}
/**道具类型*/
export enum mahPropType {
    /**金币*/
    gold = 1,
    /**提示*/
    tip = 2,
    /**洗牌*/
    riffle = 3,
    /**脸谱*/
    facial = 4,
    /**炸弹*/
    bomb = 5,
    /**撤回 */
    recall = 6,
}
/**各种类型的事件 */
export enum mahOtherEvent {
    /**道具刷新 */
    mahUpdateItem = "mahUpdateItem",
}