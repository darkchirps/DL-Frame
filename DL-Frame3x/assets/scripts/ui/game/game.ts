/**
* author:Fany0219
* create:Wed Dec 10 2025 11:32:56 GMT+0800 (中国标准时间)
*/
import { _decorator, Node, EditBox, Label, Vec3, Vec2, Toggle, ProgressBar, v3, v2, Sprite, UIOpacity, UITransform, Widget, BlockInputEvents, Input, Prefab, instantiate } from 'cc';
import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { UIClass } from '../../../appDL/Manager/UIClass';

const { ccclass, property ,menu } = _decorator;

@ccclass('game')
@menu('常用UIScr/game')
export class game extends UIScr {
    nodesType : tree_game;
    
    start() {
        this.showUi();
        this.btnManager();
    }
    //执行一次的逻辑
    showUi() {
        
    }
    //按钮管理
    btnManager(){

    }
}

//注册UI界面
UIMgr.register(new UIClass({
    ID : "game",
    parfabPath: "game",
}));