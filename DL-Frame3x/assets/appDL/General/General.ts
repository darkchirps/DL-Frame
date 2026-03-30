/*******************************************************************************
 * 描述:    全局总控类
*******************************************************************************/
import { Component, EventTarget, Material, Node } from "cc";
import AssetMgr from "../Manager/AssetMgr";
import { k_v } from "../../../type_cetend_cc";
import { main } from "../../main";
import GeneralArrayMap from "./GeneralArrayMap";
import GeneralEffect from "./GeneralEffect";
import GeneralI18n from "./GeneralI18n";
import GeneralShift from "./GeneralShift";
import GeneralTime from "./GeneralTime";
import GeneralValue from "./GeneralValue";
import AssetRemoteMgr from "../Manager/AssetRemoteMgr";

class General {
    /**开启log*/
    public static openLog = true;

    /**材质资源 */
    public static materials: k_v<Material> = {};
    /** 全局事件 */
    public static event = new EventTarget();
    /** 全局资源管理器 */
    public static asset: AssetMgr;
    /** 全局资源管理器(远程) — 全静态类，直接用 AssetRemoteMgr.loadAssetRemote() 调用 */
    public static assetRemote: typeof AssetRemoteMgr;
    /** 音频管理 */ //@ts-ignore
    public static mp3: mp3Type;
    /** 配置管理 */ //@ts-ignore
    public static config: configType;
    /** Main场景组件实例对象 */
    public static main: main;
    /** 当前时间戳 */
    public static get time() { return Date.now() }

    /**数组Map相关*/
    public static arrayMgr: GeneralArrayMap;
    /**效果相关*/
    public static effectMgr: GeneralEffect;
    /**多语言相关*/
    public static i18nMgr: GeneralI18n;
    /**转换相关*/
    public static shiftMgr: GeneralShift;
    /**时间相关*/
    public static timeMgr: GeneralTime;
    /**数值相关*/
    public static valueMgr: GeneralValue;

    /** 初始化 */
    public static init(main: main) {
        G.main = main;
        G.asset = new AssetMgr();
        // AssetRemoteMgr 已全静态，无需实例化

        G.arrayMgr = new GeneralArrayMap();
        G.effectMgr = new GeneralEffect();
        G.i18nMgr = new GeneralI18n();
        G.shiftMgr = new GeneralShift();
        G.timeMgr = new GeneralTime();
        G.valueMgr = new GeneralValue();

        C.init();
    }

}
/** 全局总管理器 */
export default class G extends General { }
declare global { var G: typeof General }
globalThis["G"] = G;



type ConsoleMethod = 'log' | 'warn' | 'error';
const originalConsoleMethods: Record<ConsoleMethod, Function> = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
};
const createConsoleHandler = <T extends ConsoleMethod>(method: T) => {
    return (...args: Parameters<typeof console[T]>) => { if (G.openLog) { originalConsoleMethods[method](...args); } };
};
console.log = createConsoleHandler('log');
console.warn = createConsoleHandler('warn');
console.error = createConsoleHandler('error');