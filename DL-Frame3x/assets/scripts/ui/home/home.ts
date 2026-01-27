/**
* author:Fany0219
* create:Tue Dec 09 2025 21:00:01 GMT+0800 (中国标准时间)
*/
import { _decorator, Node, EditBox, Label, Vec3, Vec2, Toggle, ProgressBar, v3, v2, Sprite, UIOpacity, UITransform, Widget, BlockInputEvents, Input, Prefab, instantiate } from 'cc';
import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { UIClass } from '../../../appDL/Manager/UIClass';

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
        this.nodes.listNode1.virtualList.bindRenderEvent(this, "renderItem1");
        this.nodes.listNode1.virtualList.numItems = 10;

        this.nodes.listNode2.virtualList.bindRenderEvent(this, "renderItem2");
        this.nodes.listNode2.virtualList.numItems = 10;

        this.nodes.listNode3.virtualList.bindRenderEvent(this, "renderItem3");
        this.nodes.listNode3.virtualList.numItems = 20;

        this.nodes.listNode4.virtualList.bindRenderEvent(this, "renderItem4");
        this.nodes.listNode4.virtualList.numItems = 20;
    }
    renderItem1(node: Node, index: number) {

    }
    renderItem2(node: Node, index: number) {

    }
    renderItem3(node: Node, index: number) {

    }
    renderItem4(node: Node, index: number) {

    }
    //按钮管理
    btnManager() {

    }
}

//注册UI界面
UIMgr.register(new UIClass({
    ID: "home",
    parfabPath: "home",
    group: "core",
}));