const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const floderName = "视频首帧图";
const outputPath = path.dirname(Editor.Project.path);
const outputDir = path.join(outputPath, floderName); // 输出文件夹路径

// 支持的视频格式
const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'];

export function videoToFrame(pathStr: string) {
    if (!(0, fs.existsSync)((0, path.join)(outputPath, floderName))) {
        (0, fs.mkdirSync)((0, path.join)(outputPath, floderName));
    }
    console.log(`开始处理目录: ${pathStr}`);

    // 检查ffmpeg是否可用
    checkFFmpegAvailability().then((available) => {
        if (!available) {
            console.error('FFmpeg 不可用，请确保已安装 FFmpeg 并添加到系统 PATH 中');
            return;
        }
        // 递归处理目录
        processDirectory(pathStr);
        console.log('提取完成，输出路径为: ' + outputDir);
    }).catch((error) => {
        console.error('检查 FFmpeg 可用性时出错: ' + error.message);
    });
};

// 检查 FFmpeg 是否可用
function checkFFmpegAvailability() {
    return new Promise((resolve) => {
        ffmpeg.getAvailableCodecs((err: any, codecs: any) => {
            if (err) {
                console.warn('FFmpeg 检查失败: ' + err.message);
                resolve(false);
            } else {
                console.log('FFmpeg 可用，开始处理视频文件');
                resolve(true);
            }
        });
    });
}

// 递归处理目录的函数
function processDirectory(dirPath: string) {
    try {
        // 读取目录中的所有文件和子目录
        const items = fs.readdirSync(dirPath);

        let processedCount = 0;
        const promises: any[] = [];

        items.forEach((item: string) => {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // 如果是目录，递归处理
                processDirectory(fullPath);
            } else if (stat.isFile()) {
                // 如果是文件，检查是否为支持的视频文件
                const ext = path.extname(item).toLowerCase();
                if (SUPPORTED_VIDEO_FORMATS.includes(ext)) {
                    const promise = processImageFile(fullPath, dirPath, item);
                    promises.push(promise);
                    processedCount++;
                }
            }
        });

        // 等待所有处理完成
        Promise.all(promises).then(() => {
            if (processedCount > 0) {
                console.log(`目录 ${dirPath} 处理完成，共处理 ${processedCount} 个视频文件`);
            }
        }).catch((error) => {
            console.error(`处理目录 ${dirPath} 时出错: ${error.message}`);
        });

    } catch (error: any) {
        console.error(`读取目录 ${dirPath} 时出错: ${error.message}`);
    }
}

// 提取单个视频文件的首帧图
function processImageFile(filePath: string, dirPath: string, fileName: string) {
    return new Promise((resolve, reject) => {
        try {
            const videoName = path.basename(fileName, path.extname(fileName));

            // 创建相对路径的目录结构
            const outputImagePath = path.join(outputDir, `${videoName}_0.jpg`);

            // 如果图片已存在，跳过处理
            if (fs.existsSync(outputImagePath)) {
                console.log(`首帧图已存在，跳过: ${outputImagePath}`);
                resolve(fileName);
                return;
            }

            console.log(`正在提取首帧: ${fileName}`);

            // 使用 ffmpeg 提取视频第一帧
            ffmpeg(filePath)
                .screenshots({
                    timestamps: ['0%'], // 提取第0秒的帧（第一帧）
                    filename: `${videoName}_0.jpg`,
                    folder: outputDir,
                    size: '1024x1536' // 保持宽高比，最大尺寸 1920x1080
                })
                .on('end', () => {
                    console.log(`成功提取首帧: ${outputImagePath}`);
                    resolve(fileName);
                })
                .on('error', (err: any) => {
                    console.error(`提取首帧失败 ${fileName}: ${err.message}`);
                    reject(err);
                });

        } catch (error: any) {
            console.error(`处理视频文件 ${fileName} 时出错: ${error.message}`);
            reject(error);
        }
    });
}
