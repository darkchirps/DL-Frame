"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePre = updatePre;
const fs = require("fs");
const path = require("path");
const preName = require("./config.json").preName;
const pathstr = path.join(Editor.Project.path, preName);
var dataArrs = '';
function updatePre() {
    dataArrs = `import { Node } from 'cc';\n`;
    dataArrs += `declare global {`;
    const files = fs.readdirSync(pathstr);
    files.map(filepar => {
        if (filepar.indexOf('.meta') == -1) {
            let newDir = path.join(pathstr, filepar);
            let filesPar = fs.readdirSync(newDir);
            filesPar.forEach(file => {
                if (file.indexOf('.meta') == -1 && file.indexOf('.prefab') > -1) {
                    let newDirPath = path.join(newDir, file);
                    let name = file.split('.')[0];
                    readFileContent(newDirPath, name);
                }
            });
        }
    });
    dataArrs += `\n}`;
    let pt = path.join(Editor.Project.path, 'type_pre.d.ts');
    fs.writeFileSync(pt, dataArrs);
}
function readFileContent(fileDir, fileName) {
    let content = (0, fs.readFileSync)(fileDir, 'utf8');
    let arrayContent = formatName(JSON.parse(content));
    let typeTree = `\n   type tree_${fileName} = {`;
    arrayContent.forEach((name) => {
        typeTree += `\n      "${name}": cc.Node,`;
    });
    typeTree += `\n   }`;
    dataArrs += typeTree;
}
// 处理节点名字，找出其名字并给原数据赋值
function formatName(content) {
    let nodeNames = [];
    content.forEach(element => {
        if (element["__type__"] == "cc.Node" && element["_name"] && element["_prefab"]) {
            nodeNames.push(element["_name"]);
        }
    });
    return nodeNames;
}