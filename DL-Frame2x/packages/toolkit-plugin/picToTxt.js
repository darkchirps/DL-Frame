const fs = require("fs");
const path = require("path");

const txtPath = require("./config.json").txtPath;
const txtLock = require("./config.json").txtLock;
const floderName = "txt"

function picToTxtFunc(pathStr) {
    txtPath.forEach((p) => {
        if (!(0, fs.existsSync)((0, path.join)(p, floderName))) {
            (0, fs.mkdirSync)((0, path.join)(p, floderName));
        }
    })
    Editor.log(`开始处理目录: ${pathStr}`);
    // 递归处理目录
    processDirectory(pathStr);
    txtPath.forEach((p) => {
        Editor.log('转换完成，输出路径为:' + p);
    })
}

// 递归处理目录的函数
function processDirectory(dirPath) {
    // 读取目录中的所有文件和子目录
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // 如果是目录，递归处理
            processDirectory(fullPath);
        } else if (stat.isFile()) {
            // 如果是文件，检查是否为图片文件
            if (item.endsWith('.jpg') || item.endsWith('.png')) {
                processImageFile(fullPath, item);
            }
        }
    });
}
// 处理单个图片文件的函数
function processImageFile(filePath, fileName) {
    const type = fileName.endsWith('.jpg') ? '.jpg' : '.png';
    const name = fileName.replace(type, '');
    // 读取文件并转换为base64
    const base64Data = txtLock[0] + fs.readFileSync(filePath, 'base64') + txtLock[1];
    const outputFileName = `${name}.txt`;
    txtPath.forEach((p) => {
        let putPath = path.join(p, floderName);
        let outputPath = path.join(putPath, outputFileName);
        fs.writeFileSync(outputPath, base64Data);
    })
    Editor.log(`已转换: ${outputFileName}`);
}

exports.picToTxtFunc = picToTxtFunc;