/*******************************************************************************
 * 描述:    资源管理
*******************************************************************************/
import { Asset, assetManager, log, AssetManager, Texture2D, TextAsset, SpriteFrame, Prefab, AudioClip, JsonAsset } from "cc";

interface AssetEntry {
    asset: Asset;
    lastGetTime: number;
    tag: Record<string, number>;
}

export default class AssetMgr {

    public assetsInfo: Record<string, AssetEntry> = {};

    constructor() {
        //定时清理冷资源
        // G.main.schedule(() => {
        //     this._autoRef();
        // }, 50);
    }

    /** 一般用于加载配置/音频
     * 加载整个bundle或者文件资源，一般用于进入游戏前，需要加载某些必要的预制体或者资源
     * 这里要注意：因为加载的资源，都没有走assetsInfo机制，不存在自动释放。
     * @param bundleName
     * @param dir
     */
    public loadDirRes(bundleName: string, dir: string, callback?: Function): Promise<any> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err || !bundle) {
                    console.error("loadDirRes: 加载 Bundle 失败", bundleName, err);
                    return reject(err);
                }
                bundle.loadDir(dir, (finish: number, total: number, item: AssetManager.RequestItem) => {
                    if (finish >= total) callback?.();
                }, (err, asset) => {
                    if (err) {
                        console.error("Bundle预加载异常:", err);
                        return reject(null);
                    }
                    return resolve(asset);
                });
            });
        });
    }

    /**
     * 从AB包中加载AudioClip
     * @param path 资源路径
     * @param bundleName AB包名，可选，默认为 audio
     * @returns
     */
    public async getAudio(bundleName: string = "resources", path: string, assetTag: string = "GameAudio"): Promise<AudioClip> {
        return this.getAsset(bundleName, `audio/${path}`, assetTag, AudioClip) as any;
    }
    /**
     * 从AB包中加载Prefab
     * @param bundleName AB包名
     * @param path 资源路径
     * @returns Prefab
     */
    public async getPrefab(bundleName: string = "ui", path: string, assetTag?: string): Promise<Prefab> {
        return this.getAsset(bundleName, path, assetTag, Prefab) as any;
    }
    /**
     * 从AB包中加载SpriteFrame
     * @param bundleName AB包名
     * @param path 资源路径
     * @returns SpriteFrame
     */
    public async getSpriteFrame(bundleName: string = "ui", path: string, assetTag?: string): Promise<SpriteFrame> {
        return this.getAsset(bundleName, path, assetTag, SpriteFrame) as any;
    }
    /**
     * 从AB包中加载Texture2D
     * @param bundleName AB包名
     * @param path 资源路径
     * @returns Texture2D
     */
    public async getTexture(bundleName: string = "ui", path: string, assetTag?: string): Promise<Texture2D> {
        return this.getAsset(bundleName, path, assetTag, Texture2D) as any;
    }
    /**
     * 从AB包中加载txt
     * @param bundleName AB包名
     * @param path 资源路径
     * @returns json
     */
    public async getText(bundleName: string = "ui", path: string, assetTag?: string): Promise<TextAsset> {
        return this.getAsset(bundleName, path, assetTag, TextAsset) as any;
    }
    /**
     * 从AB包中加载json
     * @param bundleName AB包名
     * @param path 资源路径
     * @returns json
     */
    public async getJson(bundleName: string = "ui", path: string, assetTag?: string): Promise<JsonAsset> {
        return this.getAsset(bundleName, path, assetTag, JsonAsset) as any;
    }
    /**
     * 从AB包中加载一个资源
     * @param bundleName AB包名
     * @param path 资源路径
     * @param assetType 资源类型
     * @returns Promise对象，值为Asset
     */
    public getAsset(bundleName: string, path: string, assetTag?: string, assetType?: typeof Asset) {
        return new Promise((resolve, reject) => {
            //记录资源索引
            if (!assetType) assetType = Asset;
            if ((assetType as any) === SpriteFrame) {
                path += "/spriteFrame";
            } else if ((assetType as any) === Texture2D) {
                path += "/texture";
            }
            let pathID = `${bundleName}_${path}_${assetType.name}`;
            if (!assetTag) assetTag = pathID;

            // 确保 entry 存在且 tag 字段已初始化
            if (!this.assetsInfo[pathID]) {
                this.assetsInfo[pathID] = { asset: null, lastGetTime: 0, tag: {} };
            }
            const entry = this.assetsInfo[pathID];

            if (entry.asset?.isValid) {
                if (!entry.tag[assetTag]) {
                    entry.asset.addRef();
                }
                entry.tag[assetTag] = 1;
                resolve(entry.asset);
                return;
            }
            this.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    console.warn("load Bundle error", bundleName, err);
                    resolve && resolve(null);
                    return;
                }
                bundle.load(path, assetType, (err, asset) => {
                    if (err) {
                        console.warn(" bundle get asset error", path, err);
                        resolve(null);
                        return;
                    }
                    const tag: Record<string, number> = {};
                    tag[assetTag] = 1;
                    this.assetsInfo[pathID] = {
                        asset,
                        lastGetTime: Date.now(),
                        tag,
                    };
                    asset.addRef();
                    resolve(asset);
                });
            });
        });
    }
    /**正常加载bundle中资源 可自动释放 一般用于页面资源及其预制*/
    public loadBundle(bundleName, callback) {
        if (assetManager.getBundle(bundleName)) {
            callback && callback(null, assetManager.getBundle(bundleName));
            return;
        }
        assetManager.loadBundle(bundleName, (err, bundle) => {
            callback && callback(err, bundle);
        });
    }
    /**
     * 释放资源，框架内部方法
     * @param assetTag 资源标签
     */
    public decRefByTag(assetTag: string) {
        log("减少资源计数索引=>", assetTag);
        for (const path in this.assetsInfo) {
            const entry = this.assetsInfo[path];
            if (entry?.asset?.isValid && entry.tag[assetTag]) {
                entry.asset.decRef();
                delete entry.tag[assetTag];
            }
            entry.lastGetTime = Date.now();
        }
    }
    public _autoRef() {
        const now = Date.now();
        log("自动释放资源检测", now);
        for (const path in this.assetsInfo) {
            const entry = this.assetsInfo[path];
            if (now - entry.lastGetTime <= 5 * 60 * 1000) continue;
            const asset = entry.asset;
            if (!asset || !asset.isValid || asset.refCount <= 1) {
                if (asset?.isValid) {
                    log("释放资源==>", asset);
                    asset.decRef();
                }
                delete this.assetsInfo[path];
            }
        }
    }
}
globalThis["AssetMgr"] = AssetMgr;