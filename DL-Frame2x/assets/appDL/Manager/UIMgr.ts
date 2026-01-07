/*
UI管理类，单例类，用于管理所有的UI窗口
*/
import { UIClassDict } from "../../../type_spr";
import { UIClass, UIStatus } from "./UIClass";

export default class UIMgr {

    //ui集合
    public static ui: Partial<UIClassDict> & k_v<UIClass> = {};
    /**
     * 注册窗体
     * @param uiClass 窗体uiClass
     */
    public static register(uiClass: UIClass) {
        var _id = uiClass.uiConfig.ID;
        this.ui[_id] = uiClass;
    }

    /**
     * 获取一个窗口
     * @param ID 窗口ID
     * @returns
     */
    public static get(ID: string) {
        return this.ui[ID];
    }

    /**
     * 当任意UI被显示时，触发该方法
     * @param uiClass 由该uiClass显示引起的
     */
    public static onUIShow(uiClass: UIClass) {
        this.setZIndex(uiClass);
        for (let id in this.ui) {
            let _uiclass = this.ui[id];
            if (!_uiclass.node?.isValid) continue;
            //UI显示时，如果设置了fullScreen，则可以把其他的fullScreenUI隐藏掉，减少消耗
            if (uiClass.uiConfig.fullScreen) {
                if (_uiclass.uiConfig.ID != uiClass.uiConfig.ID && _uiclass.uiConfig.fullScreen) {
                    _uiclass.node.opacity = 0;
                    console.log(`打开了全屏窗口${uiClass.uiConfig.ID}，自动隐藏${_uiclass.uiConfig.ID}`);
                }
            }
            //页面打开时，自动关闭相同group的其他界面
            if (uiClass.uiConfig.group) {
                if (_uiclass.uiConfig.ID != uiClass.uiConfig.ID && _uiclass.uiConfig.group && _uiclass.uiConfig.group == uiClass.uiConfig.group) {
                    _uiclass.remove();
                }
            }
        }
    }

    /**设置层级*/
    public static setZIndex(uiClass: UIClass, state: boolean = true) {
        var maxZindex = 0;
        if (!this.ui[uiClass.uiConfig.ID]?.node?.isValid && state) return;
        for (let id in this.ui) {
            let _uiclass = this.ui[id];
            if (_uiclass.uiConfig.ID != uiClass.uiConfig.ID && _uiclass.isShow && _uiclass.node.zIndex > maxZindex) {
                maxZindex = _uiclass.node.zIndex;
            }
        }
        if (state && uiClass._parentNode == null) {
            uiClass.node.zIndex = maxZindex + 10;
        }
        if (uiClass._parentNode == null) {
            G.main.rootMaskNode.zIndex = state ? maxZindex + 1 : maxZindex - 9;
        }
    }

    /**
     * 当任意UI被关闭时，触发该方法
     * @param uiClass 由该uiClass关闭引起的
     */
    public static onUIRemove(uiClass: UIClass) {
        if (uiClass.uiConfig.fullScreen) {
            //UI被关闭时，如果设置了fullScreen，则找到最顶上的一个fullScreen UI显示出来
            var topFullScreenUI;
            for (let id in this.ui) {
                let _uiclass = this.ui[id];
                if (_uiclass.uiConfig.ID != uiClass.uiConfig.ID && _uiclass.uiConfig.fullScreen && _uiclass.isShow && _uiclass.status != UIStatus.REMOVED && _uiclass.status != UIStatus.REMOVING) {
                    topFullScreenUI = _uiclass;
                }
            }
            if (topFullScreenUI?.isShow) {
                console.log(`关闭了全屏窗口${uiClass.uiConfig.ID}，自动显示${topFullScreenUI.uiConfig.ID}`);
                topFullScreenUI.node.opacity = 255;
            }
        }
        this.setZIndex(uiClass, false);
    }
}

globalThis["UIMgr"] = UIMgr; 