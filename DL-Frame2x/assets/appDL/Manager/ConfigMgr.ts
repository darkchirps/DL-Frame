import { ResourceType } from "../System/BinaryConfigReader";

/*******************************************************************************
 * 描述:    配置管理
*******************************************************************************/
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
export default class ConfigMgr {

    private static _bin = {};
    private static _json = {};

    /**对外初始化接口，在合适的时机调用 bin配置文件*/
    static init(bName: string, dir: string, callback: Function) {
        G.asset.loadDirRes(bName, dir).then((binList: cc.BufferAsset[]) => {
            binList.forEach((bin: cc.BufferAsset) => {
                if (bin instanceof cc.BufferAsset) {
                    try {
                        // 获取二进制数据
                        // @ts-ignore
                        const buffer = bin._buffer;
                        if (buffer) {
                            // 解析二进制数据
                            const configData = Bin.parseBinaryResource(buffer, ResourceType.CONFIG);
                            const fileName = bin.name.replace('.bin', '');
                            this._bin[fileName] = configData;
                            console.log(`加载二进制配置成功: ${bin.name}`);
                        }
                    } catch (error) {
                        console.error(`解析二进制文件 ${bin.name} 失败:`, error);
                    }
                }
            });
            callback && callback(new Proxy(ConfigMgr._bin, binProxyHandler));
        });
    }
    /**对外初始化接口，在合适的时机调用 json配置文件*/
    static initJson(bName: string, dir: string, callback: Function) {
        G.asset.loadDirRes(bName, dir).then((jList: cc.JsonAsset[]) => {
            jList.forEach((json: cc.JsonAsset) => {
                if (json instanceof cc.JsonAsset && json.json) {
                    // 保留文件名作为键名
                    this._json[json.name] = json.json;
                }
            });
            callback && callback(new Proxy(ConfigMgr._json, jsonProxyHandler));
        });
    }
    // 创建一个get的方法来从_json中取得数据 type文件类型 bin/json
    static getJson(name: string, type: string) {
        const config = type == "bin" ? this._bin[name] : this._json[name];
        return {
            // 查询方法：支持按任意键查找
            get: <T = any>(value?: any, key: string = 'id'): T | null => {
                if (!config) {
                    console.warn(`config no found: ${name}`);
                    return null;
                }
                //判断config是否是数组
                if (Array.isArray(config)) {
                    if (name == "language") key = "lid";
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
globalThis["ConfigMgr"] = ConfigMgr;
