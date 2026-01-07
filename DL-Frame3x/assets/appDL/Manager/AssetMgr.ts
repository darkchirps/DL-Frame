/*******************************************************************************
 * 描述:    资源管理
*******************************************************************************/
import { Asset, assetManager, error, log, AssetManager, Texture2D, TextAsset, SpriteFrame, Prefab, AudioClip, JsonAsset, sys } from "cc";

export default class AssetMgr {

    public assetsInfo = {};

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
                bundle.loadDir(dir, (finish: number, total: number, item: AssetManager.RequestItem) => {
                    if (finish >= total) {
                        callback && callback();
                    }
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
            if (!assetTag) {
                assetTag = pathID;
            }
            if (!this.assetsInfo[pathID]) {
                this.assetsInfo[pathID] = {};
            }
            if (this.assetsInfo[pathID]?.asset?.isValid) {
                let asset = this.assetsInfo[pathID].asset;
                if (!this.assetsInfo[pathID].tag[assetTag]) {
                    //如果这个tag没存在过，则增加引用计数
                    asset.addRef();
                }
                this.assetsInfo[pathID].tag[assetTag] = 1;
                resolve && resolve(asset);
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
                        resolve && resolve(null);
                        return;
                    }
                    var tag = {};
                    tag[assetTag] = 1;
                    this.assetsInfo[pathID] = {
                        asset: asset,
                        lastGetTime: new Date().getTime(),
                        tag: tag,
                    };
                    asset.addRef();
                    resolve && resolve(asset);
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
        var asset, lastGetTime;
        log("减少资源计数索引=>", assetTag);
        for (var path in this.assetsInfo) {
            asset = this.assetsInfo[path]?.asset;
            if (asset?.isValid && this.assetsInfo[path]?.tag[assetTag]) {
                asset.decRef();
                delete this.assetsInfo[path]?.tag[assetTag];
            }
            //更新最后访问时间，避免decRef后，立刻被_autoRef回收
            this.assetsInfo[path].lastGetTime = new Date().getTime();
        }
    }
    //自动释放资源
    public _autoRef() {
        var now = new Date().getTime();
        log("自动释放资源检测", now);
        var asset, lastGetTime;
        for (var path in this.assetsInfo) {
            asset = this.assetsInfo[path].asset;
            lastGetTime = this.assetsInfo[path].lastGetTime;

            //引用计数为1，则说明只有MyAsset自身持有了，游戏逻辑本身已经不需要，指定时间没访问过的冷资源，则释放掉
            if (now - lastGetTime > 5 * 60 * 1000) {
                if (asset == undefined) {
                    delete this.assetsInfo[path];
                } else if (!asset.isValid) {
                    log("释放资源==>", asset);
                    delete this.assetsInfo[path];
                } else if (asset.isValid && asset.refCount <= 1) {
                    log("释放资源==>", asset);
                    asset.decRef();
                    delete this.assetsInfo[path];
                }
            }
        }
    }
}
globalThis["AssetMgr"] = AssetMgr;