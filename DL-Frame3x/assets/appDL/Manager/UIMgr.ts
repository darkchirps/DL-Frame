/*
UI管理类，单例类，用于管理所有的UI窗口
*/
import { k_v } from "../../../type_cetend_cc";
import { UIClassDict } from "../../../type_spr";
import { UIClass, UIStatus } from "./UIClass";

export default class UIMgr {
    /**ui集合*/
    public static ui: Partial<UIClassDict> & k_v<UIClass> = {};
    /**层级计数器，每次新窗口打开递增*/
    private static _zCounter: number = 10;
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
            if (!_uiclass.isShow) continue;
            // 改进: 用 active 替代 opacity=0，语义更清晰且符合 3.x 规范
            if (uiClass.uiConfig.fullScreen) {
                if (_uiclass.uiConfig.ID != uiClass.uiConfig.ID && _uiclass.uiConfig.fullScreen) {
                    _uiclass.node.active = false;
                    console.log(`打开了全屏窗口${uiClass.uiConfig.ID}，自动隐藏${_uiclass.uiConfig.ID}`);
                }
            }
            if (uiClass.uiConfig.group) {
                if (_uiclass.uiConfig.ID != uiClass.uiConfig.ID && _uiclass.uiConfig.group && _uiclass.uiConfig.group == uiClass.uiConfig.group) {
                    _uiclass.remove();
                }
            }
        }
    }

    /**设置层级 — 改进: 用递增计数器替代遍历找最大值*/
    public static setZIndex(uiClass: UIClass, state: boolean = true) {
        if (!this.ui[uiClass.uiConfig.ID]?.node?.isValid) return;
        if (state && uiClass._parentNode == null) {
            uiClass.node.zIndex = this._zCounter;
            G.main.rootMaskNode.zIndex = this._zCounter - 1;
            this._zCounter += 10;
        } else if (uiClass._parentNode == null) {
            // 关闭时重新找当前最高层级来放 mask
            let maxZ = 0;
            for (let id in this.ui) {
                const u = this.ui[id];
                if (u.uiConfig.ID !== uiClass.uiConfig.ID && u.isShow && u.node?.isValid) {
                    maxZ = Math.max(maxZ, u.node.zIndex);
                }
            }
            G.main.rootMaskNode.zIndex = maxZ > 0 ? maxZ - 1 : 0;
        }
    }

    /**
     * 当任意UI被关闭时，触发该方法
     * @param uiClass 由该uiClass关闭引起的
     */
    public static onUIRemove(uiClass: UIClass) {
        if (uiClass.uiConfig.fullScreen) {
            var topFullScreenUI;
            for (let id in this.ui) {
                let _uiclass = this.ui[id];
                if (_uiclass.uiConfig.ID != uiClass.uiConfig.ID && _uiclass.uiConfig.fullScreen && _uiclass.isShow && _uiclass.status != UIStatus.REMOVED && _uiclass.status != UIStatus.REMOVING) {
                    topFullScreenUI = _uiclass;
                }
            }
            if (topFullScreenUI?.isShow) {
                console.log(`关闭了全屏窗口${uiClass.uiConfig.ID}，自动显示${topFullScreenUI.uiConfig.ID}`);
                // 改进: 对应 active=false，这里恢复 active=true
                topFullScreenUI.node.active = true;
            }
        }
        this.setZIndex(uiClass, false);
    }

}

globalThis["UIMgr"] = UIMgr;
