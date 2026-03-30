/*******************************************************************************
 * 描述:    远程资源管理 (适配 Cocos Creator 3.x)
*******************************************************************************/

import { sys, assetManager, native } from 'cc';

export default class AssetRemoteMgr {

    private static readonly CACHE_DIR_NAME = "video_cache";

    /** 缓存目录路径，初始化一次 */
    private static _cacheDir: string = null;

    /** 正在下载中的任务表，防止并发重复下载 */
    private static _pending: Map<string, Promise<string>> = new Map();

    /**
     * 加载/获取远程资源路径
     * @param assetUrl 资源 url
     * @param assetType 资源后缀 (如 "mp4", "png")
     */
    public static async loadAssetRemote(assetUrl: string, assetType: string): Promise<string> {
        // Web 平台直接返回 URL
        if (!sys.isNative) return assetUrl;

        const localPath = this.getLocalPath(assetUrl, assetType);

        // 命中本地缓存
        if (native.fileUtils.isFileExist(localPath)) {
            console.log(`[AssetRemoteMgr] 命中缓存: ${localPath}`);
            return localPath;
        }

        // 防并发：同一 URL 已在下载中，复用同一个 Promise
        if (this._pending.has(assetUrl)) {
            console.log(`[AssetRemoteMgr] 等待已有下载任务: ${assetUrl}`);
            return this._pending.get(assetUrl);
        }

        const task = this._download(assetUrl, assetType, localPath);
        this._pending.set(assetUrl, task);
        try {
            return await task;
        } finally {
            this._pending.delete(assetUrl);
        }
    }

    /** 执行实际下载并写入磁盘 */
    private static _download(assetUrl: string, assetType: string, localPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            console.log(`[AssetRemoteMgr] 开始下载: ${assetUrl}`);
            assetManager.loadRemote(assetUrl, { responseType: 'arraybuffer' }, (err, asset) => {
                if (err) {
                    console.error(`[AssetRemoteMgr] 下载失败: ${assetUrl}`, err);
                    reject(err);
                    return;
                }

                const raw = (asset as any)._nativeAsset || (asset as any).data || asset;
                let data: ArrayBuffer;

                if (raw instanceof ArrayBuffer) {
                    data = raw;
                } else if (ArrayBuffer.isView(raw)) {
                    data = raw.buffer as ArrayBuffer;
                } else {
                    assetManager.releaseAsset(asset);
                    reject(new Error(`[AssetRemoteMgr] 数据格式不正确: ${assetUrl}`));
                    return;
                }

                const success = native.fileUtils.writeDataToFile(data, localPath);
                assetManager.releaseAsset(asset);

                if (success) {
                    console.log(`[AssetRemoteMgr] 缓存成功: ${localPath}`);
                    resolve(localPath);
                } else {
                    reject(new Error(`[AssetRemoteMgr] 写入磁盘失败: ${localPath}`));
                }
            });
        });
    }

    /**
     * 获取缓存文件完整路径
     * 目录只初始化一次，避免重复 IO
     */
    private static getLocalPath(url: string, type: string): string {
        if (!this._cacheDir) {
            this._cacheDir = native.fileUtils.getWritablePath() + this.CACHE_DIR_NAME + "/";
            if (!native.fileUtils.isDirectoryExist(this._cacheDir)) {
                native.fileUtils.createDirectory(this._cacheDir);
            }
        }
        return this._cacheDir + this._hashUrl(url) + "." + type;
    }

    /**
     * 对 URL 生成更可靠的哈希文件名
     * 用 url 末段路径 + 简单校验和组合，降低碰撞概率且保留可读性
     */
    private static _hashUrl(url: string): string {
        // 取 url 最后一段作为可读前缀
        const seg = url.split('/').pop()?.split('?')[0]?.replace(/[^a-zA-Z0-9_-]/g, '') ?? 'file';
        // djb2 校验和
        let h = 5381;
        for (let i = 0; i < url.length; i++) {
            h = ((h << 5) + h) ^ url.charCodeAt(i);
            h |= 0;
        }
        return `${seg}_${Math.abs(h).toString(36)}`;
    }

    /**
     * 删除指定 URL 的本地缓存
     */
    public static removeCache(assetUrl: string, assetType: string): boolean {
        if (!sys.isNative) return false;
        const p = this.getLocalPath(assetUrl, assetType);
        if (native.fileUtils.isFileExist(p)) {
            native.fileUtils.removeFile(p);
            return true;
        }
        return false;
    }

    /**
     * 清空所有远程资源缓存
     */
    public static clearAllCache(): void {
        if (!sys.isNative || !this._cacheDir) return;
        native.fileUtils.removeDirectory(this._cacheDir);
        this._cacheDir = null;
    }
}

globalThis["AssetRemoteMgr"] = AssetRemoteMgr;
