/*******************************************************************************
 * 描述:    资源管理
*******************************************************************************/
export default class AssetMgr {

    public assetsInfo = {};

    constructor() {
        //定时清理冷资源
        // G.main.schedule(() => {
        //     this.autoRef();
        // }, 5);
    }

    /** 一般用于加载配置/音频
     * 加载整个bundle或者文件资源，一般用于进入游戏前，需要加载某些必要的预制体或者资源
     * 这里要注意：因为加载的资源，都没有走assetsInfo机制，不存在自动释放。
     * @param bundleName
     * @param dir
     */
    public loadDirRes(bundleName: string, dir: string, callback?: Function): Promise<any> {
        return new Promise((resolve, reject) => {
            cc.assetManager.loadBundle(bundleName, (err, bundle) => {
                bundle.loadDir(dir, (finish: number, total: number, item: cc.AssetManager.RequestItem) => {
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
    public loadBundle(bundleName, callback) {
        if (cc.assetManager.getBundle(bundleName)) {
            callback && callback(null, cc.assetManager.getBundle(bundleName));
            return;
        }
        cc.assetManager.loadBundle(bundleName, (err, bundle) => {
            callback && callback(err, bundle);
        });
    }
    public async getAsset(bundleName: string, path: string, assetTag?: string, assetType?: typeof cc.Asset): Promise<cc.Asset | any> {
        return new Promise((resolve) => {
            if (!assetType) assetType = cc.Asset;

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
    public ifAssetLoaded(bundleName: string, path: string, assetTag?: string): boolean {
        let pathID = `${bundleName}_${path}_${cc.Prefab.name}`;
        if (!assetTag) {
            assetTag = pathID;
        }
        return !!this.assetsInfo[pathID];
    }
    /**
     * 释放资源，框架内部方法
     * @param assetTag 资源标签
     */
    public decRefByTag(assetTag: string) {
        var asset: cc.Asset, lastGetTime;
        console.log("减少资源计数索引=>", assetTag);
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
    /**
     * 从AB包中加载AudioClip
     * @param path 资源路径
     * @param bundleName AB包名，可选，默认为 audio
     * @returns
     */
    public async getAudio(path: string, bundleName: string = "resources", assetTag: string = "GameAudio"): Promise<cc.AudioClip> {
        return this.getAsset(bundleName, `audio/${path}`, assetTag, cc.AudioClip) as any;
    }
    /**
     * 从AB包中加载Prefab
     * @param bundleName AB包名
     * @param path 资源路径
     * @returns Prefab
     */
    public async getPrefab(bundleName: string = "ui", path: string, assetTag?: string): Promise<cc.Prefab> {
        return this.getAsset(bundleName, path, assetTag, cc.Prefab) as any;
    }
    /**
     * 从AB包中加载SpriteFrame
     * @param bundleName AB包名
     * @param path 资源路径
     * @returns SpriteFrame
     */
    public async getSpriteFrame(bundleName: string = "ui", path: string, assetTag?: string): Promise<cc.SpriteFrame> {
        return this.getAsset(bundleName, path, assetTag, cc.SpriteFrame) as any;
    }
    /** 动态图获取接口 */
    public async getDynamicPic(name: string, assetTag: string = "GameDynamic") {
        return this.getAsset("resources", "imgDynamic/" + name, assetTag, cc.SpriteFrame) as any;
    }
    /**
     * 从AB包中加载Texture2D
     * @param bundleName AB包名
     * @param path 资源路径
     * @returns Texture2D
     */
    public async getTexture(bundleName: string = "ui", path: string, assetTag?: string): Promise<cc.Texture2D> {
        return this.getAsset(bundleName, path, assetTag, cc.Texture2D) as any;
    }
    /**
     * 从AB包中加载txt
     * @param bundleName AB包名
     * @param path 资源路径
     * @returns json
     */
    public async getText(bundleName: string = "ui", path: string, assetTag?: string): Promise<cc.TextAsset> {
        return this.getAsset(bundleName, path, assetTag, cc.TextAsset) as any;
    }
    /**
     * 从AB包中加载json
     * @param bundleName AB包名
     * @param path 资源路径
     * @returns json
     */
    public async getJson(bundleName: string = "ui", path: string, assetTag?: string): Promise<cc.JsonAsset> {
        return this.getAsset(bundleName, path, assetTag, cc.JsonAsset) as any;
    }
}
globalThis["AssetMgr"] = AssetMgr;