/*******************************************************************************
 * 描述:    框架全局事件枚举
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
    changeLanguage = 'changeLanguage'//切换了一个语言
}
export enum LanguageType {
    None = "",
    /** 简体中文 */
    Chinese = "zh",
    /** 英语 */
    English = "en",
    /** 法语 */
    French = "fr",
    /** 德语 */
    German = "de",
    /** 日语 */
    Japan = "ja",
    /** 俄语 */
    Russian = "ru",
    /** 韩语 */
    Korean = "kr",
}
