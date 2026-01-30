// VideoToFrame.ts
// 适用于 Cocos Creator 2.4.x (修复 cc.url.raw 问题)

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu('常用组件/视频转图片播放')
export default class VideoToFrame extends cc.Component {

    // --- 新增：支持直接拖拽资源 ---
    @property({ type: cc.Asset, tooltip: "优先使用：直接拖拽视频文件到此处" })
    videoClip: cc.Asset = null;

    @property({ tooltip: "备选：视频路径。\n1. 远程URL (http开头)\n2. resources文件夹下的相对路径 (不带扩展名)" })
    videoUrl: string = "";

    @property({ tooltip: "提取帧率 (建议 10-20，过高会导致内存爆炸)" })
    frameRate: number = 15;

    @property({ tooltip: "预览模式：只提取少量帧用于快速查看" })
    previewMode: boolean = true;

    @property({
        tooltip: "预览模式下的提取帧数",
        visible() { return this.previewMode; }
    })
    previewFrameCount: number = 20;

    @property({ tooltip: "解析完成后是否自动播放" })
    autoPlay: boolean = true;

    @property({ tooltip: "是否循环播放" })
    loopPlayback: boolean = true;

    @property({ tooltip: "播放速度", min: 0.1, max: 5 })
    playbackSpeed: number = 1.0;

    // --- 私有变量 ---
    private video: HTMLVideoElement = null;
    private canvas: HTMLCanvasElement = null;
    private ctx: CanvasRenderingContext2D = null;
    
    private isExtracting: boolean = false;
    private isPlaying: boolean = false;

    private frames: cc.SpriteFrame[] = []; 
    private currentFrameIndex: number = 0;
    private spriteComp: cc.Sprite = null;

    private lastFrameTime: number = 0; 
    private frameInterval: number = 1000 / 15;

    // 回调钩子
    public onFrameExtracted: (frame: cc.SpriteFrame, index: number) => void = null;
    public onExtractComplete: (totalFrames: number, frames: cc.SpriteFrame[]) => void = null;
    public onPlaybackComplete: () => void = null;

    onLoad() {
        this.spriteComp = this.getComponent(cc.Sprite);
        if (!this.spriteComp) {
            console.error("VideoToFrame: 节点缺少 cc.Sprite 组件，无法显示画面！");
        }
    }

    start() {
        this.initializeCanvas();
        this.frameInterval = 1000 / this.frameRate;

        // --- 核心修复：资源加载逻辑 ---
        
        // 情况1：直接拖拽了 Asset 资源 (推荐)
        if (this.videoClip) {
            this.handleVideoUrl(this.videoClip.nativeUrl);
            return;
        }

        // 情况2：使用了字符串路径
        if (this.videoUrl) {
            // 2.1 远程 URL (http/https)
            if (this.videoUrl.startsWith("http") || this.videoUrl.startsWith("file")) {
                this.handleVideoUrl(this.videoUrl);
            } 
            // 2.2 本地资源 (默认为 resources 文件夹下)
            else {
                // 使用 2.4.x 标准的加载 API 替代 cc.url.raw
                cc.resources.load(this.videoUrl, cc.Asset, (err, asset) => {
                    if (err) {
                        console.error(`[VideoToFrame] 无法在 resources 中找到视频: ${this.videoUrl}`, err);
                        return;
                    }
                    this.handleVideoUrl(asset.nativeUrl);
                });
            }
        }
    }

    update(dt: number) {
        if (this.isPlaying && this.frames.length > 0) {
            this.updatePlayback(dt);
        }
    }

    // --- 统一处理入口 ---
    private handleVideoUrl(url: string) {
        this.setVideoAndExtractFrames(url, (frame, index) => {
            // 预览：提取时显示当前帧
            if (this.spriteComp) this.spriteComp.spriteFrame = frame;
        }, (totalFrames) => {
            console.log(`[VideoToFrame] 解析完成，共 ${totalFrames} 帧`);
            if (this.autoPlay) this.startPlayback();
        });
    }

    // =================================================================
    // 核心逻辑：初始化与解析
    // =================================================================

    private initializeCanvas() {
        if (cc.sys.isBrowser) {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d', { alpha: false });
        } else {
            console.warn("[VideoToFrame] 仅支持 Web 平台 (浏览器/WebView)");
        }
    }

    public setVideoAndExtractFrames(
        videoSource: string | HTMLVideoElement,
        onFrame: (frame: cc.SpriteFrame, index: number) => void = null,
        onComplete: (totalFrames: number, frames: cc.SpriteFrame[]) => void = null
    ) {
        if (this.isExtracting) {
            console.warn('[VideoToFrame] 正在解析中，请稍后...');
            return;
        }
        if (!cc.sys.isBrowser) return;

        this.onFrameExtracted = onFrame;
        this.onExtractComplete = onComplete;
        
        this.cleanupFrames();
        this.isExtracting = true;
        
        this.initializeVideoElement(videoSource);
    }

    private initializeVideoElement(videoSource: string | HTMLVideoElement) {
        this.video = document.createElement('video');
        this.video.crossOrigin = 'anonymous';
        this.video.preload = 'auto';
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.autoplay = false;

        const onVideoLoaded = () => {
            if (this.video && this.video.videoWidth > 0) {
                this.video.onloadeddata = null;
                this.video.ondurationchange = null;
                console.log(`[VideoToFrame] 视频加载成功: ${this.video.videoWidth}x${this.video.videoHeight}`);
                this.startFrameExtraction();
            }
        };

        this.video.onloadeddata = onVideoLoaded;
        
        if (typeof videoSource === 'string') {
            this.video.src = videoSource;
        } else {
            this.video = videoSource;
        }

        this.video.load();
    }

    private startFrameExtraction() {
        if (!this.video || !this.canvas) return;

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        const duration = this.video.duration;
        let frameTimes: number[] = [];

        if (this.previewMode) {
            const count = Math.min(this.previewFrameCount, Math.floor(duration * this.frameRate));
            frameTimes = Array.from({ length: count }, (_, i) => (i / (count - 1 || 1)) * duration);
        } else {
            const totalFrames = Math.floor(duration * this.frameRate);
            frameTimes = Array.from({ length: totalFrames }, (_, i) => i / this.frameRate);
        }

        console.log(`[VideoToFrame] 开始提取 ${frameTimes.length} 帧...`);
        this.processFramesRecursive(frameTimes, 0);
    }

    private processFramesRecursive(frameTimes: number[], index: number) {
        if (!this.isExtracting) return;

        if (index >= frameTimes.length) {
            this.isExtracting = false;
            if (this.onExtractComplete) {
                this.onExtractComplete(frameTimes.length, this.frames);
            }
            this.cleanupVideoElement();
            return;
        }

        this.extractSingleFrame(frameTimes[index], index).then(() => {
            // 使用 setTimeout(0) 释放主线程，防止 UI 卡死
            setTimeout(() => {
                this.processFramesRecursive(frameTimes, index + 1);
            }, 0);
        });
    }

    private extractSingleFrame(time: number, index: number): Promise<void> {
        return new Promise((resolve) => {
            if (!this.video) { resolve(); return; }

            const seekTimeout = setTimeout(() => {
                console.warn(`[VideoToFrame] Seek timeout at ${time}s`);
                cleanupListeners();
                resolve();
            }, 2000);

            const onSeeked = () => {
                cleanupListeners();
                this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                this.createFrameFromCanvas(index);
                resolve();
            };

            const onError = (e) => {
                cleanupListeners();
                console.error(`[VideoToFrame] Seek error at ${time}s`, e);
                resolve();
            };

            const cleanupListeners = () => {
                clearTimeout(seekTimeout);
                this.video.removeEventListener('seeked', onSeeked);
                this.video.removeEventListener('error', onError);
            };

            this.video.addEventListener('seeked', onSeeked);
            this.video.addEventListener('error', onError);
            this.video.currentTime = time;
        });
    }

    private createFrameFromCanvas(index: number) {
        const texture = new cc.Texture2D();
        texture.initWithElement(this.canvas);
        texture.handleLoadedTexture();

        const spriteFrame = new cc.SpriteFrame(texture);
        this.frames.push(spriteFrame);

        if (this.onFrameExtracted) {
            this.onFrameExtracted(spriteFrame, index);
        }
    }

    // =================================================================
    // 播放控制
    // =================================================================

    public startPlayback() {
        if (this.frames.length === 0) return;
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.currentFrameIndex = -1;
        this.lastFrameTime = 0;
        this.showFrame(0);
    }

    public stopPlayback() {
        this.isPlaying = false;
    }

    private updatePlayback(dt: number) {
        this.lastFrameTime += (dt * 1000 * this.playbackSpeed);
        const totalFrames = this.frames.length;
        let targetIndex = Math.floor(this.lastFrameTime / this.frameInterval);

        if (this.loopPlayback) {
            targetIndex = targetIndex % totalFrames;
        } else {
            if (targetIndex >= totalFrames) {
                targetIndex = totalFrames - 1;
                this.isPlaying = false;
                if (this.onPlaybackComplete) this.onPlaybackComplete();
            }
        }

        if (targetIndex !== this.currentFrameIndex) {
            this.showFrame(targetIndex);
        }
    }

    private showFrame(index: number) {
        if (index >= 0 && index < this.frames.length) {
            this.currentFrameIndex = index;
            if (this.spriteComp) {
                this.spriteComp.spriteFrame = this.frames[index];
            }
        }
    }

    // =================================================================
    // 清理逻辑
    // =================================================================

    private cleanupVideoElement() {
        if (this.video) {
            this.video.pause();
            this.video.src = "";
            this.video.load();
            this.video = null;
        }
    }

    private cleanupFrames() {
        this.stopPlayback();
        this.frames.forEach(sf => {
            if (sf && sf.getTexture()) {
                sf.getTexture().destroy();
            }
        });
        this.frames = [];
        this.currentFrameIndex = 0;
    }

    onDestroy() {
        this.isExtracting = false;
        this.cleanupVideoElement();
        this.cleanupFrames();
    }
}
