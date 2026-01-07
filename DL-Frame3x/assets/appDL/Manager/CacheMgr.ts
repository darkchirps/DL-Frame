/*******************************************************************************
 * 描述:    框架缓存管理
*******************************************************************************/

import { sys } from "cc";
import { Gvent, LanguageType } from "../System/GlobalEventEnum";
/**通用存储key */
export enum cKey {
    musicSwitch = "musicSwitch",
    soundSwitch = "soundSwitch",
    shakeSwitch = "shakeSwitch",
    languageId = "languageId",
}

class CacheMgr {

    static get musicSwitch() {
        return this.get(cKey.musicSwitch);
    }
    static set musicSwitch(v: boolean) {
        if (v === null) v = true;
        this.set(cKey.musicSwitch, v);
    }
    static get soundSwitch() {
        return this.get(cKey.soundSwitch);
    }
    static set soundSwitch(v: boolean) {
        if (v === null) v = true;
        this.set(cKey.soundSwitch, v);
    }
    static get shakeSwitch() {
        return this.get(cKey.shakeSwitch);
    }
    static set shakeSwitch(v: boolean) {
        if (v === null) v = true;
        this.set(cKey.shakeSwitch, v);
    }
    static get languageId() {
        return this.get(cKey.languageId);
    }
    static set languageId(v: LanguageType | string) {
        if (v === null) v = LanguageType.Chinese;
        this.set(cKey.languageId, v);
        G.event.emit(Gvent.changeLanguage);
    }

    static init() {
        for (let i in cKey) {
            if (this[i] === null) this[i] = null;
        }
    }

    static data: Record<string, string> = {};
    static get(key: cKey | any, state?: number | string) {
        const _key = `${this.signKey}_${key}`;
        const storedData = sys.localStorage.getItem(_key);
        if (storedData === null) return null;
        const data = JSON.parse(storedData);
        // 如果没有state参数，返回完整数据
        if (state === null || state === undefined) return data;
        // 根据初始数据类型处理state
        if (Array.isArray(data)) {
            // 数组类型：state必须是数字索引
            return typeof state === 'number' ? data[state] : null;
        } else if (typeof data === 'object' && data !== null) {
            // 对象类型：state可以是字符串或数字（作为属性名）
            return data[state];
        }
        return null;
    }
    static set(key: cKey | any, val: any, state?: number | string) {
        const _key = `${this.signKey}_${key}`;
        let storedData = sys.localStorage.getItem(_key);
        let container = storedData ? JSON.parse(storedData) : null;

        // 如果没有state，直接存储整个值
        if (state === null || state === undefined) {
            container = val;
        } else {
            // 如果容器不存在，根据state类型创建初始容器
            if (container === null) {
                // 根据state类型决定初始容器类型
                container = typeof state === 'number' ? [] : {};
            }
            // 检查容器类型是否匹配
            const isArray = Array.isArray(container);
            const isObject = typeof container === 'object' && container !== null;

            if (isArray && typeof state === 'number') {
                // 数组类型 + 数字索引：直接设置值
                container[state] = val;
            } else if (isObject && (typeof state === 'string' || typeof state === 'number')) {
                // 对象类型 + 字符串/数字键名：设置属性值
                container[state] = val;
            } else {
                // 类型不匹配时不处理state
                console.error(`Storage type mismatch! 
                Container is ${isArray ? 'array' : isObject ? 'object' : typeof container}, 
                state is ${typeof state}`);
            }
        }
        // 保存更新后的数据
        const finalData = container;
        this.data[key] = JSON.stringify(finalData);
        sys.localStorage.setItem(_key, JSON.stringify(finalData));
    }
    static clearAll() {
        // 仅清除本项目命名空间下的缓存，避免误删其它模块数据
        const prefix = `${this.signKey}_`;
        const toRemove: string[] = [];
        for (let i = 0; i < sys.localStorage.length; i++) {
            const key = sys.localStorage.key(i);
            if (key && key.indexOf(prefix) === 0) toRemove.push(key);
        }
        for (const k of toRemove) sys.localStorage.removeItem(k);
    }
    static signKey: string = "main";
}
/** 主项目缓存管理器 */
export default class C extends CacheMgr { }
declare global { var C: typeof CacheMgr }
globalThis["C"] = C;

