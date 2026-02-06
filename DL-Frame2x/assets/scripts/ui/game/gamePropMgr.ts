import { game } from "./game";

const { ccclass, property, menu } = cc._decorator;

export class gamePropMgr {

    constructor(private game: game) { }

    init() {
        this.btnManager();
    }
    //按钮管理
    btnManager() {
        this.game.nodes.propTipBtn.click(() => {
            let infoArr = this.game.getHaveClick();
            let clickSprs = infoArr[1];
            if (clickSprs.length == 1) return;
            
        })
    }
}
