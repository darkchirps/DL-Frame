/*******************************************************************************
 * 描述:    配置管理 初始加载所有配置
*******************************************************************************/
import { BufferAsset, JsonAsset, _decorator } from "cc";
import { ResourceType } from "../System/BinaryResourceLoader";

class _ConfigMgr {
    private static _bin = {};
    private static _json = {};

    // 对外初始化接口，加载所有bin文件配置
    static initBin(bName: string, dir: string, callback: Function) {
        G.asset.loadDirRes(bName, dir).then((binList) => {
            binList.forEach((bin) => {
                if (bin instanceof BufferAsset) {
                    // 获取二进制数据
                    const buffer = bin.buffer();
                    if (buffer) {
                        // 解析二进制数据
                        const configData = Bin.parseBinaryResource(buffer, ResourceType.CONFIG);
                        const fileName = bin.name.replace('.bin', '');
                        this._bin[fileName] = configData;
                        console.log(`加载二进制配置成功: ${bin.name}`);
                    }
                }
            });
            callback && callback(new Proxy(ConfigMgr._bin, binProxyHandler));
        });
    }
    // 对外初始化接口 可选，加载所有json文件配置
    static initJson(bName: string, dir: string, callback: Function) {
        G.asset.loadDirRes(bName, dir).then((jList: JsonAsset[]) => {
            jList.forEach((json: JsonAsset) => {
                if (json instanceof JsonAsset && json.json) {
                    // 保留文件名作为键名
                    this._json[json.name] = json.json;
                    console.log(`加载json配置成功: ${json.name}`);
                }
            });
            callback && callback(new Proxy(ConfigMgr._json, jsonProxyHandler));
        });
    }
    // 创建一个get的方法来从_json中取得数据
    static getJson(name: string, type: string) {
        const config = type == "bin" ? this._bin[name] : this._json[name];
        return {
            // 查询方法：支持按任意键查找
            get: <T = any>(value?: any, key: string = 'id'): T | null => {
                if (!config) {
                    console.warn(`配置表不存在: ${name}`);
                    return null;
                }
                if (Array.isArray(config)) {
                    return config.filter(item => item[key] === value)[0] as T || null;
                } else {
                    return config as T;
                }
            },
            // 获取所有数据项
            getAll: () => Object.values(config || {})
        };
    }
}

const binProxyHandler = {
    get: function (target, name) {
        return ConfigMgr.getJson(name, "bin");
    }
};
const jsonProxyHandler = {
    get: function (target, name) {
        return ConfigMgr.getJson(name, "json");
    }
};

/** 配置管理器 */
export default class ConfigMgr extends _ConfigMgr { }
declare global { var ConfigMgr: typeof _ConfigMgr }
globalThis["ConfigMgr"] = ConfigMgr;
