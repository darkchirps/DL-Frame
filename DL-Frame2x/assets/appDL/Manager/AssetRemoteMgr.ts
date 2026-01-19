/*******************************************************************************
 * 描述:    远程资源管理
*******************************************************************************/

// 加载状态枚举
export enum LoadType {
    INIT,
    LOADING,    // 加载中
    LOADOVER,   // 加载完成
    FAILED      // 加载失败
}

// 资源类型定义
export interface AssetType {
    loadState: LoadType;     // 加载状态
    assetData: any;          // 资源数据
    callbacks: {
        resolve: (value: any) => void;
        reject: (reason?: any) => void;
        node?: cc.Node | string;
    };                     // 回调队列
    retryCount: number;     // 重试次数
    lastLoadTime: number;   // 上次加载时间
}

export default class AssetRemoteMgr {
    // 远程资源信息
    private assetsRemoteInfo: { [key: string]: AssetType } = {};

    /**
     * 加载远程资源
     * @param assetUrl 资源的url
     * @param assetName 资源名(唯一)
      */
    public async loadAssetRemote(assetUrl: string, assetName: string, node?: cc.Node | string): Promise<any> {
        return new Promise((resolve, reject) => {
            // 检查资源是否已存在
            if (this.assetsRemoteInfo[assetName]) {
                console.log("资源已记录");
                const assetInfo = this.assetsRemoteInfo[assetName];
                if (node && this.assetsRemoteInfo[assetName].callbacks && this.assetsRemoteInfo[assetName].callbacks.node) {
                    this.assetsRemoteInfo[assetName].callbacks.node = node;
                }
                switch (assetInfo.loadState) {
                    case LoadType.LOADOVER:
                        // 资源已加载完成，直接返回
                        console.log("资源已记录，已存在，直接返回");
                        if (node && (cc.isValid(node) || node == "system")) {
                            resolve(assetInfo.assetData);
                        }
                        return;
                    case LoadType.LOADING:
                        // 资源正在加载中，将回调加入队列
                        console.log("资源已记录，加载中，回调返回");
                        if (node && cc.isValid(node) || !node) {
                            assetInfo.callbacks = { resolve, reject, node };
                        }
                        return;
                }
            }
            // 新资源，开始加载
            this._startLoad(assetUrl, assetName, resolve, reject, node);
        });
    }

    /**
     * 开始加载资源
     */
    private _startLoad(assetUrl: string, assetName: string, resolve: (value: any) => void, reject: (reason?: any) => void, node?: cc.Node | string): void {
        this.assetsRemoteInfo[assetName] = { loadState: LoadType.LOADING, assetData: null, callbacks: { resolve, reject, node }, retryCount: 0, lastLoadTime: Date.now() };
        // 开始加载资源
        cc.assetManager.loadRemote(assetUrl, (err: any, asset: any) => {
            if (err) {
                console.error("新资源加载失败");
            } else {
                this._handleLoadSuccess(assetName, asset);
            }
        });
    }

    /**
     * 处理加载成功
     */
    private _handleLoadSuccess(assetName: string, asset: any): void {
        const assetInfo = this.assetsRemoteInfo[assetName];
        if (!assetInfo) return;
        assetInfo.loadState = LoadType.LOADOVER;
        assetInfo.assetData = asset;
        // 执行等待的回调
        if (assetInfo.callbacks.node && (cc.isValid(assetInfo.callbacks.node) || assetInfo.callbacks.node == "system")) {
            assetInfo.callbacks.resolve(asset);
        }
        // 清空回调队列
        assetInfo.callbacks = null;
    }

    /**
     * 获取资源（如果已加载）
     */
    public getAsset(assetName: string): any {
        const assetInfo = this.assetsRemoteInfo[assetName];
        return assetInfo && assetInfo.loadState === LoadType.LOADOVER ? assetInfo.assetData : null;
    }

    /**
     * 检查资源状态
     */
    public getAssetState(assetName: string): LoadType {
        const assetInfo = this.assetsRemoteInfo[assetName];
        return assetInfo ? assetInfo.loadState : LoadType.INIT;
    }

    /**
     * 释放指定资源
     */
    public releaseAsset(assetName: string): boolean {
        const assetInfo = this.assetsRemoteInfo[assetName];
        if (assetInfo) {
            // 如果有正在加载的回调，通知它们资源被释放
            if (assetInfo.loadState === LoadType.LOADING) {
                assetInfo.callbacks.reject(new Error(`Resource ${assetName} released during loading`));
            }
            // 清理资源
            if (assetInfo.assetData && cc.isValid(assetInfo.assetData)) {
                cc.assetManager.releaseAsset(assetInfo.assetData);
            }

            delete this.assetsRemoteInfo[assetName];
            return true;
        }
        return false;
    }

    /**
     * 释放所有资源
     */
    public releaseAllAssets(): void {
        Object.keys(this.assetsRemoteInfo).forEach(assetName => {
            this.releaseAsset(assetName);
        });
        this.assetsRemoteInfo = {};
    }

    /**
     * 预加载资源（不阻塞）
     */
    public preloadAsset(assetUrl: string, assetName: string): void {
        if (!this.assetsRemoteInfo[assetName]) {
            this.loadAssetRemote(assetUrl, assetName).catch(error => {
                console.warn(`Preload failed for ${assetName}:`, error.message);
            });
        }
    }

}

// 全局实例
globalThis["AssetRemoteMgr"] = AssetRemoteMgr;