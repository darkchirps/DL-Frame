import UIMgr from "../../appDL/Manager/UIMgr";
import { Gvent } from "../../appDL/System/GlobalEventEnum";
import { gameType } from "./myGameEnum";
import { GoodsInfo, SubscribeData } from "./mySystemEnum";
import platformMgr from "./platformMgr";

//本项目相关信息入口初始脚本
class mygeneralMgr {
    /**地图文件*/
    public static map = null;
    /**一键通关*/
    public static openOne: boolean = false;
    /**免内购*/
    public static openPay: boolean = false;
    /**素材*/
    public static openSc: boolean = false;
    /**关卡样式*/
    public static levelType: string = null;
    /**素材包选择的图片数据*/
    public static picData: string = null;
    /**存钱罐每关增加金币数*/
    public static smAddGold: number = 0;
    /**游戏中当前模式*/
    static gameType: gameType = gameType.common;
    /**订单数据*/
    public static goodsInfos: { [key: string | number]: GoodsInfo } = null;
    /**订阅数据*/
    public static subData: SubscribeData = null;
    /**订阅是否生效 */
    public static get subIsActive() {
        if (myC.lifeSub) return true;
        return myG.subData != null;
    }
    /**语言id */
    public static languageId: string = '';

    /** 初始化 */
    public static init() {
        cc.director.getPhysicsManager().enabled = true;
        cc.director.getCollisionManager().enabled = true;
        platformMgr.notifyLaunched();
        myC.init();
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        console.log("%c 设置兑换码开启GM指令:!mosaic25", "color:#FF00EB; font-size: 18px;");
        console.log("%c ===== 键盘指令 =====\n 键盘g 打开GM面板\n 键盘d 深链非深链互切", "color:#FF00EB; font-size: 18px;");
        //    return UIMgr.ui.testUi.show();

        UIMgr.ui.loading.once("remove", () => {
            console.log(`%c ===== 当前状态 ===== ${myC.deepUserId == 2 ? "深链" : "非深链"}`, "color:#FF00EB; font-size: 18px;");
        }).show();
        G.event.on(Gvent.NodeClick, (node) => {
            // if (C.soundSwitch) G.mp3.click.playEffect(false);
        }, this);

        if (cc.sys.isBrowser) {
            this.openPay = true;
            this.openOne = true;
            G.openLog = true;
            myC.deepUserId = 2;
        }
    }
    public static onKeyDown(event) {
        switch (event.keyCode) {
            case cc.macro.KEY.e:
                UIMgr.ui.editMap.show();
                break;
            case cc.macro.KEY.d:
                myC.deepUserId = myC.deepUserId == 1 ? 2 : 1;
                myC.clearChangeDeep(myC.deepUserId);
                Tip.show(`深链状态发生改变,请重启游戏,当前状态:${myC.deepUserId == 2 ? "深链" : "非深链"}`);
                console.log(`%c 深链状态发生改变,请重启游戏,当前状态:${myC.deepUserId == 2 ? "深链" : "非深链"}`, "color:#FF00EB; font-size: 18px;");
                break;
        }
    }
}
export default class myG extends mygeneralMgr { }
declare global { var myG: typeof mygeneralMgr }
globalThis["myG"] = myG;
