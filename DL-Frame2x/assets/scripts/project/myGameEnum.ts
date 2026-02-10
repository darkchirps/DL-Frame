/**订阅类型，（与subscribe.normal对应id） */
export enum SubType {
    none,
    MonthSub = 10001,
    LifeSub,
}
/**订阅数据 */
export interface SubscribeData {
    subType: SubType,
    /**购买时间 */
    buyTime: number,
}
/**商品信息 */
export interface GoodsInfo {
    /**支付id */
    payId: number,
    /**价格字符串 */
    price: string,
    /**商品状态 */
    status: number,
    /**国家货币单位 */
    currencyCode: string,
    /**具体金额 */
    priceAmount: string,
    /**支付类型 */
    pType: number,
    /**订阅注册时间（毫秒） */
    subTime: number,
}
/** 内购类型 */
export enum BillingType {
    INAPP = 1,
    SUBS,
}