const fs = require("fs");
const path = require("path");

/**
 * 创建一个继承UIScr的TS脚本
 * @param {string} selectedFolderPath - 项目的路径
 * @param {string} defaultFileName - 初始的默认脚本名
 */
function createUIScr(selectedFolderPath, defaultFileName) {
  // 获取父文件夹名
  let parentFolderName = path.basename(selectedFolderPath.url); // 获取最后一个文件夹名

  // 初始脚本内容
  let scriptContent = `// 自动生成的UIScr脚本，请勿手动修改
import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { UIClass } from '../../../appDL/Manager/UIClass';
const { ccclass, property } = cc._decorator;

@ccclass
export class ${defaultFileName} extends UIScr {
    nodesType: tree_${defaultFileName}; 

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
    ID: "${defaultFileName}",
    parfabPath: "${parentFolderName}",
}));`;

  Editor.log(`已创建脚本文件：${selectedFolderPath.path}`, `${defaultFileName}`);
  // 确定文件路径
  let scriptFilePath = path.join(selectedFolderPath.path, `${defaultFileName}.ts`);
  // 写入脚本文件
  fs.writeFileSync(scriptFilePath, scriptContent);
  // 刷新
  Editor.assetdb.refresh(selectedFolderPath.url);
  // 监听文件名修改
  Editor.assetdb.on('move', (event) => {
    Editor.log(`已变更：\n${event}`);
    if (event.event === 'rename') {
      // 如果文件名发生变化
      const { oldPath, newPath } = event;

      // 如果修改的是我们刚才创建的脚本文件
      if (oldPath === scriptFilePath) {
        const newFileName = path.basename(newPath, '.ts'); // 获取新的文件名（去掉.ts后缀）
        // 更新脚本内容中的 fileName
        updateScriptFile(newPath, newFileName);
      }
    }
  });
}

/**
 * 更新脚本文件中的 fileName 字段
 * @param {string} scriptFilePath - 脚本文件路径
 * @param {string} newFileName - 新的脚本文件名
 */
function updateScriptFile(scriptFilePath, newFileName) {
  // 读取脚本文件内容
  let scriptContent = fs.readFileSync(scriptFilePath, 'utf-8');

  // 替换脚本中的 fileName
  scriptContent = scriptContent.replace(/export default class \w+/g, `export default class ${newFileName}`);

  // 更新类名和相关的 fileName
  scriptContent = scriptContent.replace(new RegExp(`${path.basename(scriptFilePath, '.ts')}`, 'g'), newFileName);

  // 写回更新后的内容
  fs.writeFileSync(scriptFilePath, scriptContent);

  // 刷新资源管理器，确保内容更新
  Editor.assetdb.refresh(scriptFilePath);

  Editor.log(`脚本文件名已更新为：${newFileName}`);
}

exports.createUIScr = createUIScr;
