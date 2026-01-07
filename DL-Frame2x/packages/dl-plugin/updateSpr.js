"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSpr = updateSpr;
const fs = require("fs");
const path = require("path");
const uiDir = require("./config.json").sprName;
const pathstr = path.join(Editor.Project.path, uiDir);
var UILogicDict = {};
var UIClassDict = {};
var importArr = [];
/**
 * 将Excel文件转换为JSON格式
 * @param excelPath Excel文件路径
 * @param outputDir 输出目录
 * @returns 转换结果
 */
function updateSpr() {
    importArr = [];
    importArr = [`import { UIClass } from './assets/appDL/Manager/UIClass';\n`];
    const files = fs.readdirSync(pathstr);
    files.map(filepar => {
        if (!filepar.endsWith('.meta')) {
            if (filepar.split('.')[1] == 'ts') {
                readTs('', filepar);
            }
            else {
                let filesPar = fs.readdirSync(pathstr + '/' + filepar);
                filesPar.forEach(file => {
                    if (file.indexOf('.meta') == -1 && file.indexOf('.ts') != -1) {
                        readTs(filepar, file);
                    }
                });
            }
        }
    });
    let ts = importArr.join("");
    ts += `
interface UIClassDict { }
`;
    for (var className in UILogicDict) {
        ts += `interface ${className}Class extends UIClass {
    uiScr: ${UILogicDict[className]}
}
`;
    }
    ts += `
interface UIClassDict {
`;
    for (var baseName in UIClassDict) {
        ts += `    ${baseName}: ${UIClassDict[baseName]}\n`;
    }
    ts += `}`;
    let pt = path.join(Editor.Project.path, 'type_spr.d.ts');
    fs.writeFileSync(pt, ts);
}
function readTs(par, tsName) {
    let name = tsName.split('.')[0];
    let fileName = "";
    if (par == '') {
        fileName = '/' + tsName;
    }
    else {
        fileName = '/' + par + '/' + tsName;
    }
    let str = fs.readFileSync(pathstr + "/" + fileName, 'utf-8');
    // 只处理继承 UIScr 的类
    const classReg = /export\s+(?:default\s+)?(?:abstract\s+)?class\s+(\w+)\s+extends\s+UIScr(?:<[^>]+>)?/;
    let match = classReg.exec(str);
    if (!match)
        return; //不继承 UIScr 直接退出
    var arr = [];
    var UILogicName = name;
    arr.push(UILogicName);
    UILogicDict[name] = name;
    UIClassDict[name] = name + "Class";
    importArr.push(`import { ${arr.join(', ')} } from './${uiDir}/${par}/${name}';\n`);
}