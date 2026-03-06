/*******************************************************************************
 * 描述:    框架全局方法管理器 时间相关
*******************************************************************************/
export default class GeneralTime {
    /**
     * 将一个>0的秒数（时长）转换为指定格式的字符串
     * 支持的格式占位符：y(年)、m(月)、d(天)、h(小时)、mm(分钟)、s(秒)
     * 特殊处理：天数会自动拼接字母"d"，如7天展示为"7d"
     * @param time 秒数（时长，>0）
     * @param fmtStr 时间格式，默认 "y-m-d h:mm:s"
     */
    public timetostr(time: number, fmtStr = "y-m-d h:mm:s") {
        // 校验输入，确保秒数大于0
        if (time <= 0) {
            return "0d 00:00:00"; // 输入不合法时返回默认空时长（保持格式统一）
        }

        let remaining = time;
        // 定义各时间单位的秒数换算
        const YEAR_SEC = 365 * 24 * 60 * 60;
        const MONTH_SEC = 30 * 24 * 60 * 60; // 简化为每月30天
        const DAY_SEC = 24 * 60 * 60;
        const HOUR_SEC = 60 * 60;
        const MIN_SEC = 60;

        // 计算各时间单位的数值
        const y = Math.floor(remaining / YEAR_SEC).toString();
        remaining = remaining % YEAR_SEC;

        const m = Math.floor(remaining / MONTH_SEC).toString();
        remaining = remaining % MONTH_SEC;

        // 天数计算后拼接字母"d"
        const dNum = Math.floor(remaining / DAY_SEC);
        const d = `${dNum}d`; // 核心调整：天数后加"d"
        remaining = remaining % DAY_SEC;

        const h = Math.floor(remaining / HOUR_SEC).toString();
        remaining = remaining % HOUR_SEC;

        const mmNum = Math.floor(remaining / MIN_SEC);
        const sNum = Math.floor(remaining % MIN_SEC);

        // 补零处理：强制转为字符串，确保类型统一为string
        const padMM: string = mmNum < 10 ? `0${mmNum}` : mmNum.toString();
        const padS: string = sNum < 10 ? `0${sNum}` : sNum.toString();

        // 替换格式字符串中的占位符（所有替换值都是string类型）
        let result = fmtStr
            .replace(/y/gi, y)
            .replace(/mm/gi, padMM) // 先替换分钟（mm）
            .replace(/m/gi, m)      // 再替换月份（m）
            .replace(/d/gi, d)      // 替换为带"d"的天数（如7d）
            .replace(/h/gi, h)
            .replace(/s/gi, padS);

        return result;
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