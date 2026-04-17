/*******************************************************************************
 * 描述:    网络请求管理
 *
 * 统一封装 HTTP 请求，支持：
 *   - token 自动注入 / 请求签名
 *   - 超时控制与自动重试
 *   - 请求队列 / 并发限制
 *   - 统一错误码处理
 *   - WebSocket 长连接管理
 *
 * 使用示例：
 *   // 基础请求
 *   const res = await NetMgr.get("/api/user/info");
 *   const res = await NetMgr.post("/api/login", { uid: 1001 });
 *
 *   // 配置 token 注入
 *   NetMgr.setTokenGetter(() => C.get("token"));
 *
 *   // 统一错误处理
 *   NetMgr.onError = (code, msg) => { Tip.show(msg); };
 *
 *   // WebSocket
 *   NetMgr.wsConnect("wss://xxx/ws");
 *   NetMgr.wsOn("chat", (data) => { ... });
 *   NetMgr.wsSend("chat", { msg: "hello" });
*******************************************************************************/

import { Gvent } from "../System/GlobalEventEnum";

export interface NetConfig {
    /** 请求超时时间（ms），默认 10000 */
    timeout?: number;
    /** 失败自动重试次数，默认 0 */
    retry?: number;
    /** 重试间隔（ms），默认 1000 */
    retryDelay?: number;
    /** 最大并发请求数，默认 5 */
    maxConcurrent?: number;
    /** 基础 URL 前缀 */
    baseUrl?: string;
}

export interface NetResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}

interface RequestTask {
    url: string;
    options: RequestInit & { _timeout?: number; _retry?: number; _retryDelay?: number };
    resolve: (v: any) => void;
    reject: (e: any) => void;
}

class _NetMgr {
    private static _baseUrl: string = "";
    private static _timeout: number = 10000;
    private static _retry: number = 0;
    private static _retryDelay: number = 1000;
    private static _maxConcurrent: number = 5;
    private static _running: number = 0;
    private static _queue: RequestTask[] = [];
    private static _tokenGetter: (() => string) | null = null;

    /** WebSocket 实例 */
    private static _ws: WebSocket | null = null;
    private static _wsUrl: string = "";
    private static _wsHandlers: Map<string, ((data: any) => void)[]> = new Map();
    private static _wsReconnectTimer: any = null;
    private static _wsReconnectDelay: number = 3000;
    private static _wsAutoReconnect: boolean = true;
    /** 修复1：重连次数上限，超过后停止重连 */
    private static _wsMaxReconnect: number = 10;
    private static _wsReconnectCount: number = 0;

    /** 统一错误回调，业务层可覆盖 */
    public static onError: ((code: number, msg: string) => void) | null = null;

    /** 初始化全局配置 */
    public static setup(config: NetConfig) {
        if (config.baseUrl !== undefined) this._baseUrl = config.baseUrl;
        if (config.timeout !== undefined) this._timeout = config.timeout;
        if (config.retry !== undefined) this._retry = config.retry;
        if (config.retryDelay !== undefined) this._retryDelay = config.retryDelay;
        if (config.maxConcurrent !== undefined) this._maxConcurrent = config.maxConcurrent;
    }

    /** 设置 token 获取函数，每次请求自动注入 Authorization 头 */
    public static setTokenGetter(getter: () => string) {
        this._tokenGetter = getter;
    }

    // ── HTTP ────────────────────────────────────────────────

    public static get<T = any>(url: string, params?: Record<string, any>, options?: RequestInit): Promise<NetResponse<T>> {
        if (params) {
            const query = new URLSearchParams(params).toString();
            url = `${url}?${query}`;
        }
        return this._enqueue(url, { ...options, method: "GET" });
    }

    public static post<T = any>(url: string, body?: any, options?: RequestInit): Promise<NetResponse<T>> {
        return this._enqueue(url, {
            ...options,
            method: "POST",
            headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
            body: JSON.stringify(body ?? {}),
        });
    }

    public static put<T = any>(url: string, body?: any, options?: RequestInit): Promise<NetResponse<T>> {
        return this._enqueue(url, {
            ...options,
            method: "PUT",
            headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
            body: JSON.stringify(body ?? {}),
        });
    }

    public static delete<T = any>(url: string, options?: RequestInit): Promise<NetResponse<T>> {
        return this._enqueue(url, { ...options, method: "DELETE" });
    }

    // ── 队列调度 ─────────────────────────────────────────────

    private static _enqueue<T>(url: string, options: RequestInit): Promise<T> {
        return new Promise((resolve, reject) => {
            this._queue.push({ url, options, resolve, reject });
            this._flush();
        });
    }

    private static _flush() {
        while (this._running < this._maxConcurrent && this._queue.length > 0) {
            const task = this._queue.shift()!;
            this._running++;
            this._execute(task).finally(() => {
                this._running--;
                this._flush();
            });
        }
    }

    private static async _execute(task: RequestTask, attempt: number = 0): Promise<void> {
        const fullUrl = task.url.startsWith("http") ? task.url : `${this._baseUrl}${task.url}`;
        const headers: Record<string, string> = { ...(task.options.headers as any ?? {}) };

        // 注入 token
        if (this._tokenGetter) {
            const token = this._tokenGetter();
            if (token) headers["Authorization"] = `Bearer ${token}`;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this._timeout);

        try {
            const res = await fetch(fullUrl, {
                ...task.options,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timer);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const json: NetResponse = await res.json();

            // 统一错误码处理
            if (json.code !== 0 && json.code !== 200) {
                this.onError?.(json.code, json.msg);
                G.event.emit(Gvent.GlobalError, { code: json.code, msg: json.msg });
                task.reject(json);
                return;
            }

            task.resolve(json);
        } catch (err: any) {
            clearTimeout(timer);
            const maxRetry = (task.options as any)._retry ?? this._retry;
            if (attempt < maxRetry) {
                await new Promise(r => setTimeout(r, this._retryDelay));
                return this._execute(task, attempt + 1);
            }
            LogMgr.error("NetMgr", `请求失败: ${task.url}`, err?.message);
            task.reject(err);
        }
    }

    // ── WebSocket ────────────────────────────────────────────

    /** 建立 WebSocket 连接 */
    public static wsConnect(url: string, autoReconnect: boolean = true) {
        this._wsUrl = url;
        this._wsAutoReconnect = autoReconnect;
        this._wsCreate();
    }

    private static _wsCreate() {
        if (this._ws) {
            this._ws.onclose = null;
            this._ws.close();
        }
        this._ws = new WebSocket(this._wsUrl);

        this._ws.onopen = () => {
            LogMgr.log("NetMgr", `WebSocket 已连接: ${this._wsUrl}`);
            // 修复1：连接成功后重置重连计数
            this._wsReconnectCount = 0;
            if (this._wsReconnectTimer) {
                clearTimeout(this._wsReconnectTimer);
                this._wsReconnectTimer = null;
            }
        };

        this._ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                const handlers = this._wsHandlers.get(msg.type);
                handlers?.forEach(h => h(msg.data));
            } catch {
                LogMgr.warn("NetMgr", "WebSocket 消息解析失败", e.data);
            }
        };

        this._ws.onerror = (e) => {
            LogMgr.error("NetMgr", "WebSocket 错误", e);
        };

        this._ws.onclose = () => {
            LogMgr.warn("NetMgr", "WebSocket 断开");
            if (this._wsAutoReconnect) {
                // 修复1：超过最大重连次数后停止，避免重连风暴
                if (this._wsReconnectCount >= this._wsMaxReconnect) {
                    LogMgr.error("NetMgr", `WebSocket 重连次数已达上限 ${this._wsMaxReconnect}，停止重连`);
                    return;
                }
                this._wsReconnectCount++;
                LogMgr.warn("NetMgr", `WebSocket 第 ${this._wsReconnectCount}/${this._wsMaxReconnect} 次重连...`);
                this._wsReconnectTimer = setTimeout(() => this._wsCreate(), this._wsReconnectDelay);
            }
        };
    }

    /** 监听 WebSocket 消息类型 */
    public static wsOn(type: string, handler: (data: any) => void) {
        if (!this._wsHandlers.has(type)) this._wsHandlers.set(type, []);
        this._wsHandlers.get(type)!.push(handler);
    }

    /** 取消监听 */
    public static wsOff(type: string, handler: (data: any) => void) {
        const list = this._wsHandlers.get(type);
        if (list) this._wsHandlers.set(type, list.filter(h => h !== handler));
    }

    /** 发送 WebSocket 消息 */
    public static wsSend(type: string, data?: any) {
        if (this._ws?.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify({ type, data }));
        } else {
            LogMgr.warn("NetMgr", "WebSocket 未连接，消息发送失败", type);
        }
    }

    /** 主动断开 WebSocket */
    public static wsDisconnect() {
        this._wsAutoReconnect = false;
        this._wsReconnectCount = 0;
        if (this._wsReconnectTimer) clearTimeout(this._wsReconnectTimer);
        this._ws?.close();
        this._ws = null;
        // 修复2：断开时清理所有 handlers，防止闭包内存泄漏
        this._wsHandlers.clear();
    }

    /** 清理指定类型或全部 WebSocket 消息监听器 */
    public static wsClearHandlers(type?: string) {
        if (type) {
            this._wsHandlers.delete(type);
        } else {
            this._wsHandlers.clear();
        }
    }

    /** WebSocket 是否已连接 */
    public static get wsConnected() {
        return this._ws?.readyState === WebSocket.OPEN;
    }
}

export default class NetMgr extends _NetMgr { }
declare global { var NetMgr: typeof _NetMgr }
globalThis["NetMgr"] = NetMgr;
