/*******************************************************************************
 * 描述:    音频管理
*******************************************************************************/
export default class AudioMgr {
    private static _mp3 = {};

    /** 停止背景音乐 */
    static stopMusic() {
        cc.audioEngine.stopMusic();
    }
    /** 清理所有播放的音效 */
    static stopEffect() {
        cc.audioEngine.stopAll();
    }

    static preload(callback?, onProgress?: (finished: number, total: number, item: any) => void) {
        if (!onProgress) {
            onProgress = function () { };
        }
        cc.resources.loadDir("audio", null, (finished, total, item) => {
        }, (err, mp3List) => {
            if (err) {
                console.error('Error loading audio resources:', err);
                return;
            }
            mp3List.forEach((mp3) => {
                if (mp3 instanceof cc.AudioClip) {
                    this._mp3[mp3.name] = mp3;
                    this._mp3[mp3.name].playMusic = function (loop: boolean = true) {
                        if (C.musicSwitch) {
                            cc.audioEngine.playMusic(mp3, loop);
                        }
                    };
                    this._mp3[mp3.name].playEffect = function (loop: boolean = false) {
                        if (C.soundSwitch) {
                            cc.audioEngine.playEffect(mp3, loop);
                        }
                    };
                }
            });
            callback && callback();
        });
    }

    // 对外初始化接口，在合适的时机调用
    static init(callback?: (...args: any[]) => void, onProgress?: (finished: number, total: number, item: any) => void) {
        this.preload(() => {
            G.mp3 = new Proxy(this._mp3, mp3ProxyHandler);
            if (typeof callback === 'function') {
                callback();
            }
        }, onProgress);
    }

    static getMp3(name: string) {
        return this._mp3[name] || null;
    }
}
// 创建以 G.mp3 作为数据源的 Proxy
const mp3ProxyHandler = {
    get: function (target, name) {
        return AudioMgr.getMp3(name);
    }
};
globalThis["AudioMgr"] = AudioMgr;