const fs = require("fs");
const path = require("path");

// 存储已创建的脚本路径，避免重复监听
const createdScripts = new Set();

/**
 * 创建一个继承UIScr的TS脚本
 * @param {string} selectedFolderPath - 项目的路径
 */
function createUIScr(selectedFolderPath) {
    try {
        // 处理路径参数，兼容不同格式的输入
        const folderPath = selectedFolderPath.path || selectedFolderPath;
        const folderUrl = selectedFolderPath.url || `db://${folderPath.replace(/\\/g, '/')}`;
        
        // 获取父文件夹名作为初始脚本名
        let parentFolderName = path.basename(folderPath);
        // 初始脚本内容 自动生成的UIScr脚本，请勿手动修改
        const scriptContent = `
import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { UIClass } from '../../../appDL/Manager/UIClass';
const { ccclass, property } = cc._decorator;

//脚本同预制体名
@ccclass
export class ${parentFolderName} extends UIScr {
    nodesType: tree_${parentFolderName}; //对应 tree_预制体名

    start() {
        this.showUi();
        this.btnManager();
    }

    showUi() {
        // UI显示逻辑
    }

    btnManager() {
        // 按钮管理逻辑
    }
}

// 注册UI管理
UIMgr.register(new UIClass({
    ID: "${parentFolderName}",//唯一id 对应预制体名
    parfabPath: "${parentFolderName}",//预制体所处父文件夹名
}));`;

        // 确定文件路径
        const scriptFilePath = path.join(folderPath, `${parentFolderName}.ts`);
        
        // 避免重复创建文件
        if (fs.existsSync(scriptFilePath)) {
            Editor.log(`文件已存在：${scriptFilePath}`);
            return;
        }

        // 写入脚本文件
        fs.writeFileSync(scriptFilePath, scriptContent, 'utf-8');
        Editor.log(`已创建脚本文件：${scriptFilePath}`);

        // 刷新资源管理器
        Editor.assetdb.refresh(folderUrl);
    } catch (error) {
        Editor.error(`创建UI脚本失败：${error.message}`);
        console.error(error);
    }
}
// 导出函数
exports.createUIScr = createUIScr;

