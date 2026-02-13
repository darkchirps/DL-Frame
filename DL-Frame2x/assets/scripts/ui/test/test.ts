
import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { UIClass } from '../../../appDL/Manager/UIClass';
const { ccclass, property } = cc._decorator;

//脚本同预制体名
@ccclass
export class test extends UIScr {
    nodesType: tree_test; //对应 tree_预制体名

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
    ID: "test",//唯一id 对应预制体名
    parfabPath: "test",//预制体所处父文件夹名
}));