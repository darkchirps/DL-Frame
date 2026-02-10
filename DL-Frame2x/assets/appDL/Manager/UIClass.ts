import UIMgr from "./UIMgr";
import UIScr from "./UIScr";

/**
 * 单个UI窗口类
 * 不论窗口本身是否显示中，都可以访问该实例
 */
export class UIClass {
    /** 窗口状态 */
    public status: UIStatus = UIStatus.INIT;
    /** 窗口属性配置 */
    public uiConfig: UIConfig;
    /** 实例化后的node节点 */
    public node: cc.Node = null;
    /** 实例化后的uiScr */
    public uiScr: UIScr;
    /** 事件系统 */
    public event: cc.EventTarget = new cc.EventTarget();
    /** 额外数据 */
    public _data;
    /** 加入到指定父节点 */
    public _parentNode: cc.Node = null;

    constructor(uiConfig: UIConfig) {
        this.uiConfig = uiConfig;
    }

    /** 判断该页面是否显示 */
    get isShow(): boolean {
        return this.status === UIStatus.OPENED;
    }
    /** 显示界面 */
    async show(val?: any) {
        if (this.status === UIStatus.OPENING || this.status === UIStatus.REMOVING) return;
        this._data = val;
        if (!this.node || !this.node.isValid) {
            await this._instantiate();
        }
        const n = this.node;
        if (this.status !== UIStatus.OPENED || !n || !n.isValid) return;
        n.active = true;
        UIMgr.onUIShow(this);
        this.changeDiamondState(true);
        this.event.emit("show");
    }
    /** 关闭界面 */
    remove() {
        if (this.status !== UIStatus.OPENED) return;
        this.status = UIStatus.REMOVING;
        const finish = () => {
            if (cc.isValid(this.node)) {
                this.node.destroy();
                UIMgr.get(this.node.name).onRemove();
            }
            this._parentNode = null;
            this._data = null;
            this.status = UIStatus.REMOVED;
        };
        this.changeDiamondState(false);
        this.removePopup(finish);
    }
    /**钻石状态栏*/
    changeDiamondState(state: boolean) {
        if (this.uiConfig.currency) {
            if (state) {//显示
                G.main.currencyHaveName.push(this.uiConfig.ID);
                G.main.currencyNode.parent = this.node;
                G.main.currencyNode.active = true;
            } else {
                const index = G.main.currencyHaveName.indexOf(this.uiConfig.ID);
                if (index > -1) {
                    G.main.currencyHaveName.splice(index, 1);
                }
                if (G.main.currencyHaveName.length == 0) {
                    G.main.currencyNode.parent = G.main.other;
                    G.main.currencyNode.active = false;
                } else {
                    G.main.currencyNode.parent = UIMgr.get(G.main.currencyHaveName[0]).node;
                }
            }
        }
    }
    removePopup(done: Function) {
        const n = this.node;
        if (!this.uiConfig.animBool || !n) {
            done();
            return;
        }
        cc.tween(n)
            .to(0.05, { scale: 1.1 })
            .to(0.05, { scale: 1 })
            .to(0.1, { scale: 0.1 })
            .call(done)
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
        this.event.clear();
        // G.asset.decRefByTag(this.uiConfig.ID);
    }
    /**
     * 设置该UI的父节点，在show之前调用
     * @param parent 父节点
     */
    setParent(parent: cc.Node): UIClass {
        this._parentNode = parent;
        return this;
    }
    /** 获取父节点 */
    getParent(): cc.Node {
        const p = this._parentNode;
        return p && p.isValid ? p : G.main.rootNode;
    }
    /** 创建界面 */
    async _instantiate() {
        this.status = UIStatus.OPENING;
        G.main.loadingNode.active = true;
        let prefab: cc.Prefab = await G.asset.getPrefab(bundleType.ui, this.uiConfig.parfabPath + "/" + this.uiConfig.ID, this.uiConfig.ID);
        //@ts-ignore
        if (!prefab || this.status === UIStatus.REMOVING || this.status === UIStatus.REMOVED) return console.log("UI实例化失败");
        // 实例化节点
        const n = cc.instantiate(prefab);
        this.node = n;
        n.name = this.uiConfig.ID;
        n.parent = this.getParent();
        n.setPosition(0, 0);
        this.ensureFullWidget(n);
        this.playOpenAnim(n);
        this.mountLogic(n);
        this.status = UIStatus.OPENED;
        G.main.loadingNode.active = false;
    }
    mountLogic(n: cc.Node) {
        const id = this.uiConfig.ID;
        this.uiScr = n.getComponent(id) || n.addComponent(id);
        this.uiScr.uiClass = this;
        this.uiScr.onShow();
        n.addComponent(cc.BlockInputEvents);
    }
    ensureFullWidget(n: cc.Node) {
        if (n.getComponent(cc.Widget)) return;
        const w = n.addComponent(cc.Widget);
        w.isAlignTop = w.isAlignBottom = w.isAlignLeft = w.isAlignRight = true;
        w.top = w.bottom = w.left = w.right = 0;
    }
    playOpenAnim(n: cc.Node) {
        if (!this.uiConfig.animBool) return;
        n.scale = 0.3;
        cc.tween(n)
            .to(0.1, { scale: 1 })
            .to(0.05, { scale: 1.1 })
            .to(0.05, { scale: 1 })
            .call(() => {
                const w = n.getComponentsInChildren(cc.Widget);
                for (const wid of w) wid.updateAlignment();
            })
            .start();
    }
}

// 窗口属性配置
export type UIConfig = {
    /**prefab唯一标识*/
    ID: string;
    /**prefab所处文件夹*/
    parfabPath?: string;
    /**全屏*/
    fullScreen?: boolean;
    /**显示货币栏*/
    currency?: boolean;
    /**页面打开关闭动画*/
    animBool?: boolean;
    /**组别 同组情况下只会显示最新打开的*/
    group?: string;
    /**关闭遮罩*/
    noMask?: boolean;
};
// 窗口状态枚举
export enum UIStatus {
    INIT,
    OPENING,
    OPENED,
    REMOVING,
    REMOVED,
}
/**bundle类型*/
export enum bundleType {
    ui = "ui",
    resources = "resources",
}