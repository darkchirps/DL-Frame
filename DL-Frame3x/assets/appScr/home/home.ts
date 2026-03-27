/**
* author:Fany0219
* create:Tue Dec 09 2025 21:00:01 GMT+0800 (中国标准时间)
*/
import { _decorator, Node, EditBox, Label, Vec3, Vec2, Toggle, ProgressBar, v3, v2, Sprite, UIOpacity, UITransform, Widget, BlockInputEvents, Input, Prefab, instantiate } from 'cc';
import { bundleType, UIClass } from '../../appDL/Manager/UIClass';
import UIMgr from '../../appDL/Manager/UIMgr';
import UIScr from '../../appDL/Manager/UIScr';


const { ccclass, property, menu } = _decorator;

@ccclass('home')
export class home extends UIScr {
    nodesType: tree_home;

    start() {
        this.showUi();
        this.btnManager();
    }
    //执行一次的逻辑
    showUi() {
        C.watch("languageId", (newVal, oldVal) => {
            this.nodes.lan.string = newVal;
        }, this.node);
    }
    //按钮管理
    btnManager() {
        this.nodes.listGame1.click(() => {
            UIMgr.ui.mahLoading.show();
        })
    }
}

//注册UI界面
UIMgr.register(new UIClass({
    ID: "home",
    parfabPath: "home",
    bundleName: bundleType.appUi,
    group: "core",
}));