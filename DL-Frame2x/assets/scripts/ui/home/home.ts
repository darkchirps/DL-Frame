import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { UIClass } from '../../../appDL/Manager/UIClass';
import { homePopupMgr } from './homePopupMgr';
import list from '../../../appDL/Component/virtualList';
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
        this.nodes.list.getComponent(list).bindRenderEvent(this, 'onItemRender');
        this.nodes.list.getComponent(list).numItems = 5;
    }
    btnManager() {
        this.nodes.btn.click(() => {
            this.nodes.list.getComponent(list).scrollToIndex(5, 0.5);
        })
    }

    // Item渲染回调方法（参数不变）
    onItemRender(itemNode: cc.Node, index: number) {
        // 填充Item数据
        itemNode.nodes.label.string = `第${index + 1}条数据`;
    }
}
UIMgr.register(new UIClass({
    ID: "home",
    parfabPath: "home",
    group: "core",
    fullScreen: true
}));