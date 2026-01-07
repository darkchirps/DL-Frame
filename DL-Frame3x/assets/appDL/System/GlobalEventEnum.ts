/*******************************************************************************
 * 描述:    全局事件枚举，便于后期维护和定位性能问题
*******************************************************************************/

export enum Gvent {
    MinuteChange = "MinuteChange", //分针发生变化
    HourChange = "HourChange", //时针发生变化
    DayChange = "DayChange", //日期发生变化
    NodeClick = "NodeClick", //任意Node被点击
    ScreenChange = "ScreenChange", //屏幕尺寸发生变化
    WindowChange = "WindowChange", //游戏窗口发生变化
    GlobalError = "GlobalError", //发生一个全局错误
    otherLogin = "other_login", //发生一个全局错误
    browserVisibilityChange = "browserVisibilityChange", //浏览器切换到后台或者前台

    /**切换语言*/
    changeLanguage = 'changeLanguage'
}

export enum LanguageType {
    None = "",
    /** 简体中文 */
    Chinese = "zh",
    /** 英语 */
    English = "en",
}

