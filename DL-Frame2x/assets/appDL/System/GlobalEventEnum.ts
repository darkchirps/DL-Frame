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
    /** 西班牙语 */
    Spain = "es",
    /** 意大利语 */
    Italy = "it",
    /** 葡萄牙语 */
    Portugal = "pt",
    /** 日语 */
    Japan = "ja",
    /** 俄语 */
    Russian = "ru",
    /** 丹麦语 */
    Denmark = "dk",
    /** 阿拉伯语 */
    Arabic = "ar",
    /** 韩语 */
    Korean = "kr",
    /** 印尼语 */
    Indonesia = "id",
    /** 捷克语 */
    Czech = "cs",
    /** 希腊语 */
    Greek = "el",
    /** 芬兰语 */
    Finnish = "fl",
    /** 匈牙利语 */
    Hungarian = "hu",
    /** 立陶宛语 */
    Lithuanian = "lt",
    /** 马来语 */
    Malay = "ms",
    /** 荷兰语 */
    Dutch = "nl",
    /** 波兰语 */
    Polish = "pl",
    /** 罗马尼亚语 */
    Romanian = "ro",
    /** 斯洛伐克语 */
    Slovak = "sk",
    /** 瑞典语 */
    Swedish = "se",
    /** 繁体中文 */
    TraditionalChinese = "cn_SP",
    /** 印地语 */
    India = "in",
    /** 乌克兰语*/
    Ukrainian = "uk",
    /** 哈萨克语*/
    Kazakh = "kz",
    /** 乌兹别克语*/
    Uzbek = "uz",
    /** 尼泊尔语 */
    Nepali = "ne",
    /** 乌尔都语 */
    Urdu = "ur",
    /** 菲律宾语 */
    Tagalog = "tl",
    /** 泰语 */
    Thai = "th",

    //#region 印度地方语言  				
    /**孟加拉语 */
    Bengali = "bn",
    /**泰卢固语 */
    Telugu = "te",
    /**马拉地语 */
    Marathi = "mr",
    /**泰米尔语 */
    Tamil = "ta",
    /**古吉拉特语 */
    Gujarati = "gu",
    /**卡纳达语 */
    Kannada = "kn",
    /**马拉雅拉姆语 */
    Malayalam = "ml",
    //#endregion
}
