import { _decorator, isValid, AssetManager, SpriteFrame, Prefab } from 'cc';
import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { bundleType, UIClass } from '../../../appDL/Manager/UIClass';
const { ccclass, property, menu } = _decorator;

@ccclass('loading')
export class loading extends UIScr {
    //节点树type，在预置体发生变化后，通过 IDE-工作台-更新prefab提示文件 来生成和更新
    nodesType: tree_loading;

    loadStep: number = 0;

    start() {
        // ConfigMgr.init(bundleType.resources, "bin", (binArr) => {
        //     G.config = binArr;
        //     this.loadStep++;
        // });
        this.loadStep++;
        this.loadStep++;
        this.loadStep++;

    }
    enterFunc() {
        UIMgr.ui.home.show();
    }
    update(dt: number): void {
        if (this.loadStep == -1) return;
        let loadSpeed: number = 0.3;
        let proNum = this.nodes.Bar.sprite.fillRange;
        if (this.loadStep >= 3) {
            loadSpeed = 0.7;
        } else if (proNum >= 0.99) {
            loadSpeed = 0;
        } else if (proNum > 0.9) {
            loadSpeed = 0.01;
        } else if (proNum > 0.7) {
            loadSpeed = 0.05;
        }
        if (proNum >= 1) {
            this.loadStep = -1;
            this.enterFunc();
        } else {
            this.nodes.Bar.sprite.fillRange += dt * loadSpeed;
            let pro = this.nodes.Bar.sprite.fillRange;
            this.nodes.Label.string = "Loading " + Math.trunc((pro >= 1 ? 1 : pro) * 100) + '%';
        }
    }
}

//注册UI界面
UIMgr.register(new UIClass({
    ID: "loading",
    parfabPath: "loading",
}));