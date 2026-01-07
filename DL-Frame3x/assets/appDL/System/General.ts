/*******************************************************************************
 * 描述:    全局工具类
*******************************************************************************/
import { Component, EventTarget, Material, Node } from "cc";
import AssetMgr from "../Manager/AssetMgr";
import { mp3Type } from "../../../type_mp3";
import { k_v } from "../../../type_cetend_cc";
import { main } from "../../main";

class General {
    /**开启log*/
    public static openLog = true;

    /**材质资源 */
    public static materials: k_v<Material> = {};
    /** 全局事件 */
    public static event = new EventTarget();
    /** 全局资源管理器 */
    public static asset: AssetMgr;
    /** 音频管理 */
    public static mp3: mp3Type;
    /** 配置管理 */
    public static config: configType;
    /** Main场景组件实例对象 */
    public static main: main;

    /** 初始化 */
    public static init(main: main) {
        G.main = main;
        C.init();
        G.asset = new AssetMgr();
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