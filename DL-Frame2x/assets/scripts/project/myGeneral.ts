import UIMgr from "../../appDL/Manager/UIMgr";
import { Gvent } from "../../appDL/System/GlobalEventEnum";
import { SubscribeData } from "./myGameEnum";
import { GoodsInfo } from "./mySystemEnum";
import platformMgr from "./platformMgr";

//本项目相关信息入口初始脚本
class mygeneralMgr {
    /**地图文件*/
    public static map = null;
    /**素材包选择的图片数据*/
    public static picData: string = null;
    /**存储所有图片*/
    public static spriteArr: Map<string, cc.SpriteFrame> = new Map();
    /**语言id */
    public static languageId: string = '';
    /**免内购*/
    public static openPay: boolean = false;
    /**订阅数据*/
    public static subData: SubscribeData = null;
    /**订单数据*/
    public static goodsInfos: { [key: string | number]: GoodsInfo } = null;

    /** 初始化 */
    public static init() {
        cc.director.getPhysicsManager().enabled = true;
        cc.director.getCollisionManager().enabled = true;
        platformMgr.notifyLaunched();
        myC.init();
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        UIMgr.ui.loading.show();
        G.event.on(Gvent.NodeClick, (node) => {
            // if (C.soundSwitch) G.mp3.click.playEffect(false);
        }, this);
        if (cc.sys.isBrowser) {
            G.openLog = true;
        }
    }
    public static onKeyDown(event) {
        switch (event.keyCode) {
            case cc.macro.KEY.e:
                break;
        }
    }
}
export default class myG extends mygeneralMgr { }
declare global { var myG: typeof mygeneralMgr }
globalThis["myG"] = myG;
