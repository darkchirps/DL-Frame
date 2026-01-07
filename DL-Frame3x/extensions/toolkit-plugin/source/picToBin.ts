// image-to-binary-simple.ts
const fs = require("fs");
const path = require("path");

const picBinPath = require("../config.json").picBinPath;

// 支持的图片格式
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff'];

export function imagesToBinarySimple(inputDir: string): string[] {
    // 确保输出目录存在
    if (!fs.existsSync(picBinPath)) {
        fs.mkdirSync(picBinPath, { recursive: true });
    }

    // 获取所有文件
    const files: string[] = fs.readdirSync(inputDir);
    const generatedFiles: string[] = [];

    // 处理每个文件
    files.forEach(file => {
        const filePath = path.join(inputDir, file);
        const ext = path.extname(file).toLowerCase();

        // 检查是否为图片文件
        if (!SUPPORTED_FORMATS.includes(ext)) {
            console.warn(`跳过非图片文件: ${file}`);
            return;
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            console.warn(`文件不存在: ${file}`);
            return;
        }

        try {
            // 读取图片文件
            const imageData = fs.readFileSync(filePath);

            // 生成输出文件名（保持原名，只改扩展名）
            const fileNameWithoutExt = path.basename(file, ext);
            const binaryFileName = `${fileNameWithoutExt}.bin`;
            const binaryOutputFile = path.join(picBinPath, binaryFileName);

            // 写入二进制文件
            fs.writeFileSync(binaryOutputFile, imageData);

            generatedFiles.push(binaryOutputFile);
            console.log(`转换成功: ${file} -> ${binaryFileName}`);

        } catch (error) {
            console.error(`处理图片 ${file} 时出错:`, error);
        }
    });

    return generatedFiles;
}