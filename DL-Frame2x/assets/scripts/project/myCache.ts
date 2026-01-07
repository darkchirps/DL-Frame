export enum myCType {//顺序往下增加
    firstOpen = "firstOpen",//所有需要首次打开的功能都用这个 或者记录时间戳
    firstGame = "firstGame",//是否首次进游戏
    deepUserId = "deepUserId",//深度用户id 1非深链2深链
    lifeSub = "lifeSub",//是否购买终身订阅
    removeAds = "removeAds",//去广告
}
/**本项目所需缓存信息*/
class myCache {//新增在头部增加，在以下增加新缓存

    static get removeAds() {
        return this.get(myCType.removeAds);
    }
    static set removeAds(v: number) {
        if (v === null) v = 0;
        this.set(myCType.removeAds, v);
    }
    static get lifeSub() {
        return this.get(myCType.lifeSub);
    }
    static set lifeSub(v: boolean) {
        if (v === null) v = false;
        this.set(myCType.lifeSub, v);
    }
    static get deepUserId() {
        return this.get(myCType.deepUserId);
    }
    static set deepUserId(v: number) {
        if (v === null) v = 0;
        this.set(myCType.deepUserId, v);
    }
    static get firstGame() {
        return this.get(myCType.firstGame);
    }
    static set firstGame(v: boolean) {
        if (v === null) v = false;
        this.set(myCType.firstGame, v);
    }
    /**所有功能记录首次开启或者记录开启时间戳*/
    static get firstOpen(): { [key: string]: number } {
        return this.get(myCType.firstOpen);
    }
    static set firstOpen(v: { [key: string]: number }) {
        if (v === null) v = {};
        this.set(myCType.firstOpen, v);
    }
    /**
     * @param id 功能id=>key
     * @param num 数值 若0或不传默认当前时间戳
    */
    static setFirstOpen(id: string, num?: number) {
        this.set(myCType.firstOpen, num ? num : G.time, id);
    }

    static init() {
        for (let i in myCType) {
            if (this[i] === null) this[i] = null;
        }
    }
    static data: Record<string, string> = {};
    static get(key: myCType | any, state?: number | string) {
        const _key = `${this.signKey}_${key}`;
        const storedData = cc.sys.localStorage.getItem(_key);
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
    static set(key: myCType | any, val: any, state?: number | string) {
        const _key = `${this.signKey}_${key}`;
        let storedData = cc.sys.localStorage.getItem(_key);
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
        cc.sys.localStorage.setItem(_key, JSON.stringify(finalData));
    }
    /**切换深链*/
    static clearChangeDeep(id) {
        // 仅清除本项目命名空间下的缓存，避免误删其它模块数据
        const prefix = `${this.signKey}_`;
        const toRemove: string[] = [];
        for (let i = 0; i < cc.sys.localStorage.length; i++) {
            const key = cc.sys.localStorage.key(i);
            if (key && key.indexOf(prefix) === 0) toRemove.push(key);
        }
        for (const k of toRemove) cc.sys.localStorage.removeItem(k);
        this.deepUserId = id;
    }
    static signKey: string = "screw";
}
export default class myC extends myCache { }
declare global { var myC: typeof myCache }
globalThis["myC"] = myC;