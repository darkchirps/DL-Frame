const fs = require("fs");
const path = require("path");

const videoConfig = require("./config.json").videoPath || [];
const outputFolder = "video_binary";

function processVideosFunc(pathStr) {
    // 创建输出目录
    videoConfig.forEach((p) => {
        const outputDir = path.join(p, outputFolder);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    });
    
    Editor.log(`开始处理视频目录: ${pathStr}`);
    
    // 递归处理目录
    processVideoDirectory(pathStr);
    
    videoConfig.forEach((p) => {
        Editor.log(`视频转换完成，输出路径为: ${path.join(p, outputFolder)}`);
    });
}

// 递归处理目录的函数
function processVideoDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // 如果是目录，递归处理
            processVideoDirectory(fullPath);
        } else if (stat.isFile()) {
            // 如果是文件，检查是否为视频文件
            const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.3gp'];
            const ext = path.extname(item).toLowerCase();
            
            if (videoExtensions.includes(ext)) {
                processVideoFile(fullPath, item);
            }
        }
    });
}

// 处理单个视频文件的函数（直接二进制转换）
function processVideoFile(filePath, fileName) {
    const name = path.parse(fileName).name;
    const ext = path.extname(fileName);
    
    try {
        // 直接读取视频文件的二进制数据
        const videoBuffer = fs.readFileSync(filePath);
        
        // 生成输出文件名（保持原扩展名或自定义）
        const outputExtension = require("./config.json").outputExtension || ext + ".bin";
        const finalOutputFileName = `${name}${outputExtension}`;
        
        videoConfig.forEach((p) => {
            const outputPath = path.join(p, outputFolder, finalOutputFileName);
            
            // 直接写入二进制数据
            fs.writeFileSync(outputPath, videoBuffer);
        });
        
        Editor.log(`已转换视频: ${fileName} -> ${finalOutputFileName} (${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
    } catch (error) {
        Editor.error(`处理视频文件失败: ${fileName}`, error);
    }
}

exports.processVideosFunc = processVideosFunc;