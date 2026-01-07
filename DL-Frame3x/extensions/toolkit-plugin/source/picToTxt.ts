const fs = require("fs");
const path = require("path");

const picBinPath = require("../config.json").picTxtPath;

export function changeTxtFunc(pathStr: string) {
    // 确保输出目录存在
    if (!fs.existsSync(picBinPath)) {
        fs.mkdirSync(picBinPath, { recursive: true });
    }
    console.log(`开始处理目录: ${pathStr}`);
    // 递归处理目录
    processDirectory(pathStr);
    console.log('转换完成，输出路径为: ' + picBinPath);
};

// 递归处理目录的函数
function processDirectory(dirPath: string) {
    // 读取目录中的所有文件和子目录
    const items = fs.readdirSync(dirPath);
    // @ts-ignore
    items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // 如果是目录，递归处理
            processDirectory(fullPath);
        } else if (stat.isFile()) {
            // 如果是文件，检查是否为图片文件
            if (item.endsWith('.jpg') || item.endsWith('.png')) {
                processImageFile(fullPath, dirPath, item);
            }
        }
    });
}
// 处理单个图片文件的函数
function processImageFile(filePath: string, dirPath: string, fileName: string) {
    const type = fileName.endsWith('.jpg') ? '.jpg' : '.png';
    const name = fileName.replace(type, '');
    // 读取文件并转换为base64
    const base64Data = fs.readFileSync(filePath, 'base64');
    const outputFileName = `${name}.txt`;
    const outputPath = path.join(picBinPath, outputFileName);

    fs.writeFileSync(outputPath, base64Data);
    console.log(`已转换: ${filePath} -> ${outputPath}`);
}