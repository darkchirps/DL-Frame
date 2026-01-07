/**关卡中单块数据*/
export interface blockType {
    /**块状id */
    blockId: number;
    /**旋转id */
    rotate: number;
    /**坐标*/
    pos: Array<number>;
}
/**当前游戏类型*/
export enum gameType {
    /**普通模式 */
    common,
    /**图包/视频包模式 */
    picbag,
    /**阶梯礼包*/
    ladder,
}
/**组合图包数据*/
export interface picbagGroupData {
    /**当前显示的组合图包id*/
    id: number;
    /**已购买组合图包id*/
    buyAllId: Array<number>;
    /**时间 夸天下一个组合图包id*/
    timer: number;
}
/**图包购买信息数据*/
export interface picbagBuyData {
    /**图包id*/
    id: number;
    /**图包排序*/
    sort: number;
    /**图包通关数*/
    passNum: number;
    /**类型 默认0单个图包其余为组合图包id*/
    type: number;
}
/**视频包购买信息数据*/
export interface picbagBuyVideoData {
    /**视频包id*/
    id: number;
    /**视频包排序*/
    sort: number;
    /**视频包通关数*/
    passNum: number;
}
/**商店免费金币数据*/
export interface shopFreeData {
    /**免费钻石id*/
    id: number;
    /**购买的时间*/
    buytime: number;
    /**购买的次数*/
    time: number;
}
/**存钱罐数据*/
export interface saveMoneyData {
    /**存钱罐开启时间 为了重置免费领取次数*/
    timer: number;
    /**存的金币数*/
    proNum: number;
    /**免费领取次数*/
    adsNum: number;
    /**弹出过*/
    open: number;
}
/**各种类型的事件 */
export enum OtherEvent {
    /**道具刷新 */
    updateItem = "updateItem",
    /**图册刷新 */
    updateAlbum = "updateAlbum",
    /**当前显示图更新 */
    updatePic = "updatePic",
}
/**道具类型*/
export enum propType {
    /**钻石*/
    diamond = 1,
    /**钻头*/
    drillBit = 2,
    /**锤子*/
    hammer = 3,
    /**钳子*/
    pliers = 4,
    /**开盒*/
    deflasking = 5,
}
/**商店商品类型*/
export enum shopBuyType {
    /**免费*/
    free = 0,
    /**激励兑换*/
    ads = 1,
    /**金币*/
    gold = 2,
    /**钻石*/
    diamond = 3,
    /**去广告*/
    noAds = 4,
    /**礼包*/
    gift = 5,
    /**钻石购买道具 */
    dProp = 6,
}
/**收藏中的资源*/
export interface albumType {
    id: number;
    /**图片/视频是否下载过*/
    isDownload: boolean
    /**0默认1喜欢2讨厌 */
    evaluate: number;
    /**储存时间 */
    storageTime: number;
    /**资源类型 */
    resType: number;
}
/**通关关卡数据*/
export interface levelData {
    /**关卡id */
    id: number;
    /**步数*/
    step: number;
    /**图片id*/
    imageId: number;
}
/**阶梯礼包结构*/
export interface packageLadderData {
    /**当前小礼包对应的进度 */
    bagLv: number;
    /**当前小礼包id*/
    bagId: number;
    /**已购买的小礼包id*/
    bagBuy: Array<number>;
}