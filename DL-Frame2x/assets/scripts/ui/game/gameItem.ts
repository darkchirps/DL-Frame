import UIMgr from '../../../appDL/Manager/UIMgr';
import { mahMapType } from './game';
const { ccclass, property } = cc._decorator;

export enum mahSize {
    x = 150,
    y = 184,
}
@ccclass
export class gameItem extends cc.Component {

    nodesType: tree_gameItem;

    /**该麻将的信息 处于 层数 行数 列数*/
    itemInfo: mahMapType = null;

    get game() {
        return UIMgr.ui.game.uiScr;
    }
    /**地图盘信息*/
    get mapInfo() {
        return this.game.mapInfo;
    }

    /**初始父节点*/
    nodeParent: cc.Node = null;
    /**该麻将的初始坐标*/
    nodePos: cc.Vec3 = null;
    ndoeZindex: number = 0;
    /**标记 用作模拟消除逻辑中使用 未消除的false，为生成id*/
    signTip: boolean = false;
    /**标记 可点击false*/
    shadowTip: boolean = false;
    /**点击开始位置*/
    clickStartPos: cc.Vec3 = null;
    /**是否正在移动*/
    isMoving: boolean = false;
    /**是否有提示效果*/
    isTip: boolean = false;

    /**块图id*/
    _blockId: number = 0;
    get blockId() {
        return this._blockId;
    }
    set blockId(v: number) {
        this._blockId = v;
        this.setSprite(v);
    }
    start() {

    }
    onEnable() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
    onTouchStart(event: cc.Event.EventTouch) {
        if (this.shadowTip) return console.log("不可点击");
        // 记录触摸起始位置（屏幕坐标）并重置累计位移
        this.clickStartPos = cc.v3(event.getLocation().x, event.getLocation().y);
        if (this.game.clearBlockItems.length != 0) {//已有选中
            if (this.game.clearBlockItems[0].node.name == this.node.name) {//是自己 取消选中
                this.game.clearBlockItems[0].breatheTweenFunc(true);
                this.game.clearBlockItems = [];
                this.clickStartPos = null;
            }
        }
    }
    onTouchMove(event: cc.Event.EventTouch) {
        if (this.clickStartPos == null) return;
        let pos = cc.v3(event.getLocation().x, event.getLocation().y);
        let moved = cc.Vec3.distance(pos, this.clickStartPos);
        if (!this.isMoving && moved > 10) {
            this.isMoving = true;
            // 把节点提升到 layer 以便自由拖动
            this.node.parent = this.game.nodes.layer;
        }
        if (this.isMoving) {
            // 使用屏幕增量作为位移近似（保留原有行为），不改变 Z
            let startPos = this.game.nodes.layer.convertToNodeSpaceAR(pos);
            this.node.position = startPos;
        }
    }
    onTouchEnd(event: cc.Event.EventTouch) {
        if (this.clickStartPos == null) return;
        let brightItems: gameItem[] = Array.from(this.game.blockMap.values()).filter(spr => !spr.shadowTip && spr.blockId == this.blockId && spr.node.name != this.node.name && !spr.signTip);
        const stateFunc = () => {//本次选中
            this.game.clearBlockItems = [this];
            this.node.parent = this.game.nodes.mapNode.getChildByName("layer" + this.itemInfo.layer.toString());
            this.node.position = this.nodePos;
            this.node.zIndex = this.ndoeZindex;
            this.breatheTweenFunc();
        }
        let nodeTo: gameItem = null;
        if (this.isMoving) {//移动
            for (const spr of brightItems) {
                if (X.isBoxIntersect(this.node, spr.node)) { nodeTo = spr; break; }
            }
        }
        if (nodeTo == null) {
            if (this.game.clearBlockItems.length != 0) {//已有选中
                if (this.game.clearBlockItems[0].blockId == this.blockId) {//已有选中id与这次拖动id相同，则消除
                    let beforeItems = this.game.clearBlockItems[0];
                    this.game.clearBlockItems = [this, beforeItems];
                } else {
                    this.game.clearBlockItems[0].breatheTweenFunc(true);//取消上一个选中
                    stateFunc();
                }
            } else {
                stateFunc();
            }
        } else {
            this.game.clearBlockItems[0]?.breatheTweenFunc(true);
            this.game.clearBlockItems = [this, nodeTo];
        }
        this.isMoving = false;
        this.clickStartPos = null;
    }
    //初始化
    init(info: { layer: number, wNum: number, hNum: number }) {
        this.itemInfo = info;
        this.nodeParent = this.node.parent;
        const parentUt = this.node.parent;
        const parentW = parentUt.width;
        const parentH = parentUt.height;
        let mahWidth = parentW / (this.mapInfo.wNum + 1) * 2; // 麻将块宽度
        let mahHeight = mahWidth / mahSize.x * mahSize.y; // 麻将块高度

        if (mahWidth > mahSize.x) mahWidth = mahSize.x;
        if (mahHeight > mahSize.y) mahHeight = mahSize.y;

        let scale = mahWidth / mahSize.x;
        if (((this.mapInfo.wNum + 1) * mahWidth) / ((this.mapInfo.hNum + 1) * mahHeight) < (parentW / parentH)) {
            mahHeight = parentH / (this.mapInfo.hNum + 1) * 2;//麻将块高度  
            mahWidth = mahHeight / mahSize.y * mahSize.x;//麻将块宽度 
            scale = mahHeight / mahSize.y;
        }
        this.node.setContentSize(mahWidth, mahHeight);

        // 计算格子中心位置
        const posWidth = this.node.width / 2;
        const posHeight = this.node.height / 2;
        const centerOffsetX = (this.mapInfo.wNum - 1) * posWidth / 2;
        const centerOffsetY = (this.mapInfo.hNum - 1) * posHeight / 2;
        const posx = this.itemInfo.wNum * posWidth - centerOffsetX;
        const posy = centerOffsetY - this.itemInfo.hNum * posHeight;
        this.node.position = cc.v3(posx, posy);

        this.nodePos = this.node.position.clone();
        this.node.zIndex = this.itemInfo.wNum * 10 + this.itemInfo.hNum * 10;
        this.ndoeZindex = this.node.zIndex;
        this.node.children.forEach(node => node.scale = scale);
        this.showShadow();
    }
    /**赋图*/
    setSprite(id: number) {
        this.nodes.icon.sprite.spriteFrame = myG.spriteArr.get(`icon${id}`);
    }
    /**显示阴影*/
    showShadow() {
        if (this.signTip) return;
        let state = this.game.checkHorizontalLock(this.itemInfo);
        let stateTo = this.game.checkTopLayerLock(this.itemInfo);
        this.shadowTip = (state[0] && state[1] || stateTo);
        this.nodes.shadow.active = this.shadowTip;
    }
    breatheTween: cc.Tween = null;
    /**选中呼吸效果*/
    breatheTweenFunc(closeBool: boolean = false) {
        if (this.breatheTween != null || closeBool) {
            this.breatheTween?.stop();
            this.breatheTween = null;
            this.node.scale = 1;
        }
        if (closeBool) return;
        this.breatheTween = X.breatheEffect(this.node);
    }
    tipTween: cc.Tween = null;
    /**重置节点 用于游戏消除使用*/
    resetNodeBack() {
        this.resetBase();
        this.node.parent = this.nodeParent;
        this.node.position = this.nodePos;
        this.node.zIndex = 0;
        this.node.active = false;
        this.node.scale = 1;
    }
    /**重置节点 用于游戏结束回收复用节点时使用*/
    resetNode() {
        this.resetBase();
        this.node.setContentSize(mahSize.x, mahSize.y);
        this.node.position = cc.v3(0, 0);
        this.node.parent = null;
        this.nodes.icon.sprite.spriteFrame = null;
        this.node.scale = 1;
        this.node.children.forEach(node => node.scale = 1);
        this.shadowTip = false;
        this.signTip = false;
        this.node.getComponent(gameItem).destroy();
    }
    resetBase() {
        this.tipTween?.stop();
        this.tipTween = null;
        this.breatheTween?.stop();
        this.breatheTween = null;
        this.node.opacity = 255;
        this.isMoving = false;
        this.isTip = false;
        this.nodes.tip.active = false;
        this.clickStartPos = null;
    }
    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
}