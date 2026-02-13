// 自动生成的UIScr脚本，请勿手动修改
import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { UIClass } from '../../../appDL/Manager/UIClass';
const { ccclass, property } = cc._decorator;

@ccclass
export class test extends UIScr {
    nodesType: tree_test; 

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
    ID: "test",
    parfabPath: "test",
}));