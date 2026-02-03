/*******************************************************************************
 * 描述:    远程资源管理 (优化版)
*******************************************************************************/

export default class AssetRemoteMgr {

    // 定义缓存文件夹名称，避免依赖外部 myG 变量
    private static readonly CACHE_DIR_NAME = "video_cache"; 

    /**
     * 加载/获取远程资源路径
     * @param assetUrl 资源url
     * @param assetType 资源后缀 (如 "mp4", "png")
      */
    public async loadAssetRemote(assetUrl: string, assetType: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // ================== 1. Web 平台优化 ==================
            // 视频在 Web 端通常不需要下载 Buffer，直接返回 URL 给 VideoPlayer 播放即可
            // 浏览器自身有完善的缓存策略，手动下载 Buffer 反而浪费内存且不能流式播放
            if (!cc.sys.isNative) {
                resolve(assetUrl); 
                return;
            }

            // ================== 2. Native 平台逻辑 ==================
            
            // 获取本地存储路径
            const pathNative = AssetRemoteMgr.getLocalPath(assetUrl, assetType);
            
            // 检查本地是否已存在
            if (jsb.fileUtils.isFileExist(pathNative)) {
                console.log(`[AssetRemoteMgr] 命中本地缓存: ${pathNative}`);
                resolve(pathNative);
                return;
            }

            console.log(`[AssetRemoteMgr] 开始下载: ${assetUrl}`);

            // 关键：必须指定 responseType: 'arraybuffer'，否则下载视频可能数据不完整或被解析成其他格式
            cc.assetManager.loadRemote(assetUrl, { responseType: 'arraybuffer' }, (err, asset) => {
                if (err) {
                    console.error(`[AssetRemoteMgr] 下载失败: ${assetUrl}`, err);
                    reject(err); // 失败时拒绝 Promise
                    return;
                }

                // 获取原始二进制数据
                const buffer = (asset as any)._nativeAsset || (asset as any).data || asset;
                
                if (buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer)) {
                     // 写入文件
                     // @ts-ignore
                    const success = jsb.fileUtils.writeDataToFile(new Uint8Array(buffer), pathNative);
                    
                    // 释放内存中的资源（非常重要，视频文件很大，存完如果不释放会爆内存）
                    cc.assetManager.releaseAsset(asset);

                    if (success) {
                        console.log(`[AssetRemoteMgr] 缓存成功: ${pathNative}`);
                        resolve(pathNative);
                    } else {
                        console.error('[AssetRemoteMgr] 写入磁盘失败');
                        // 写入失败，退而求其次返回在线 URL，保证能看，只是没缓存
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
        if (!cc.sys.isNative || typeof jsb === 'undefined') return null;

        // 1. 确保缓存目录存在
        // 使用 getWritablePath 保证读写权限
        const cacheDir = jsb.fileUtils.getWritablePath() + AssetRemoteMgr.CACHE_DIR_NAME + "/";
        if (!jsb.fileUtils.isDirectoryExist(cacheDir)) {
            jsb.fileUtils.createDirectory(cacheDir);
        }

        // 2. 优化文件名生成逻辑
        // 原逻辑直接替换 URL 特殊字符会导致文件名过长 (OS限制通常255字符)，导致写入失败
        // 使用简单的 Hash 算法生成短文件名
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            hash = ((hash << 5) - hash) + url.charCodeAt(i);
            hash |= 0;
        }
        const fileName = Math.abs(hash).toString(36); // 转为短字符串

        return cacheDir + fileName + "." + type;
    }
}

// 全局实例
globalThis["AssetRemoteMgr"] = AssetRemoteMgr;
