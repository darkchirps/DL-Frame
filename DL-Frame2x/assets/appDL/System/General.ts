/*******************************************************************************
 * 描述:    框架全局管理器
*******************************************************************************/
//@ts-ignore
import { mp3Type } from "../../../type_mp3";
import { main } from "../../main";
import AssetMgr from "../Manager/AssetMgr";
import AssetRemoteMgr from "../Manager/AssetRemoteMgr";
import GeneralValue from "../General/GeneralValue";
import GeneralArray from "../General/GeneralArray";
import GeneralEffect from "../General/GeneralEffect";
import GeneralMap from "../General/GeneralMap";
import GeneralRandom from "../General/GeneralRandom";
import GeneralShift from "../General/GeneralShift";
import GeneralTime from "../General/GeneralTime";
import GeneralI18n from "../General/GeneralI18n";

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

    /**数组相关*/
    public static arrayMgr: GeneralArray;
    /**效果相关*/
    public static effectMgr: GeneralEffect;
    /**多语言相关*/
    public static i18nMgr: GeneralI18n;
    /**map相关*/
    public static mapMgr: GeneralMap;
    /**随机相关*/
    public static randomMgr: GeneralRandom;
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
        G.assetRemote = new AssetRemoteMgr();

        G.arrayMgr = new GeneralArray();
        G.effectMgr = new GeneralEffect();
        G.i18nMgr = new GeneralI18n();
        G.mapMgr = new GeneralMap();
        G.randomMgr = new GeneralRandom();
        G.shiftMgr = new GeneralShift();
        G.timeMgr = new GeneralTime();
        G.valueMgr = new GeneralValue();
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