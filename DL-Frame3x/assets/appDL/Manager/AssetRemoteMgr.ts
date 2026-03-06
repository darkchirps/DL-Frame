/*******************************************************************************
 * 描述:    远程资源管理 (适配 Cocos Creator 3.x)
*******************************************************************************/

import { sys, assetManager, native, utils } from 'cc';

export default class AssetRemoteMgr {

    // 定义缓存文件夹名称
    private static readonly CACHE_DIR_NAME = "video_cache";

    /**
     * 加载/获取远程资源路径
     * @param assetUrl 资源url
     * @param assetType 资源后缀 (如 "mp4", "png")
      */
    public async loadAssetRemote(assetUrl: string, assetType: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // Web 平台直接返回 URL
            if (!sys.isNative) {
                resolve(assetUrl);
                return;
            }

            // Native 平台逻辑
            const pathNative = AssetRemoteMgr.getLocalPath(assetUrl, assetType);

            // 检查本地缓存
            if (native.fileUtils.isFileExist(pathNative)) {
                console.log(`[AssetRemoteMgr] 命中本地缓存: ${pathNative}`);
                resolve(pathNative);
                return;
            }

            console.log(`[AssetRemoteMgr] 开始下载: ${assetUrl}`);

            // 加载远程资源
            assetManager.loadRemote(assetUrl, { responseType: 'arraybuffer' }, (err, asset) => {
                if (err) {
                    console.error(`[AssetRemoteMgr] 下载失败: ${assetUrl}`, err);
                    reject(err);
                    return;
                }

                // 获取原始二进制数据
                const buffer = (asset as any)._nativeAsset || (asset as any).data || asset;

                if (buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer)) {
                    // 核心修复：严格类型转换，解决 ArrayBufferLike -> ArrayBuffer 类型不匹配
                    let data: ArrayBuffer;
                    if (buffer instanceof ArrayBuffer) {
                        data = buffer; // 本身就是 ArrayBuffer，直接使用
                    } else {
                        // 是 ArrayBufferView (如 Uint8Array)，提取其 buffer 并强制转换为 ArrayBuffer
                        data = buffer.buffer as ArrayBuffer;
                    }

                    // 写入文件（类型完全匹配）
                    const success = native.fileUtils.writeDataToFile(data, pathNative);

                    // 释放资源
                    assetManager.releaseAsset(asset);

                    if (success) {
                        console.log(`[AssetRemoteMgr] 缓存成功: ${pathNative}`);
                        resolve(pathNative);
                    } else {
                        console.error('[AssetRemoteMgr] 写入磁盘失败');
                        resolve(assetUrl);
                    }
                } else {
                    console.error('[AssetRemoteMgr] 下载的数据格式不正确');
                    resolve(assetUrl);
                }
            });
        });
    }

    /**
     * 获取缓存文件完整路径 (仅 Native 有效)
     */
    private static getLocalPath(url: string, type: string): string {
        if (!sys.isNative || typeof native === 'undefined') return null;

        // 确保缓存目录存在
        const cacheDir = native.fileUtils.getWritablePath() + AssetRemoteMgr.CACHE_DIR_NAME + "/";
        if (!native.fileUtils.isDirectoryExist(cacheDir)) {
            native.fileUtils.createDirectory(cacheDir);
        }

        // 生成短哈希文件名，避免长度超限
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            hash = ((hash << 5) - hash) + url.charCodeAt(i);
            hash |= 0;
        }
        const fileName = Math.abs(hash).toString(36);

        return cacheDir + fileName + "." + type;
    }
}
globalThis["AssetRemoteMgr"] = AssetRemoteMgr;