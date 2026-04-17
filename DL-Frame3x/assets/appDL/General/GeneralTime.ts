/*******************************************************************************
 * 描述:    框架全局方法管理器 时间相关
*******************************************************************************/
export default class GeneralTime {
    /**
     * 将一个>0的秒数（时长）转换为指定格式的字符串
     * 支持的格式占位符：{y}(年)、{mo}(月)、{d}(天)、{h}(小时)、{mm}(分钟)、{s}(秒)
     * 示例格式："{y}-{mo}-{d} {h}:{mm}:{s}"
     * @param time 秒数（时长，>0）
     * @param fmtStr 时间格式，默认 "{d} {h}:{mm}:{s}"
     */
    public timetostr(time: number, fmtStr = "{d} {h}:{mm}:{s}") {
        if (time <= 0) return "0d 00:00:00";

        let remaining = Math.floor(time); // 统一取整，避免浮点精度问题
        const YEAR_SEC  = 365 * 24 * 60 * 60;
        const MONTH_SEC = 30  * 24 * 60 * 60;
        const DAY_SEC   = 24  * 60 * 60;
        const HOUR_SEC  = 60  * 60;
        const MIN_SEC   = 60;

        const yNum  = Math.floor(remaining / YEAR_SEC);  remaining %= YEAR_SEC;
        const moNum = Math.floor(remaining / MONTH_SEC); remaining %= MONTH_SEC;
        const dNum  = Math.floor(remaining / DAY_SEC);   remaining %= DAY_SEC;
        const hNum  = Math.floor(remaining / HOUR_SEC);  remaining %= HOUR_SEC;
        const mmNum = Math.floor(remaining / MIN_SEC);
        const sNum  = remaining % MIN_SEC;

        const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;

        // 使用 {占位符} 格式，彻底避免单字母正则边界匹配的歧义问题
        return fmtStr
            .replace(/\{y\}/g,  `${yNum}`)
            .replace(/\{mo\}/g, `${moNum}`)
            .replace(/\{d\}/g,  `${dNum}d`)
            .replace(/\{h\}/g,  `${hNum}`)
            .replace(/\{mm\}/g, pad(mmNum))
            .replace(/\{s\}/g,  pad(sNum));
    }
    /**时间戳是否跨天
     * @param t1 时间戳
     * @param t2 时间戳
     */
    public acrossDay(t1: number, t2: number) {
        let d1 = new Date(t1);
        let d2 = new Date(t2);
        return d1.getFullYear() !== d2.getFullYear() || d1.getMonth() !== d2.getMonth() || d1.getDate() !== d2.getDate();
    }
 }