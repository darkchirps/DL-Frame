/*******************************************************************************
 * 描述:    将视频mp4转换成spriteFrame图 帧切换
*******************************************************************************/
import { _decorator, Component, Texture2D, ImageAsset, SpriteFrame } from 'cc';
const { ccclass, property, menu } = _decorator;

@ccclass('videoToFrame')
@menu('常用组件/视频转图片播放')
export class videoToFrame extends Component {
    @property({ tooltip: "视频资源路径" })
    videoUrl: string = "";

    @property({ tooltip: "提取帧率" })
    frameRate: number = 30;

    @property({ tooltip: "预览模式：只提取少量帧用于预览" })
    previewMode: boolean = true;

    @property({ tooltip: "预览帧数", visible: function (this: videoToFrame) { return this.previewMode; } })
    previewFrameCount: number = 60;

    @property({ tooltip: "是否自动播放" })
    autoPlay: boolean = true;

    @property({ tooltip: "是否循环播放" })
    loopPlayback: boolean = true;

    @property({ tooltip: "播放速度", min: 0.1, max: 5 })
    playbackSpeed: number = 1.0;

    // 私有变量
    private video: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private isExtracting: boolean = false;
    private frames: Texture2D[] = [];
    private currentFrameIndex: number = 0;

    // 重用的SpriteFrame，避免频繁创建
    private reusableSpriteFrame: SpriteFrame | null = null;

    // 播放控制变量
    private isPlaying: boolean = false;
    private playStartTime: number = 0;
    private lastFrameTime: number = 0;
    private animationFrameId: number = 0;
    private frameInterval: number = 1000 / 30; // 默认30fps

    // 回调函数
    private onFrameCallback: ((frame: Texture2D, index: number) => void) | null = null;
    private onCompleteCallback: ((totalFrames: number, frames: Texture2D[]) => void) | null = null;
    private onPlaybackCompleteCallback: (() => void) | null = null;

    start() {
        this.initializeCanvas();
        // 预创建可重用的SpriteFrame
        this.reusableSpriteFrame = new SpriteFrame();

        // 计算帧间隔
        this.frameInterval = 1000 / this.frameRate;

        if (this.videoUrl) {
            this.setVideoAndExtractFrames(this.videoUrl, (frame, index) => {
                if (this.node.sprite && this.reusableSpriteFrame) {
                    this.reusableSpriteFrame.texture = frame;
                    this.node.sprite.spriteFrame = this.reusableSpriteFrame;
                }
                console.log(`解析第${index} 帧`, new Date().getMilliseconds());
            }, (totalFrames, frames) => {
                console.log(`解析完成，共${totalFrames} 帧`);
                // 解析完成后自动开始播放
                if (this.autoPlay) {
                    this.startPlayback();
                }
            });
        }
    }

    update(deltaTime: number) {
        // 使用update循环来确保播放稳定性
        if (this.isPlaying && this.frames.length > 0) {
            this.updatePlayback();
        }
    }

    /**
     * 初始化Canvas
     */
    private initializeCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: false
        });
    }

    /**
     * 设置视频源并开始解析
     */
    setVideoAndExtractFrames(
        videoSource: string | File | Blob | HTMLVideoElement,
        onFrame: (frame: Texture2D, index: number) => void,
        onComplete: (totalFrames: number, frames: Texture2D[]) => void
    ) {
        if (this.isExtracting) {
            console.warn('正在解析中，请先停止当前解析');
            return;
        }

        this.onFrameCallback = onFrame;
        this.onCompleteCallback = onComplete;
        this.isExtracting = true;
        this.frames = [];
        this.currentFrameIndex = 0;

        this.initializeVideoElement(videoSource);
    }

    /**
     * 初始化视频元素
     */
    private initializeVideoElement(videoSource: string | File | Blob | HTMLVideoElement) {
        this.video = document.createElement('video');
        this.video.crossOrigin = 'anonymous';
        this.video.preload = 'auto';
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.autoplay = false;

        // 视频加载完成后开始提取帧
        const startExtraction = () => {
            if (this.video) {
                console.log(`视频信息: ${this.video.videoWidth}x${this.video.videoHeight}, 时长: ${this.video.duration}s`);
                this.startFrameExtraction();
            }
        };

        this.video.onloadeddata = startExtraction;
        this.video.ondurationchange = startExtraction;

        this.video.onerror = (err) => {
            console.error('视频加载错误:', err);
            this.cleanup();
            this.onCompleteCallback?.(0, []);
        };

        // 设置视频源
        if (typeof videoSource === 'string') {
            this.video.src = videoSource;
        } else if (videoSource instanceof File || videoSource instanceof Blob) {
            this.video.src = URL.createObjectURL(videoSource);
        } else if (videoSource instanceof HTMLVideoElement) {
            this.video = videoSource;
            if (this.video.readyState >= 2) {
                startExtraction();
            }
        }

        // 触发加载
        this.video.load();
    }

    /**
     * 开始帧提取过程
     */
    private startFrameExtraction() {
        if (!this.video || !this.canvas || !this.ctx) {
            this.cleanup();
            return;
        }

        // 设置Canvas尺寸与视频一致
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        const duration = this.video.duration;

        // 计算要提取的帧
        let frameTimes: number[];
        if (this.previewMode) {
            // 预览模式：均匀提取少量帧
            frameTimes = this.generatePreviewFrameTimes(duration);
        } else {
            // 完整模式：按帧率提取
            const totalFrames = Math.floor(duration * this.frameRate);
            frameTimes = Array.from({ length: totalFrames }, (_, i) => i / this.frameRate);
        }

        console.log(`开始提取 ${frameTimes.length} 帧`);

        // 使用requestIdleCallback分批处理，避免阻塞主线程
        this.processFramesInBatches(frameTimes, 0, 5);
    }

    /**
     * 分批处理帧提取，避免阻塞主线程
     */
    private processFramesInBatches(frameTimes: number[], startIndex: number, batchSize: number) {
        if (!this.isExtracting || startIndex >= frameTimes.length) {
            // 所有帧处理完成
            if (this.onCompleteCallback) {
                this.onCompleteCallback(frameTimes.length, this.frames);
            }
            this.cleanup();
            return;
        }

        // 计算当前批次的结束索引
        const endIndex = Math.min(startIndex + batchSize, frameTimes.length);

        // 处理当前批次
        const processBatch = async () => {
            for (let i = startIndex; i < endIndex; i++) {
                if (!this.isExtracting) break;
                await this.extractSingleFrame(frameTimes[i], i);
            }

            // 安排下一批处理
            requestIdleCallback(() => {
                this.processFramesInBatches(frameTimes, endIndex, batchSize);
            }, { timeout: 100 });
        };

        processBatch();
    }

    /**
     * 生成预览帧时间点
     */
    private generatePreviewFrameTimes(duration: number): number[] {
        const frameCount = Math.min(this.previewFrameCount, Math.floor(duration * this.frameRate));
        return Array.from({ length: frameCount }, (_, i) =>
            (i / (frameCount - 1 || 1)) * duration
        );
    }

    /**
     * 提取单帧
     */
    private async extractSingleFrame(time: number, index: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.video || !this.ctx || !this.canvas) {
                return;
            }
            // 检查视频是否已经可以播放
            if (this.video.readyState < 2) {
                return;
            }

            const onSeeked = () => {
                this.video!.removeEventListener('seeked', onSeeked);
                this.video!.removeEventListener('error', onError);

                try {
                    // 绘制当前帧到Canvas
                    this.ctx!.drawImage(this.video!, 0, 0, this.canvas!.width, this.canvas!.height);

                    // 直接从Canvas获取图像数据并创建纹理
                    this.createTextureFromCanvas(index);

                    resolve();
                } catch (error) {
                    console.error('绘制帧失败:', error);
                    resolve();
                }
            };

            const onError = () => {
                this.video!.removeEventListener('seeked', onSeeked);
                this.video!.removeEventListener('error', onError);
                console.error(`跳转到时间点 ${time} 失败`);
                resolve();
            };

            // 如果已经在目标时间附近，直接处理
            if (Math.abs(this.video.currentTime - time) < 0.01) {
                onSeeked();
                return;
            }

            this.video.addEventListener('seeked', onSeeked);
            this.video.addEventListener('error', onError);

            // 设置视频当前时间
            this.video.currentTime = time;
        });
    }

    /**
     * 从Canvas直接创建纹理，优化性能
     */
    private createTextureFromCanvas(index: number) {
        if (!this.canvas) return;

        createImageBitmap(this.canvas).then(bitmap => {
            if (!this.isExtracting) {
                bitmap.close();
                return;
            }

            // 创建ImageAsset和Texture2D
            const imageAsset = new ImageAsset(bitmap);
            const texture = new Texture2D();
            texture.image = imageAsset;

            this.frames.push(texture);
            if (this.onFrameCallback) {
                this.onFrameCallback(texture, index);
            }

            // 释放bitmap资源
            bitmap.close();
        }).catch(error => {
            console.error('创建ImageBitmap失败:', error);
        });
    }

    /**
     * 开始播放帧动画
     */
    startPlayback() {
        if (this.frames.length === 0) {
            console.warn('没有可播放的帧');
            return;
        }

        if (this.isPlaying) {
            console.warn('已经在播放中');
            return;
        }

        console.log('开始播放，总帧数:', this.frames.length, '循环播放:', this.loopPlayback);
        this.isPlaying = true;
        this.playStartTime = Date.now();
        this.lastFrameTime = 0;
        this.currentFrameIndex = 0;

        // 立即显示第一帧
        this.seekToFrame(0);
    }

    /**
     * 停止播放
     */
    stopPlayback() {
        if (this.loopPlayback) return;
        console.log('停止播放');
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = 0;
        }
    }

    /**
     * 暂停播放
     */
    pausePlayback() {
        console.log('暂停播放');
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = 0;
        }
    }

    /**
     * 恢复播放
     */
    resumePlayback() {
        if (!this.isPlaying && this.frames.length > 0) {
            console.log('恢复播放');
            this.isPlaying = true;
            this.playStartTime = Date.now() - this.lastFrameTime;
        }
    }

    /**
     * 更新播放逻辑
     */
    private updatePlayback() {
        if (!this.isPlaying) return;

        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.playStartTime) * this.playbackSpeed;
        this.lastFrameTime = elapsedTime;

        const totalFrames = this.frames.length;
        let targetFrameIndex = Math.floor(elapsedTime / this.frameInterval);

        // 处理循环播放
        if (this.loopPlayback) {
            targetFrameIndex = targetFrameIndex % totalFrames;
        } else {
            // 非循环模式，播放到最后一帧停止
            if (targetFrameIndex >= totalFrames) {
                targetFrameIndex = totalFrames - 1;
                this.isPlaying = false;
                console.log('播放完成');
                if (this.onPlaybackCompleteCallback) {
                    this.onPlaybackCompleteCallback();
                }
                return;
            }
        }

        // 确保帧索引在有效范围内
        if (targetFrameIndex < 0) targetFrameIndex = 0;
        if (targetFrameIndex >= totalFrames) targetFrameIndex = totalFrames - 1;

        // 更新帧显示
        if (targetFrameIndex !== this.currentFrameIndex) {
            this.seekToFrame(targetFrameIndex);
        }
    }

    /**
     * 设置播放完成回调
     */
    setOnPlaybackComplete(callback: () => void) {
        this.onPlaybackCompleteCallback = callback;
    }

    /**
     * 停止解析
     */
    stopExtractFrames() {
        this.stopPlayback();
        this.cleanup();
    }

    /**
     * 清理资源
     */
    private cleanup() {
        this.isExtracting = false;
        this.stopPlayback();

        if (this.video) {
            this.video.pause();
            this.video.removeEventListener('seeked', () => { });
            this.video.removeEventListener('error', () => { });
            if (this.video.src.startsWith('blob:')) {
                URL.revokeObjectURL(this.video.src);
            }
            this.video = null;
        }
        this.onFrameCallback = null;
        this.onCompleteCallback = null;
    }

    /**
     * 跳转到指定帧
     */
    seekToFrame(frameIndex: number) {
        if (frameIndex >= 0 && frameIndex < this.frames.length && this.node.sprite) {
            // 确保有可重用的SpriteFrame
            if (!this.reusableSpriteFrame) {
                this.reusableSpriteFrame = new SpriteFrame();
            }

            this.reusableSpriteFrame.texture = this.frames[frameIndex];
            this.node.sprite.spriteFrame = this.reusableSpriteFrame;
            this.currentFrameIndex = frameIndex;

            console.log(`跳转到帧: ${frameIndex + 1}/${this.frames.length}`);
        }
    }

    /**
     * 获取解析后的所有帧
     */
    getExtractedFrames(): Texture2D[] {
        return [...this.frames];
    }

    /**
     * 获取当前解析状态
     */
    getIsExtracting(): boolean {
        return this.isExtracting;
    }

    /**
     * 获取当前播放状态
     */
    getIsPlaying(): boolean {
        return this.isPlaying;
    }

    /**
     * 设置播放速度
     */
    setPlaybackSpeed(speed: number) {
        this.playbackSpeed = Math.max(0.1, Math.min(5, speed));
        console.log('设置播放速度:', this.playbackSpeed);
    }

    /**
     * 设置是否循环播放
     */
    setLoopPlayback(loop: boolean) {
        this.loopPlayback = loop;
        console.log('设置循环播放:', this.loopPlayback);
    }

    /**
     * 设置是否自动播放
     */
    setAutoPlay(auto: boolean) {
        this.autoPlay = auto;
        console.log('设置自动播放:', this.autoPlay);
    }

    onDestroy() {
        this.cleanup();
        // 释放纹理资源
        this.frames.forEach(texture => {
            texture.destroy();
        });
        this.frames = [];

        // 释放可重用的SpriteFrame
        if (this.reusableSpriteFrame) {
            this.reusableSpriteFrame.destroy();
            this.reusableSpriteFrame = null;
        }
    }
}