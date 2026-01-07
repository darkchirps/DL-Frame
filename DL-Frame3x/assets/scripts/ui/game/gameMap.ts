import { _decorator, Component, Node } from 'cc';
import UIMgr from 'db://assets/appDL/Manager/UIMgr';
const { ccclass, property } = _decorator;

@ccclass('gameMap')
export class gameMap extends Component {


    start() {

    }

    async createMap() {
        let img = await UIMgr.ui.game.uiScr.getDynamicPic("map/map1");

    }

    update(deltaTime: number) {

    }
}


