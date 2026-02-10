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
/**广告类型*/
export enum AdsType {
    /** 顶上 banner */
    AT_Banner_Top = 1,
    /** 底部 banner */
    AT_Banner_Bottom,
    /** 插屏广告 */
    AT_Interstitial,
    /** 视频广告 */
    AT_RewardVideo,
    /** 信息流（原生态广告） */
    AT_Native,
    /** 全面屏 */
    AT_FullScreenVideo,
    /** 闪屏 */
    AT_SplashAd,
    /** 底部 原生banner */
    AT_Native_Banner_Bottom,
    /** 顶上 原生banner */
    AT_Native_Banner_Top,
    /** 插屏图文 */
    AT_Interstitial_Graphic,
    /** 互动广告 */
    AT_Interactive,
    /** 插页试激励广告 */
    AT_Int_RewardVideo,
    /** 原生插屏 */
    AT_Native_Int,
};
/**回调执行的状态*/
export enum CallBackStatus {
    /** 成功 */
    CALL_SUCCESS = 1,
    /** 失败 */
    CALL_FALIED,
    /** 确认 */
    CALL_SURE,
    /** 取消、跳过 */
    CALL_CANCEL,
    /** 前往 */
    CALL_GO,
    /** 加载 */
    CALL_LOADFALIED,
    /** 错误 */
    CALL_ERROR,
    /** 开始播放 展示 */
    CALL_AD_SHOW,
    /** 点击广告 */
    CALL_AD_CLICK,
    /** 广告已填充 */
    CALL_AD_LOADED,
    /** 开始 */
    CALL_START,
    /** 数据更新 */
    CALL_UPDATE,
    /** 无效（奖励） */
    CALL_INVALID,
    /** 跳过（奖励） */
    CALL_SKIPPED,
    /** 关闭 */
    CALL_CLOSE,
};