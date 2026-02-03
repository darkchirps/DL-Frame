import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { UIClass } from '../../../appDL/Manager/UIClass';
import { homePopupMgr } from './homePopupMgr';
const { ccclass, property } = cc._decorator;

@ccclass
export class home extends UIScr {
    nodesType: tree_home;

    homePopupMgr: homePopupMgr;

    start() {
        this.homePopupMgr = new homePopupMgr(this);
        this.homePopupMgr.init();

        this.showUi();
        this.btnManager();
    }
    showUi() {

    }
    btnManager() {
        this.nodes.play.click(() => {
            UIMgr.ui.game.show();
        })
    }
}
UIMgr.register(new UIClass({
    ID: "home",
    parfabPath: "home",
    group: "core",
    fullScreen: true
}));