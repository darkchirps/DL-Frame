import { game } from "./game";
import { gameItem } from "./gameItem";

const { ccclass, property, menu } = cc._decorator;

export class gamePropMgr {

    constructor(private game: game) { }

    /**道具使用中*/
    propUsing: boolean = false;

    init() {
        this.btnManager();
    }
    //按钮管理
    btnManager() {
        this.game.nodes.propTipBtn.click(() => {
            let infoArr = this.game.getHaveClick();
            let clickSprs = infoArr.shadowSprs;
            if (clickSprs.length == 1) return;
            let matchs = G.arrayMgr.findArrayGroup(clickSprs, "blockId");
            if (matchs.length < 2) return;
            this.propUsing = true;
            matchs.forEach((spr: gameItem) => spr.breatheTweenFunc())
        })
        this.game.nodes.propRefreshBtn.click(() => {

        })
    }
}
