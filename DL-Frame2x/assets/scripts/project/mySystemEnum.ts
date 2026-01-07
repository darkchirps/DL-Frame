/**邮件来源 */
export enum MailSource {
    /**设置界面 */
    Setting,
    /**关卡页面 */
    Level,
}
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
/** 内购类型 */
export enum BillingType {
    INAPP = 1,
    SUBS,
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
/**游戏事件 */
export enum GameEvent {
    /**视频关卡跳过 */
    ON_VIDEO_NEXT_LEVEL = "onVideoNextLevel",
    /**激励视频下一关 */
    ON_SET_NEXT_LEVEL = "onSetNextLevel",
    /**设置胜利下一关 */
    ON_SET_WIN_LEVEL = "onSetWinLevel",
    /**重新开始 */
    ON_RESET_GAME = "onResetGame",
    /**关闭游戏界面 */
    ON_CLOSE_GAME = "onCloseGame",
    /**关闭提示遮罩 */
    ON_CLOSE_HINT_MASK = "onCloseHintMask",
    /**移动图片 */
    ON_MOVE_PIC = "onMovePic",
    /**缩放图片 */
    ON_SCALE_PIC = "onScalePic",
    /**模拟自动点击(GM专用) */
    ON_SIMULATION_CLICK = "onSimulationClick",
    /**发送支付信息 */
    ON_SEND_PAY_INFO = "onSendPayInfo",
    /**通知权限开启 */
    ON_OPEN_NOTIFICATION = "onOpenNotification",
    /**通知图片已经下载好 */
    ON_SEND_IMAGE_DOWN_OVER = "onSendImageDownOver",
    /**点击筛选控件全选 */
    ON_CLICK_SELECT_ALL = "onClickSelectAll",
    /** 暂停游戏 */
    ON_PAUSE_GAME = "onPauseGame",
    /** 复位游戏 */
    ON_RESUEM_GAME = "onResuemGame",
    /**游戏切前台 */
    ON_ENTER_FRONT = "onEnterFront",
    /**引导对话，暂停倒计时 */
    ON_GUIDE_TIP_SHOW = "onGuideTipShow",
    /**获得连胜奖励，飞道具 */
    ON_FLY_PROP = "onFlyProp",
    /**游戏恢复playing状态 */
    ON_GAME_RESUME = "onGameResume",
    /**购买视频成功 */
    ON_SINGLE_VIDEO_BUY = "onSingleVideoBuy",
    /**购买订阅成功 */
    ON_BUY_SUBSCRIBE = "onBuySubscribe",
}
/**用户类型 */
export enum UserType {
    E_NO_DEEP_LINK = 1,// 非深链
    E_DEEP_LINK,// 深链用户
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
/**商品信息对应配置表*/
export enum ShopId {
    /**去广告 */
    AdBlock = 101,
    /**免费钻石20 */
    Free20 = 105,
    /**免费钻石60 */
    Free60 = 106,
    /**免费钻石80 */
    Free80 = 107,
    /**免费钻石100 */
    Free100 = 108,
    /**礼包1 */
    Goft1 = 111,
    /**礼包2 */
    Goft2 = 112,
    /**礼包3 */
    Goft3 = 113,
    /**礼包4 */
    Goft4 = 114,
    /**礼包5 */
    Goft5 = 115,
    /**礼包6 */
    Goft6 = 116,
    /**礼包7 */
    Goft7 = 117,
    /**礼包8 */
    Goft8 = 118,
    /**电钻 */
    drillBit = 131,
    /**锤子 */
    hammer = 132,
    /**钳子 */
    pliers = 133,
    /**开盒 */
    deflasking = 134,
    /**钻石1 */
    Diamond1 = 141,
    /**钻石1 */
    Diamond2 = 142,
    /**钻石1 */
    Diamond3 = 143,
    /**钻石1 */
    Diamond4 = 144,
    /**钻石1 */
    Diamond5 = 145,
    /**钻石1 */
    Diamond6 = 146,
}