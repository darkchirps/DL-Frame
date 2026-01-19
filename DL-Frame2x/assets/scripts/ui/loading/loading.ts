import platformMgr, { AdScene, EventType } from '../../project/platformMgr';
import { AdsType } from '../../project/mySystemEnum';
import AudioMgr from '../../../appDL/Manager/AudioMgr';
import ConfigMgr from '../../../appDL/Manager/ConfigMgr';
import { bundleType, UIClass } from '../../../appDL/Manager/UIClass';
import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { TaskQueue } from '../../../appDL/System/TaskQueue';

const { ccclass, property } = cc._decorator;

const loadArr: { bundleName: string; dir: string }[] = [
    { bundleName: "ui", dir: "" }
];

@ccclass
export class loading extends UIScr {
    nodesType: tree_loading;

    loadStep: number = 0;

    taskQueue: TaskQueue = null;

    start() {
        this.taskQueue = new TaskQueue();
        this.taskQueue.onQueueComplete = () => {
            console.log('所有任务完成!');
            this.loadStep++;
        };
        this.setupLoadingQueue();
        this.loadBundleOver(() => {
            this.loadStep++;
        });
        this.loadStep++;
    }
    private setupLoadingQueue() {
        this.taskQueue.add(() => this.loadConfig(), '加载bin配置文件');
        this.taskQueue.add(() => this.loadAudio(), '加载音频文件');
    }
    loadConfig(): Promise<void> {
        return new Promise((resolve, reject) => {
            ConfigMgr.init(bundleType.resources, "json", (jsonArr) => {
                G.config = jsonArr;
                resolve();
            });
        });
    }
    loadAudio(): Promise<void> {
        return new Promise((resolve, reject) => {
            AudioMgr.init(() => {
                resolve();
            });
        });
    }

    enterFunc() {
        platformMgr.showAd(AdsType.AT_Banner_Bottom, AdScene.BA_001);
        if (C.languageId == '') {
            C.languageId = myG.languageId != '' ? myG.languageId : 'en';
        }
        UIMgr.ui.home.show();
    }
    update(dt: number): void {
        if (this.loadStep == -1) return;
        let loadSpeed: number = 0.3;
        if (this.loadStep >= 3) {
            loadSpeed = 0.7;
        } else if (this.nodes.pro.progressBar.progress >= 0.99) {
            if (myC.deepUserId == 0) myC.deepUserId = 1;
            loadSpeed = 0;
        } else if (this.nodes.pro.progressBar.progress > 0.9) {
            loadSpeed = 0.01;
        } else if (this.nodes.pro.progressBar.progress > 0.7) {
            loadSpeed = 0.05;
        }
        if (this.nodes.pro.progressBar.progress >= 1) {
            this.loadStep = -1;
            this.enterFunc();
        } else {
            this.nodes.pro.progressBar.progress += dt * loadSpeed;
            let pro = this.nodes.pro.progressBar.progress;
            this.nodes.proLab.string = "Loading " + Math.trunc((pro >= 1 ? 1 : pro) * 100) + '%';
        }
    }
    loadId: number = 0;
    loadBundleOver(callback?: Function) {
        for (let id = this.loadId; id < loadArr.length; id++) {
            this.loadBundle(loadArr, id, () => {
                this.loadId = id + 1;
                if (this.loadId >= loadArr.length) {
                    callback && callback();
                }
            });
        }
    }
    loadBundle(loadName, id: number, callback?: Function) {
        G.asset.loadDirRes(loadName[id]["bundleName"], loadName[id]["dir"], () => {
            callback && callback();
        }).then((data: cc.Asset[]) => {
            data.forEach(item => {
                if (item instanceof cc.Prefab) {
                } else if (item instanceof cc.SpriteFrame) {
                }
            });
        });
    }
}
UIMgr.register(new UIClass({
    ID: "loading",
    parfabPath: "loading",
    group: "core",
}));