import UIMgr from "../../../appDL/Manager/UIMgr";
import { home } from "./home";

const { ccclass, property, menu } = cc._decorator;

/**主页弹窗管理器，负责管理主页弹出逻辑*/
export class homePopupMgr {

    constructor(private home: home) { }

    sortName: string[] = [];

    _taskIndex: number = -1;
    get taskIndex() {
        return this._taskIndex;
    }
    set taskIndex(value: number) {
        this._taskIndex = value;
        let name = this.sortName[value];
        if (UIMgr.ui.home.isShow && this[`${name}`]) {
            this[`${name}`]();
        }
    }

    init() {
        this.taskIndex = 0;
        this.btnManager();
        this.openFunc();
        this.otherFunc();
    }
    btnManager() {
      
    }
    //按钮显示逻辑
    openFunc() {
        
    }
    //相关功能附加逻辑
    otherFunc() {
       
    }
}
