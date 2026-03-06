const fs = require("fs");
const path = require("path");
// 改为数组<string>类型
const uiDirs = require("../config.json").sprName;

// 调整为支持多目录的结构
var UILogicDict: { [k: string]: any } = {};
var UIClassDict: { [k: string]: any } = {};
var importArr = [];

/**
 * 将Excel文件转换为JSON格式
 * @param excelPath Excel文件路径
 * @param outputDir 输出目录
 * @returns 转换结果
 */
export function updateSpr() {
    importArr = [];
    importArr = [`import { UIClass } from './assets/appDL/Manager/UIClass';\n`];

    // 遍历所有sprName目录
    uiDirs.forEach((uiDir: string) => {
        const pathstr = path.join(Editor.Project.path, uiDir);

        // 检查目录是否存在，避免报错
        if (!fs.existsSync(pathstr)) {
            console.warn(`目录不存在: ${pathstr}`);
            return;
        }

        const files: string[] = fs.readdirSync(pathstr);
        files.map(filepar => {
            if (!filepar.endsWith('.meta')) {
                const fullFilePath = path.join(pathstr, filepar);
                const stat = fs.statSync(fullFilePath);

                // 判断是文件还是目录
                if (stat.isFile() && filepar.split('.')[1] == 'ts') {
                    readTs(uiDir, '', filepar);
                } else if (stat.isDirectory()) {
                    let filesPar: string[] = fs.readdirSync(fullFilePath);
                    filesPar.forEach(file => {
                        if (file.indexOf('.meta') == -1 && file.indexOf('.ts') != -1) {
                            readTs(uiDir, filepar, file);
                        }
                    });
                }
            }
        });
    });

    let ts = importArr.join("")
    ts += `
interface UIClassDict { }
`
    for (var className in UILogicDict) {
        ts += `interface ${className}Class extends UIClass {
    uiScr: ${UILogicDict[className]}
}
`
    }
    ts += `
interface UIClassDict {
`
    for (var baseName in UIClassDict) {
        ts += `    ${baseName}: ${UIClassDict[baseName]}\n`
    }
    ts += `}`;

    let pt = path.join(Editor.Project.path, 'type_spr.d.ts');
    fs.writeFileSync(pt, ts);
}

/**
 * 读取TS文件并解析类信息
 * @param uiDir 当前处理的目录名称
 * @param par 子目录名称
 * @param tsName TS文件名
 */
function readTs(uiDir: string, par: string, tsName: string) {
    let name = tsName.split('.')[0];
    let fileName = par === '' ? `/${tsName}` : `/${par}/${tsName}`;
    const fullPath = path.join(Editor.Project.path, uiDir, fileName);

    // 防错处理：文件不存在时跳过
    if (!fs.existsSync(fullPath)) {
        console.warn(`文件不存在: ${fullPath}`);
        return;
    }

    let str = fs.readFileSync(fullPath, 'utf-8');
    // 只处理继承 UIScr 的类
    const classReg = /export\s+(?:default\s+)?(?:abstract\s+)?class\s+(\w+)\s+extends\s+UIScr(?:<[^>]+>)?/;
    let match = classReg.exec(str);
    if (!match) return; // 不继承 UIScr 直接退出

    var arr = [];
    var UILogicName = name;
    arr.push(UILogicName);

    // 防止重复定义（多目录下可能有同名文件）
    if (!UILogicDict[name]) {
        UILogicDict[name] = name;
        UIClassDict[name] = name + "Class";
    }

    // 修正import路径
    const importPath = par === ''
        ? `./${uiDir}/${name}`
        : `./${uiDir}/${par}/${name}`;
    importArr.push(`import { ${arr.join(', ')} } from '${importPath}';\n`);
}