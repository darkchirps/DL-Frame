/*******************************************************************************
 * 描述:    运行时状态管理（内存级，不持久化）
 *
 * 与 CacheMgr 的区别：
 *   - CacheMgr  → localStorage 持久化，跨会话保留
 *   - StoreMgr  → 内存状态，游戏运行期间有效，重启清空
 *
 * 使用示例：
 *   // 设置状态
 *   Store.set("hp", 100);
 *   Store.set("player", { name: "Tom", level: 5 });
 *
 *   // 读取状态
 *   Store.get("hp");               // 100
 *   Store.get("player", "level");  // 5
 *
 *   // 监听变化（注册时立即触发一次，Node 销毁自动解绑）
 *   Store.watch("hp", (newVal, oldVal) => {
 *       this.hpBar.progress = newVal / 100;
 *   }, this.node);
 *
 *   // 对象写法同时监听多个 key
 *   Store.watch({ hp: (val) => {}, mp: (val) => {} }, this.node);
 *
 *   // 手动解绑
 *   Store.unwatch("hp", callback);
 *
 *   // 清空所有状态（切换关卡时调用）
 *   Store.clear();
*******************************************************************************/

import { Node } from "cc";

type StoreCallback = (newVal: any, oldVal: any) => void;

interface WatchEntry {
    cb: StoreCallback;
    node?: Node;
}

class _StoreMgr {
    private static _store: Map<string, any> = new Map();
    private static _watchers: Map<string, WatchEntry[]> = new Map();

    // ── 读写 ─────────────────────────────────────────────────

    /** 设置状态值，支持局部更新对象字段 */
    public static set(key: string, val: any, field?: string | number) {
        const oldVal = this._store.get(key);

        if (field === undefined || field === null) {
            this._store.set(key, val);
            this._notify(key, val, oldVal);
        } else {
            let container = oldVal;
            if (container === undefined || container === null) {
                container = typeof field === "number" ? [] : {};
            }
            const oldSubVal = container[field];
            container[field] = val;
            this._store.set(key, container);
            this._notify(key, val, oldSubVal);
        }
    }

    /** 读取状态值，支持读取对象字段 */
    public static get<T = any>(key: string, field?: string | number): T {
        const val = this._store.get(key);
        if (field === undefined || field === null) return val as T;
        return val?.[field] as T;
    }

    /** 是否存在某个 key */
    public static has(key: string): boolean {
        return this._store.has(key);
    }

    /** 删除某个 key */
    public static remove(key: string) {
        const oldVal = this._store.get(key);
        this._store.delete(key);
        this._notify(key, undefined, oldVal);
        this._watchers.delete(key);
    }

    /** 清空所有状态（切换关卡时调用） */
    public static clear() {
        this._store.clear();
        this._watchers.clear();
    }

    // ── 监听 ─────────────────────────────────────────────────

    /** 监听状态变化，注册时立即触发一次当前值 */
    static watch(key: Record<string, StoreCallback>, node?: Node): void;
    static watch(key: string, cb: StoreCallback, node?: Node): void;
    static watch(key: string | Record<string, StoreCallback>, cbOrNode?: StoreCallback | Node, node?: Node) {
        if (typeof key === "object") {
            const _node = cbOrNode instanceof Node ? cbOrNode : node;
            for (const k in key) this._addWatcher(k, key[k], _node);
        } else {
            this._addWatcher(key, cbOrNode as StoreCallback, node);
        }
    }

    /** 解绑监听 */
    public static unwatch(key: string, cb: StoreCallback) {
        const list = this._watchers.get(key);
        if (!list) return;
        this._watchers.set(key, list.filter(e => e.cb !== cb));
    }

    private static _addWatcher(key: string, cb: StoreCallback, node?: Node) {
        if (!this._watchers.has(key)) this._watchers.set(key, []);
        this._watchers.get(key)!.push({ cb, node });

        if (node) {
            node.once(Node.EventType.NODE_DESTROYED, () => this.unwatch(key, cb));
        }

        // 首次立即触发
        const cur = this._store.get(key);
        cb(cur, cur);
    }

    private static _notify(key: string, newVal: any, oldVal: any) {
        const list = this._watchers.get(key);
        if (!list || list.length === 0) return;
        const alive = list.filter(e => !e.node || e.node.isValid);
        this._watchers.set(key, alive);
        alive.forEach(e => e.cb(newVal, oldVal));
    }
}

export default class Store extends _StoreMgr { }
declare global { var Store: typeof _StoreMgr }
globalThis["Store"] = Store;
