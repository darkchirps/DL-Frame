/*******************************************************************************
 * 描述:    日志管理 / 全局异常捕获
 *
 * 功能：
 *   - 日志分级：log / warn / error
 *   - 日志缓冲区，保留最近 N 条（默认 200）
 *   - 全局异常自动捕获（window.onerror / unhandledrejection）
 *   - 支持自定义上报回调（接入 Sentry / 自建日志服务）
 *   - G.openLog 控制控制台输出
 *
 * 使用示例：
 *   LogMgr.log("模块名", "描述", 附加数据);
 *   LogMgr.warn("NetMgr", "重试中", { attempt: 2 });
 *   LogMgr.error("UIClass", "实例化失败", err);
 *
 *   // 获取最近日志
 *   LogMgr.getLogs();
 *   LogMgr.getLogs("error");   // 只看 error 级别
 *
 *   // 接入上报
 *   LogMgr.setReporter((entry) => {
 *       fetch("/log", { method: "POST", body: JSON.stringify(entry) });
 *   });
*******************************************************************************/

export type LogLevel = "log" | "warn" | "error";

export interface LogEntry {
    level: LogLevel;
    tag: string;
    msg: string;
    data?: any;
    time: number;
    stack?: string;
}

class _LogMgr {
    private static _buffer: LogEntry[] = [];
    private static _maxSize: number = 200;
    private static _reporter: ((entry: LogEntry) => void) | null = null;
    private static _initialized = false;

    /** 初始化，接管全局异常 */
    public static init(maxSize: number = 200) {
        this._maxSize = maxSize;
        if (this._initialized) return;
        this._initialized = true;
        this._hookGlobalErrors();
    }

    /** 设置日志上报回调（error 级别自动触发） */
    public static setReporter(reporter: (entry: LogEntry) => void) {
        this._reporter = reporter;
    }

    // ── 日志写入 ─────────────────────────────────────────────

    public static log(tag: string, msg: string, data?: any) {
        this._write("log", tag, msg, data);
    }

    public static warn(tag: string, msg: string, data?: any) {
        this._write("warn", tag, msg, data);
    }

    public static error(tag: string, msg: string, data?: any) {
        this._write("error", tag, msg, data, new Error().stack);
    }

    private static _write(level: LogLevel, tag: string, msg: string, data?: any, stack?: string) {
        const entry: LogEntry = { level, tag, msg, data, time: Date.now(), stack };

        // 写入缓冲区，超出上限时移除最旧的
        this._buffer.push(entry);
        if (this._buffer.length > this._maxSize) this._buffer.shift();

        // error 级别无论 openLog 开关，始终上报和发送全局事件
        if (level === "error") {
            this._reporter?.(entry);
            if (typeof G !== "undefined") {
                G.event?.emit("GlobalError", entry);
            }
        }

        // 控制台输出（受 G.openLog 控制）
        if (typeof G !== "undefined" && !G.openLog) return;
        const prefix = `[${tag}]`;
        if (level === "log")   console.log(prefix, msg, data ?? "");
        if (level === "warn")  console.warn(prefix, msg, data ?? "");
        if (level === "error") console.error(prefix, msg, data ?? "");
    }

    // ── 日志查询 ─────────────────────────────────────────────

    /** 获取日志缓冲区，可按级别过滤 */
    public static getLogs(level?: LogLevel): LogEntry[] {
        if (!level) return [...this._buffer];
        return this._buffer.filter(e => e.level === level);
    }

    /** 清空日志缓冲区 */
    public static clearLogs() {
        this._buffer = [];
    }

    /** 导出日志为 JSON 字符串 */
    public static exportLogs(): string {
        return JSON.stringify(this._buffer, null, 2);
    }

    // ── 全局异常捕获 ─────────────────────────────────────────

    private static _hookGlobalErrors() {
        if (typeof window === "undefined") return;

        // 同步异常
        window.onerror = (msg, source, line, col, err) => {
            this.error("GlobalError", `${msg}`, { source, line, col, stack: err?.stack });
            return false; // 不阻止默认行为
        };

        // 未捕获的 Promise rejection
        window.addEventListener("unhandledrejection", (e) => {
            const reason = e.reason;
            const msg = reason instanceof Error ? reason.message : String(reason);
            const stack = reason instanceof Error ? reason.stack : undefined;
            this.error("UnhandledRejection", msg, { stack });
        });
    }
}

export default class LogMgr extends _LogMgr { }
declare global { var LogMgr: typeof _LogMgr }
globalThis["LogMgr"] = LogMgr;
