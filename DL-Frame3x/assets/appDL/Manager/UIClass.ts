import { isValid, BlockInputEvents, Component, find, instantiate, Layers, tween, EventTarget, Node, _decorator, Tween, log, Widget } from "cc";
import UIScr from "./UIScr";
import UIMgr from "./UIMgr";

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
        // 改进: OPENING 状态也允许标记为 REMOVING，_instantiate 会检查并中止
        if ([UIStatus.REMOVING, UIStatus.REMOVED].includes(this.status)) return;
        this.status = UIStatus.REMOVING;
        const n = this.node;
        const finish = () => {
            // 修复1：直接调用 this.onRemove()，不通过 UIMgr.get(n.name) 绕行，避免 undefined 崩溃
            if (n && n.isValid) n.destroy();
            this.onRemove();
            this._parentNode = null;
            this._data = null;
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
        // 修复2：监听节点销毁事件（场景切换等外部销毁），确保 done 一定被调用一次
        let finished = false;
        const safeDone = () => {
            if (finished) return;
            finished = true;
            done();
        };
        n.once(Node.EventType.NODE_DESTROYED, safeDone);
        tween(n)
            .to(0.05, { scaleXY: 1.1 })
            .to(0.05, { scaleXY: 1 })
            .to(0.1, { scaleXY: 0.1 })
            .call(() => {
                safeDone();
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
        const prefab = await G.asset.getPrefab(this.uiConfig.bundleName, prePath, this.uiConfig.ID);
        // await 结束后重新读取 status（TS 类型收窄会误判，强制宽化为 UIStatus 联合类型）
        const statusAfterLoad = this.status as UIStatus;
        // 修复1：无论何种原因中止，都先关闭加载遮罩，避免遮罩永久显示
        // 修复2：若加载期间被 remove() 标记为 REMOVING/REMOVED，释放已增加的引用计数后中止
        if (!prefab || statusAfterLoad === UIStatus.REMOVING || statusAfterLoad === UIStatus.REMOVED) {
            G.main.loadingNode.active = false;
            if (prefab) G.asset.decRefByTag(this.uiConfig.ID);
            this.status = UIStatus.REMOVED;
            console.log("UI实例化中止", this.uiConfig.ID);
            return;
        }
        // 实例化节点
        const n = instantiate(prefab);
        this.node = n;
        this.node.layer = Layers.BitMask.UI_2D;
        n.name = this.uiConfig.ID;
        n.parent = this.getParent();
        n.setPosition(0, 0);

        this.ensureFullWidget(n);

        // 挂载主逻辑（先挂载，动画结束后再调 onShow，确保 Widget 布局完成）
        this.uiScr = (this.node.getComponent(this.uiConfig.ID) || this.node.addComponent(this.uiConfig.ID)) as UIScr;
        this.uiScr.uiClass = this;
        this.node.addComponent(BlockInputEvents);
        this.status = UIStatus.OPENED;
        G.main.loadingNode.active = false;

        this.playOpenAnim(n, () => {
            this.uiScr.onShow();
        });
    }
    ensureFullWidget(n: Node) {
        if (n.getComponent(Widget)) return;
        const w = n.addComponent(Widget);
        w.isAlignTop = w.isAlignBottom = w.isAlignLeft = w.isAlignRight = true;
        w.top = w.bottom = w.left = w.right = 0;
    }
    playOpenAnim(n: Node, onDone?: () => void) {
        if (!this.uiConfig.animBool) {
            onDone?.();
            return;
        }
        n.scaleXY = 0.3;
        tween(n)
            .to(0.1, { scaleXY: 1 })
            .to(0.05, { scaleXY: 1.1 })
            .to(0.05, { scaleXY: 1 })
            .call(() => {
                const w = n.getComponentsInChildren(Widget);
                for (const wid of w) wid.updateAlignment();
                onDone?.();
            })
            .start();
    }
}

// 窗口属性配置
export type UIConfig = {
    /**prefab名*/
    ID: string;
    /**预制所处文件夹名*/
    parfabPath: string;
    /**bundle文件夹名*/
    bundleName: string;
    /**全屏*/
    fullScreen?: boolean;
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
    选择bundle若无则添加 = "",
    appUi = "appUi",
    mahUi = "mahUi",
    mahRes = "mahRes"
}