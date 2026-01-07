import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { bundleType, UIClass } from '../../../appDL/Manager/UIClass';

const { ccclass, property } = cc._decorator;

@ccclass
export class test extends UIScr {
    nodesType: tree_test;
  
}

UIMgr.register(new UIClass({
    ID: "test",
    parfabPath: "test",
}));