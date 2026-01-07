/*******************************************************************************
 * 描述:    框架全局管理器
*******************************************************************************/
//@ts-ignore
import { mp3Type } from "../../../type_mp3";
import { main } from "../../main";
import AssetMgr from "../Manager/AssetMgr";
import AssetRemoteMgr from "../Manager/AssetRemoteMgr";

class generalMgr {
    /**开启log*/
    public static openLog: boolean = false;
    /** 全局事件 */
    public static event = new cc.EventTarget();
    /** 全局资源管理器 */
    public static asset: AssetMgr;
    /** 全局资源管理器(远程) */
    public static assetRemote: AssetRemoteMgr;
    /** 音频管理 */
    public static mp3: mp3Type;
    /** 配置管理 *///@ts-ignore
    public static config: configType;
    /** Main场景组件实例对象 */
    public static main: main;
    /** 当前时间戳 */
    public static get time() { return Date.now() }


    public static gameTime: number = 0;
    /** 初始化 */
    public static init(main: main) {
        G.gameTime = G.time;
        G.main = main;
        G.asset = new AssetMgr();
        G.assetRemote = new AssetRemoteMgr();
        C.init();
    }
}
export default class G extends generalMgr { }
declare global { var G: typeof generalMgr }
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