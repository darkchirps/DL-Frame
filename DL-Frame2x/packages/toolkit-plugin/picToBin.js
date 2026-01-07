"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imagesToBinarySimple = imagesToBinarySimple;

const fs = require("fs");
const path = require("path");
const picBinPath = require("./config.json").picBinPath;

// 支持的图片格式
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff'];

/**
 * 主入口函数：图片转二进制文件
 * @param inputDir 输入目录
 * @returns 生成的二进制文件路径列表
 */
function imagesToBinarySimple(inputDir) {
    // 确保输出目录存在
    if (!fs.existsSync(picBinPath)) {
        fs.mkdirSync(picBinPath, { recursive: true });
    }
    // 调用递归目录处理函数
    processDirectoryRecursive(inputDir);
    Editor.log('转换完成，输出路径为:' + picBinPath);
}

/**
 * 递归处理目录（核心拆分逻辑1：处理目录遍历）
 * @param dirPath 要处理的目录路径
 */
function processDirectoryRecursive(dirPath) {
    // 检查目录是否存在
    if (!fs.existsSync(dirPath)) {
        Editor.warn(`目录不存在: ${dirPath}`);
        return;
    }
    // 获取目录下所有文件/子目录
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // 如果是子目录，递归处理
            processDirectoryRecursive(fullPath);
        } else if (stat.isFile()) {
            // 如果是文件，调用单个文件处理函数
            processSingleImageFile(fullPath, file);
        }
    });
}

/**
 * 处理单个图片文件（核心拆分逻辑2：处理文件转换）
 * @param filePath 文件完整路径
 * @param fileName 文件名（含扩展名）
 * @returns 生成的二进制文件路径（失败返回null）
 */
function processSingleImageFile(filePath, fileName) {
    const ext = path.extname(fileName).toLowerCase();
    // 检查是否为支持的图片格式
    if (!SUPPORTED_FORMATS.includes(ext)) {
        Editor.warn(`跳过非图片文件: ${fileName}`);
    }
    // 检查文件是否存在（双重校验，避免文件被删除的情况）
    if (!fs.existsSync(filePath)) {
        Editor.warn(`文件不存在: ${fileName}`);
    }
    try {
        // 读取图片二进制数据
        const imageData = fs.readFileSync(filePath);
        // 生成输出文件名和路径
        const fileNameWithoutExt = path.basename(fileName, ext);
        const binaryFileName = `${fileNameWithoutExt}.bin`;
        const binaryOutputFile = path.join(picBinPath, binaryFileName);
        // 写入二进制文件
        fs.writeFileSync(binaryOutputFile, imageData);
        Editor.log(`转换bin成功: ${fileName} -> ${binaryFileName}`);
    } catch (error) {
        Editor.error(`处理图片 ${fileName} 时出错:`, error);
    }
}