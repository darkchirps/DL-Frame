/*******************************************************************************
 * 描述:    项目全局
*******************************************************************************/
import { Prefab, SpriteFrame } from "cc";
import UIMgr from "../../appDL/Manager/UIMgr";

class myGeneral {

    /**存储所有预制*/
    public static preArr: Map<string, Prefab> = new Map();
    /**存储所有图片*/
    public static spriteArr: Map<string, SpriteFrame> = new Map();

    /** 初始化 */
    public static init() {
        myC.init();
        UIMgr.ui.loading.show();
    }

}
/** 对应项目全局总管理器 */
export default class myG extends myGeneral { }
declare global { var myG: typeof myGeneral }
globalThis["myG"] = myG;
