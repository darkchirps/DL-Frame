/*******************************************************************************
 * 描述:    音频管理
*******************************************************************************/
import { resources, AudioClip, _decorator, AudioSource, director, Node } from "cc";

class _AudioMgr {
    private static _musicNode: Node | null = null;
    private static _musicAudioSource: AudioSource | null = null;
    private static _effectNode: Node | null = null;
    private static _effectAudioSource: AudioSource | null = null;
    private static _mp3 = {}; // 存储所有音频资源

    // 播放背景音乐
    static playAudio(clip: AudioClip, loop: boolean = true) {
        if (!this._musicNode) {
            this._musicNode = new Node();
            this._musicNode.name = "MusicNode";
            director.getScene().addChild(this._musicNode);
            this._musicAudioSource = this._musicNode.addComponent(AudioSource);
        }
        this._musicAudioSource.stop();
        this._musicAudioSource.clip = clip;
        this._musicAudioSource.play();
        this._musicAudioSource.loop = loop;
        this._musicAudioSource.volume = 1;
    }

    // 停止背景音乐
    static stopMusic() {
        this._musicAudioSource?.stop();
    }

    // 播放音效
    static playEffect(clip: AudioClip, loop: boolean = false) {
        if (!this._effectNode) {
            this._effectNode = new Node();
            this._effectNode.name = "EffectNode";
            director.getScene().addChild(this._effectNode);
            this._effectAudioSource = this._effectNode.addComponent(AudioSource);
        }
        this._effectAudioSource.playOneShot(clip, 1);
    }

    // 停止所有音效
    static stopAllEffects() {
        this._effectAudioSource?.stop();
    }
    // 预加载指定bundle的音频资源
    static async preload(bundleName: string, dir: string = "audio"): Promise<boolean> {
        try {
            const audioList = await G.asset.loadDirRes(bundleName, dir) as AudioClip[];
            audioList.forEach((audio) => {
                if (audio instanceof AudioClip) {
                    // 添加到音频库，如果同名则覆盖
                    this._mp3[audio.name] = audio;
                    // 添加便捷方法
                    this._mp3[audio.name].playMusic = (loop: boolean = true) => {
                        if (C.musicSwitch) {
                            AudioMgr.playAudio(audio, loop);
                        }
                    };
                    this._mp3[audio.name].playEffect = (loop: boolean = false) => {
                        if (C.soundSwitch) {
                            AudioMgr.playEffect(audio);
                        }
                    };
                }
            });

            return true;
        } catch (error) {
            console.log(`加载 ${bundleName}/${dir} 音频失败:`, error);
            return false;
        }
    }

    // 初始化方法，支持多次调用加载不同bundle
    static async init(bName: string, dir: string = "audio") {
        try {
            await AudioMgr.preload(bName, dir);
            // 仅在首次初始化时设置代理
            if (!G.mp3) {
                G.mp3 = new Proxy(this._mp3, mp3ProxyHandler);
            }
        } catch (error) {
            console.log(`初始化 ${bName} 音频失败:`, error);
        }
    }

    // 获取音频资源
    static getMp3(name: string): AudioClip | null {
        return this._mp3[name] || null;
    }
}

// 创建代理处理程序
const mp3ProxyHandler = {
    get: function (target, name) {
        return AudioMgr.getMp3(name);
    }
};

/** 音频管理器 */
export default class AudioMgr extends _AudioMgr { }
declare global { var AudioMgr: typeof _AudioMgr }
globalThis["AudioMgr"] = AudioMgr;