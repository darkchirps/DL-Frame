import { isValid, BlockInputEvents, Component, find, instantiate, Layers, tween, EventTarget, Node, _decorator, Tween, log, Widget } from "cc";
import UIScr from "./UIScr";
import UIMgr from "./UIMgr";
import { Prefab } from "cc";

const { ccclass } = _decorator;

/**
 * 单个UI窗口类
 * 不论窗口本身是否显示中，都可以访问该实例
 */
@ccclass
export class UIClass {
    /** 窗口状态 */
    public status = UIStatus.INIT;
    /** 窗口属性配置 */
    public uiConfig: UIConfig;
    /** 实例化后的node节点 */
    public node: Node;
    /** 实例化后的脚本 */
    public uiScr: UIScr;
    /** 事件系统 */
    public event = new EventTarget();
    /** 额外数据 */
    public _data;
    /** 加入到指定父节点 */
    public _parentNode: Node = null;

    constructor(uiConfig: UIConfig) {
        this.uiConfig = uiConfig;
    }

    /** 判断该页面是否显示 */
    get isShow() {
        return [UIStatus.OPENING, UIStatus.OPENED].includes(this.status);
    }
    /** 显示界面 */
    async show(val?) {
        // 正在打开或移除中则不处理，避免多次加载
        if ([UIStatus.OPENING, UIStatus.REMOVING].includes(this.status)) return;
        this._data = val;
        if (!this.node || !this.node.isValid) {
            await this._instantiate();
        }
        const n = this.node;
        if (this.status !== UIStatus.OPENED || !n || !n.isValid) return;
        n.active = true;
        UIMgr.onUIShow(this);
        this.event.emit("show");
    }
    /** 关闭界面 */
    remove() {
        if (this.status !== UIStatus.OPENED) return;
        this.status = UIStatus.REMOVING;
        const n = this.node;
        const finish = () => {
            if (n && n.isValid) {
                n.destroy();
                UIMgr.get(n.name).onRemove();
            }
            this._parentNode = null;
            this._data = null;
            this.status = UIStatus.REMOVED;
        };
        this.removePopup(finish);
    }
    /**关闭 动画*/
    removePopup(done: Function) {
        const n = this.node;
        if (!this.uiConfig.animBool || !n) {
            done();
            return;
        }
        tween(n)
            .to(0.05, { scaleXY: 1.1 })
            .to(0.05, { scaleXY: 1 })
            .to(0.1, { scaleXY: 0.1 })
            .call(() => {
                done && done();
            })
            .start();
    }
    /** 注册一次监听 */
    once(eventType: string, callback = null) {
        this.event.once(eventType, callback);
        return this;
    }
    /** UI被移除后的处理逻辑 */
    onRemove() {
        this.status = UIStatus.REMOVED;
        UIMgr.onUIRemove(this);
        this.event.emit("remove");
        // @ts-ignore
        this.event.clear();
        G.asset.decRefByTag(this.uiConfig.ID);
    }
    /**设置父节点，在show之前调用
     * @param parent 父节点
     */
    setParent(parent: Node): UIClass {
        this._parentNode = parent;
        return this;
    }
    /** 获取父节点 */
    getParent(): Node {
        const p = this._parentNode;
        return p && p.isValid ? p : G.main.rootNode;
    }

    /** 创建界面 */
    async _instantiate() {
        this.status = UIStatus.OPENING;
        G.main.loadingNode.active = true;
        let prePath = this.uiConfig.parfabPath + '/' + this.uiConfig.ID;
        const prefab = await G.asset.getPrefab(bundleType.ui, prePath, this.uiConfig.ID);
        //@ts-ignore
        if (!prefab || this.status === UIStatus.REMOVING || this.status === UIStatus.REMOVED) return console.log("UI实例化失败");
        // 实例化节点
        const n = instantiate(prefab);
        this.node = n;
        this.node.layer = Layers.BitMask.UI_2D;
        n.name = this.uiConfig.ID;
        n.parent = this.getParent();
        n.setPosition(0, 0);

        this.ensureFullWidget(n);
        this.playOpenAnim(n);

        // 挂载主逻辑
        this.uiScr = (this.node.getComponent(this.uiConfig.ID) || this.node.addComponent(this.uiConfig.ID)) as UIScr;
        this.uiScr.uiClass = this;
        this.uiScr.onShow();
        // 生命周期管理
        this.node.addComponent(BlockInputEvents);
        this.status = UIStatus.OPENED;
        G.main.loadingNode.active = false;
    }
    ensureFullWidget(n: Node) {
        if (n.getComponent(Widget)) return;
        const w = n.addComponent(Widget);
        w.isAlignTop = w.isAlignBottom = w.isAlignLeft = w.isAlignRight = true;
        w.top = w.bottom = w.left = w.right = 0;
    }
    playOpenAnim(n: Node) {
        if (!this.uiConfig.animBool) return;
        n.scaleXY = 0.3;
        tween(n)
            .to(0.1, { scaleXY: 1 })
            .to(0.05, { scaleXY: 1.1 })
            .to(0.05, { scaleXY: 1 })
            .call(() => {
                const w = n.getComponentsInChildren(Widget);
                for (const wid of w) wid.updateAlignment();
            })
            .start();
    }
}

// 窗口属性配置
export type UIConfig = {
    /**prefab名*/
    ID: string;
    /**预制所处文件夹名*/
    parfabPath?: string;
    /**全屏*/
    fullScreen?: boolean;
    /**显示钻石栏*/
    diamond?: boolean;
    /**页面打开关闭动画*/
    animBool?: boolean;
    /**组别 同组情况下只会显示最新打开的*/
    group?: string;
    /**关闭遮罩*/
    noMask?: boolean;
};

// 窗口状态枚举
export enum UIStatus {
    /**初始状态*/
    INIT,
    /**打开中*/
    OPENING,
    /**打开完成*/
    OPENED,
    /**删除中*/
    REMOVING,
    /**删除结束*/
    REMOVED,
}

/**bundle类型*/
export enum bundleType {
    ui = "ui",//储存预制体及其对应资源bundle文件夹
    resources = "resources",
}