const fs = require("fs");
const path = require("path");
// 改为数组<string>类型，适配多个预制体目录
const preNames = require("../config.json").preName;

var dataArrs: string = '';

/**
 * 更新预制体类型声明文件
 * 遍历多个预制体目录，解析prefab文件生成对应的类型定义
 */
export function updatePre() {
    // 初始化类型声明内容
    dataArrs = `import { Node } from 'cc';\n`;
    dataArrs += `declare global {`;

    // 遍历所有预制体目录
    preNames.forEach((preName: string) => {
        const pathstr = path.join(Editor.Project.path, preName);

        // 检查目录是否存在，避免报错
        if (!fs.existsSync(pathstr)) {
            console.warn(`预制体目录不存在，已跳过: ${pathstr}`);
            return;
        }

        try {
            const files: string[] = fs.readdirSync(pathstr);
            files.map(filepar => {
                // 跳过meta文件
                if (filepar.indexOf('.meta') == -1) {
                    const newDir = path.join(pathstr, filepar);

                    // 检查路径是否为目录
                    if (!fs.statSync(newDir).isDirectory()) {
                        return;
                    }

                    let filesPar: string[] = fs.readdirSync(newDir);
                    filesPar.forEach(file => {
                        // 只处理prefab文件，跳过meta
                        if (file.indexOf('.meta') == -1 && file.indexOf('.prefab') > -1) {
                            let newDirPath = path.join(newDir, file);
                            let name = file.split('.')[0];
                            readFileContent(newDirPath, name);
                        }
                    });
                }
            });
        } catch (error) {
            console.error(`处理目录 ${pathstr} 时出错:`, error);
        }
    });

    // 完成全局声明
    dataArrs += `\n}`;
    // 写入类型声明文件
    let pt = path.join(Editor.Project.path, 'type_pre.d.ts');
    fs.writeFileSync(pt, dataArrs);
}

/**
 * 读取预制体文件内容并生成类型定义
 * @param fileDir prefab文件完整路径
 * @param fileName 预制体文件名（不含后缀）
 */
function readFileContent(fileDir: string, fileName: string) {
    try {
        // 读取并解析prefab文件（cocos的prefab本质是JSON格式）
        let content = fs.readFileSync(fileDir, 'utf8');
        let jsonContent = JSON.parse(content);
        let arrayContent = formatName(jsonContent);

        // 生成类型声明
        let typeTree = `\n   type tree_${fileName} = {`;
        arrayContent.forEach((name) => {
            // 对节点名称做特殊字符转义，避免语法错误
            const safeName = name.replace(/"/g, '\\"');
            typeTree += `\n      "${safeName}": Node,`;
        });
        typeTree += `\n   }`;
        dataArrs += typeTree;
    } catch (error) {
        console.error(`解析预制体文件 ${fileDir} 时出错:`, error);
    }
}

/**
 * 格式化预制体JSON内容，提取所有节点名称
 * @param content 预制体JSON解析后的内容
 * @returns 节点名称数组
 */
function formatName(content: any) {
    let nodeNames: string[] = [];

    // 防御性检查，确保content是数组
    if (!Array.isArray(content)) {
        console.warn("预制体文件内容格式异常，不是数组类型");
        return nodeNames;
    }

    content.forEach(element => {
        // 筛选出cc.Node类型且包含预制体信息的节点
        if (element?.["__type__"] === "cc.Node" && element?.["_name"] && element?.["_prefab"]) {
            nodeNames.push(element["_name"]);
        }
    });

    // 去重，避免重复定义相同节点名
    return [...new Set(nodeNames)];
}