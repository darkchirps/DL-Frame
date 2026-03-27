/*******************************************************************************
 * 描述:    框架缓存管理
 *
 * 支持监听数据变化，依赖某个 key 的逻辑只需注册一次：
 *
 *   // 监听单个 key（注册时立即触发一次当前值）
 *   C.watch("gold", (newVal, oldVal) => { ... }, this.node);
 *
 *   // 监听多个 key（对象写法）
 *   C.watch({ gold: (val) => { ... }, level: (val) => { ... } }, this.node);
 *
 *   // 手动解绑
 *   C.unwatch("gold", callback);
 *
 * 注意：
 *   - init() 应在 watch() 之前调用，确保首次触发时默认值已写入
 *   - languageId 变化统一通过 watch("languageId") 监听，不再 emit 全局事件
*******************************************************************************/

import { Node, sys } from "cc";
import { Gvent, LanguageType } from "../System/GlobalEventEnum";

/** 通用存储key */
export enum cKey {
    musicSwitch = "musicSwitch",
    soundSwitch = "soundSwitch",
    shakeSwitch = "shakeSwitch",
    languageId  = "languageId",
}

class CacheMgr {

    static get musicSwitch() { return this.get(cKey.musicSwitch); }
    static set musicSwitch(v: boolean) {
        if (v === null) v = true;
        this.set(cKey.musicSwitch, v);
    }
    static get soundSwitch() { return this.get(cKey.soundSwitch); }
    static set soundSwitch(v: boolean) {
        if (v === null) v = true;
        this.set(cKey.soundSwitch, v);
    }
    static get shakeSwitch() { return this.get(cKey.shakeSwitch); }
    static set shakeSwitch(v: boolean) {
        if (v === null) v = true;
        this.set(cKey.shakeSwitch, v);
    }
    static get languageId() { return this.get(cKey.languageId); }
    static set languageId(v: LanguageType | string) {
        if (v === null) v = LanguageType.Chinese;
        // 改进1: 不再重复 emit 全局事件，统一走 watch("languageId") 监听
        this.set(cKey.languageId, v);
    }

    // 改进4: init 写入默认值时静默，不触发 watch 回调（此时 watch 尚未注册）
    static init() {
        for (let i in cKey) {
            if (this[i] === null) this[i] = null; // 触发 setter 写入默认值，静默模式
        }
    }

    // ── 监听表 ──────────────────────────────────────────────
    private static _watchers: Map<string, WatchEntry[]> = new Map();

    // 改进3: 重载签名，对象写法不再需要显式传 undefined
    static watch(key: Record<string, WatchCallback>, node?: Node): void;
    static watch(key: string, cb: WatchCallback, node?: Node): void;
    static watch(key: string | Record<string, WatchCallback>, cbOrNode?: WatchCallback | Node, node?: Node) {
        if (typeof key === 'object') {
            const _node = cbOrNode instanceof Node ? cbOrNode : node;
            for (const k in key) {
                this._addWatcher(k, key[k], _node);
            }
        } else {
            this._addWatcher(key, cbOrNode as WatchCallback, node);
        }
    }

    /** 解绑监听 */
    static unwatch(key: string, cb: WatchCallback) {
        const list = this._watchers.get(key);
        if (!list) return;
        this._watchers.set(key, list.filter(e => e.cb !== cb));
    }

    private static _addWatcher(key: string, cb: WatchCallback, node?: Node) {
        if (!this._watchers.has(key)) this._watchers.set(key, []);
        this._watchers.get(key).push({ cb, node });

        if (node) {
            node.once(Node.EventType.NODE_DESTROYED, () => {
                this.unwatch(key, cb);
            });
        }

        // 首次立即触发一次，用当前存储值初始化
        const curVal = this.get(key);
        cb(curVal, curVal);
    }

    private static _notify(key: string, newVal: any, oldVal: any) {
        const list = this._watchers.get(key);
        if (!list || list.length === 0) return;
        const alive = list.filter(e => !e.node || e.node.isValid);
        this._watchers.set(key, alive);
        alive.forEach(e => e.cb(newVal, oldVal));
    }

    // ── 存储 ────────────────────────────────────────────────
    static data: Record<string, string> = {};

    static get(key: cKey | any, state?: number | string) {
        const _key = `${this.signKey}_${key}`;
        const storedData = sys.localStorage.getItem(_key);
        if (storedData === null) return null;
        const data = JSON.parse(storedData);
        if (state === null || state === undefined) return data;
        if (Array.isArray(data)) {
            return typeof state === 'number' ? data[state] : null;
        } else if (typeof data === 'object' && data !== null) {
            return data[state];
        }
        return null;
    }

    static set(key: cKey | any, val: any, state?: number | string) {
        const _key = `${this.signKey}_${key}`;
        const storedData = sys.localStorage.getItem(_key);
        let container = storedData ? JSON.parse(storedData) : null;

        if (state === null || state === undefined) {
            const oldVal = container;
            container = val;
            this.data[key] = JSON.stringify(container);
            sys.localStorage.setItem(_key, JSON.stringify(container));
            this._notify(key, container, oldVal);
        } else {
            if (container === null) {
                container = typeof state === 'number' ? [] : {};
            }
            const isArray  = Array.isArray(container);
            const isObject = typeof container === 'object' && container !== null;

            if (isArray && typeof state === 'number') {
                // 改进2: oldVal 取子字段旧值，而非整个 container
                const oldSubVal = container[state];
                container[state] = val;
                this.data[key] = JSON.stringify(container);
                sys.localStorage.setItem(_key, JSON.stringify(container));
                this._notify(key, val, oldSubVal);
            } else if (isObject && (typeof state === 'string' || typeof state === 'number')) {
                // 改进2: oldVal 取子字段旧值
                const oldSubVal = container[state];
                container[state] = val;
                this.data[key] = JSON.stringify(container);
                sys.localStorage.setItem(_key, JSON.stringify(container));
                this._notify(key, val, oldSubVal);
            } else {
                console.error(`Storage type mismatch! Container is ${isArray ? 'array' : isObject ? 'object' : typeof container}, state is ${typeof state}`);
            }
        }
    }

    static clearAll() {
        const prefix = `${this.signKey}_`;
        const toRemove: string[] = [];
        for (let i = 0; i < sys.localStorage.length; i++) {
            const k = sys.localStorage.key(i);
            if (k && k.indexOf(prefix) === 0) toRemove.push(k);
        }
        for (const k of toRemove) sys.localStorage.removeItem(k);
    }

    static signKey: string = "main";
}

type WatchCallback = (newVal: any, oldVal: any) => void;

interface WatchEntry {
    cb: WatchCallback;
    node?: Node;
}

/** 主项目缓存管理器 */
export default class C extends CacheMgr { }
declare global { var C: typeof CacheMgr }
globalThis["C"] = C;
