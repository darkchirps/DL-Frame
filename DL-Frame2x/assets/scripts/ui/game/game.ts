import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { UIClass } from '../../../appDL/Manager/UIClass';
import { gameItem } from './gameItem';
import { gamePropMgr } from './gamePropMgr';
const { ccclass, property } = cc._decorator;
/**块或地图配置*/
export class mahMapType {
    wNum: number;
    hNum: number;
    layer: number;
}
@ccclass
export class game extends UIScr {
    nodesType: tree_game;

    /**地图源数据*/
    map: string[] = [];
    /**地图数据解析后数组*/
    mapData: number[][] = [];
    /**地图解析后的层数 行数 列数*/
    mapInfo: mahMapType = null;
    /**麻将方块map*/
    blockMap: Map<string, gameItem> = new Map();
    /**消除路线*/
    clearHaveItems: Array<gameItem> = [];
    /**是否可以重玩*/
    isReplay: boolean = false;

    _clearBlockItems: Array<gameItem> = [];
    /**存选中的麻将 发生消除*/
    get clearBlockItems() {
        return this._clearBlockItems;
    }
    set clearBlockItems(v: Array<gameItem>) {
        this._clearBlockItems = v;
        if (v.length > 1) this.checkClear();
    }

    mahPrefab: cc.Prefab = null;

    /**记录消除麻将*/
    clearMahjong: Array<gameItem> = [];

    gamePropMgr: gamePropMgr;

    async start() {
        this.gamePropMgr = new gamePropMgr(this);
        this.gamePropMgr.init();
        this.init();
        this.btnManager();
    }
    /**初始化*/
    async init() {
        this.nodes.layer.zIndex = 100;
        this.mahPrefab = await this.getPrefab("ui", "game/gameItem");
        let info = await this.getText("resources", "map/pos_" + myC.levelId);
        this.map = info.text.split('\n').filter(line => line.trim() !== '');
        this.gameFlowFunc();
    }
    /**游戏开始前流程*/
    gameFlowFunc() {
        this.mapData = this.map.map(line => { return JSON.parse(line) }).filter(data => data !== null);
        this.startFlowFunc();
    }
    /**正式开始流程*/
    startFlowFunc() {
        let min1 = Math.min(...this.mapData[1]);
        let min2 = Math.min(...this.mapData[2]);
        let max1 = Math.max(...this.mapData[1]);
        let max2 = Math.max(...this.mapData[2]);
        this.mapInfo = { layer: (new Set(this.mapData[0])).size, wNum: max1 - min1 + 1, hNum: max2 - min2 + 1 };
        this.initLayerMahjong();
    }
    /**触发消除*/
    checkClear() {
        let items = this.clearBlockItems;
        this.clearBlockItems = [];
        this.clearTween(items, (pos) => {
            items.forEach(spr => {
                this.clearMahjong.push(spr);
                spr.signTip = true;
                cc.tween(spr.node)
                    .to(0.08, { opacity: 0, position: pos })
                    .call(() => spr.resetNodeBack())
                    .start();
            });
            this.blockMap.forEach((spr) => {
                if (!spr.signTip) spr.showShadow();
                if (spr.node.active) spr.breatheTweenFunc(true);
            });
            this.gamePropMgr.propUsing = false;
            this.scheduleOnce(() => this.checkGameOver(), 0.1)
        });
    }
    /**消除前的动画*/
    clearTween(cItems: gameItem[], callback = null) {
        const [item1, item2] = cItems;
        item1.node.parent = this.nodes.layer;
        item2.node.parent = this.nodes.layer;

        const centerX = (item1.itemInfo.wNum + item2.itemInfo.wNum) / 2;
        const width = item1.node.getContentSize().width;
        const moveX1 = item1.itemInfo.wNum > centerX ? width : -width;
        const moveX2 = item2.itemInfo.wNum > centerX ? width : -width;
        const startPos1 = item1.node.position;
        const startPos2 = item2.node.position;

        const centerY = (item1.node.y + item2.node.y) / 2;

        const adjustedMoveX1 = item1.itemInfo.wNum === item2.itemInfo.wNum ? (startPos1.y > startPos2.y ? width : -width) : moveX1;
        const adjustedMoveX2 = item1.itemInfo.wNum === item2.itemInfo.wNum ? (startPos1.y > startPos2.y ? -width : width) : moveX2;

        const endPos1 = cc.v3(startPos1.x + adjustedMoveX1, centerY);
        const endPos2 = cc.v3(startPos2.x + adjustedMoveX2, centerY);

        const centerPos1 = cc.v3((endPos1.x + startPos1.x) / 2, (endPos1.y + startPos1.y) / 2);
        const centerPos2 = cc.v3((endPos2.x + startPos2.x) / 2, (endPos2.y + startPos2.y) / 2);

        const endPosTo = cc.v3((startPos1.x + startPos2.x) / 2, centerY);
        G.effectMgr.bezierTween(item1.node, 0.12, startPos1, centerPos1, endPos1)
            .start();
        G.effectMgr.bezierTween(item2.node, 0.12, startPos2, centerPos2, endPos2)
            .call(() => callback && callback(endPosTo))
            .start();
    }
    /**检测游戏结束*/
    checkGameOver() {
        let arr = this.getHaveClick();
        if (arr.haveSprs.length === 0) {//过关
            myC.levelId += 1;
            this.scheduleOnce(() => UIMgr.ui.home.show(), 1);
        } else {
            let blockIds = arr.shadowSprs.map(v => v.blockId);
            let matchs = G.arrayMgr.countElementPairsTo(blockIds);
            if (matchs.totalPairs == 0) { //无可匹配的
                if (arr.shadowSprs.length == 1) {//如果只有一个可点击的 自动消除匹配
                    let matchSpr: gameItem = null;
                    arr.haveSprs.forEach((spr) => {
                        if (spr.blockId == arr.shadowSprs[0].blockId && spr.itemInfo != arr.shadowSprs[0].itemInfo) matchSpr = spr;
                    })
                    this.clearBlockItems = [arr.shadowSprs[0], matchSpr];
                } else {//多个 但是没有消除了的
                    Tip.show("无可消除的");
                }
            }
        }
    }
    /**获取当前存在的和当前可点击的*/
    getHaveClick(): {
        /**当前显示的所有块*/
        haveSprs: gameItem[],
        /**当前可点击的所有块*/
        shadowSprs: gameItem[]
    } {
        let haveSpr: gameItem[] = [];//当前存在的
        let shadowSpr: gameItem[] = [];//可点击的
        this.blockMap.forEach((spr, key) => {
            if (spr.node.active && !spr.signTip) haveSpr.push(spr);
            if (spr.node.active && !spr.shadowTip) shadowSpr.push(spr);
        });
        return { haveSprs: haveSpr, shadowSprs: shadowSpr }
    }
    /**初始化每层麻将*/
    initLayerMahjong() {
        let min1 = Math.min(...this.mapData[1]);
        let min2 = Math.min(...this.mapData[2]);
        console.log("本关麻将长度：" + this.mapData[0].length);
        for (let lay = 0; lay < this.mapData[0].length; lay++) {
            let idx = this.mapData[1][lay];
            let idy = this.mapData[2][lay];
            this.blockMap.set(`mahBlock-${idx - min1}-${idy - min2}-${this.mapData[0][lay]}`, new gameItem());
        }
        let idx = 0;
        this.blockMap.forEach(async (spr, key) => {
            let arr = key.split('-').map(v => parseInt(v));
            this.creatorMahjong(arr[1], arr[2], arr[3]);
            idx++;
            if (idx >= this.mapData[0].length) {
                this.makeMahjongIdRule();
                this.startEffect();
            }
        })
    }
    /**创建麻将id规则*/
    makeMahjongIdRule() {
        let rand = this.randowIconKind(this.mapData[0].length / 2);
        let arr = G.randomMgr.randomRange(1, myG.spriteArr.size, rand);
        const totalNeeded = this.mapData[0].length / 2;
        if (rand < totalNeeded) {
            const needed = totalNeeded - rand;
            const baseCount = Math.floor(needed / arr.length);
            const remainder = needed % arr.length;
            for (let i = 0; i < baseCount; i++) {// 批量添加基础倍数
                arr.push(...arr.slice(0, arr.length));
            }
            if (remainder > 0) {// 添加余数部分
                const randomIndices = G.randomMgr.randomRange(0, arr.length - 1, remainder);
                arr.push(...randomIndices.map(i => arr[i]));
            }
        }
        let arrItem = ((arr.concat(arr))).sort((a, b) => a - b);//本局麻将id 从小到大排序
        this.clearBlockAll();
        this.clearHaveItems.forEach((spr, idx) => spr.blockId = arrItem[idx]);
    }
    /**创造消除线*/
    clearBlockAll() {
        this.clearHaveItems = [];
        for (let i = 0; i < this.mapData[0].length / 2; i++) {
            let brightItems: Array<gameItem> = Array.from(this.blockMap.values()).filter(spr => !spr.signTip && !spr.shadowTip);
            if (brightItems.length == 0) continue;
            this.clearHaveItems.push(brightItems[brightItems.length - 1]);
            this.clearHaveItems.push(brightItems[brightItems.length - 2]);
            this.clearHaveItems.forEach(spr => spr.signTip = true);
            this.blockMap.forEach(spr => { if (!spr.signTip) spr.showShadow(); })
        }
        //还原标记
        this.clearHaveItems.forEach(spr => spr.signTip = false);
        //赋值置灰
        this.clearHaveItems.forEach(spr => spr.showShadow());
    }
    /**返回当前配置所需种类个数*/
    randowIconKind(len: number): number {
        if (len >= myG.spriteArr.size) return myG.spriteArr.size;
        return G.randomMgr.randomInt(Math.trunc(len / 4) * 3, len);
    }
    /** 进场动效 */
    startEffect() {
        this.isReplay = true;
        const offsetX = 500;
        // 根据位置将节点分为左右两组
        const midPoint = (this.mapInfo.wNum - 1) / 2;

        let leftItems: Array<gameItem> = [];
        let rightItems: Array<gameItem> = [];
        this.blockMap.forEach((spr) => {
            spr.nodes.shadow.opacity = 0;
            if (spr.itemInfo.wNum <= midPoint) {
                leftItems.push(spr);
            } else {
                rightItems.push(spr);
            }
        })
        const layerEnterEffect = (spr: gameItem, layer: number, posX: number) => {
            cc.tween(spr.node)
                .delay(layer * 0.2)
                .by(0.2, { position: cc.v3(posX, 0) })
                .start();
            cc.tween(spr.nodes.shadow)
                .delay(layer * 0.2 + 0.2)
                .to(0.2, { opacity: 255 })
                .start();
        }
        // 播放左侧节点动画
        leftItems.forEach(spr => {
            spr.node.x -= offsetX; // 初始位置偏移
            spr.node.opacity = 255;
            layerEnterEffect(spr, spr.itemInfo.layer, offsetX);
        });
        // 播放右侧节点动画
        rightItems.forEach(spr => {
            spr.node.x += offsetX; // 初始位置偏移
            spr.node.opacity = 255;
            layerEnterEffect(spr, spr.itemInfo.layer, -offsetX);
        });
        this.scheduleOnce(() => this.isReplay = false, this.mapInfo.layer * 0.2)
    }
    /**创建麻将方块*/
    creatorMahjong(idx: number, idy: number, layer: number = 0) {
        let node: cc.Node = null;
        if (Pool.getPoolSize("gameItem") != 0) {
            node = Pool.getPoolName("gameItem");
        } else {
            node = Pool.getPoolName("gameItem", this.mahPrefab);
        }
        node.active = true;
        node.name = `mahBlock-${idx}-${idy}-${layer}`;
        node.parent = this.getParent(layer);
        node.opacity = 0;
        let info: { layer: number, wNum: number, hNum: number } = { layer: layer, wNum: idx, hNum: idy };
        node.addComponent(gameItem).init(info);
        this.blockMap.set(node.name, node.getComponent(gameItem));
    }
    /**获取父节点层*/
    getParent(layer: number): cc.Node {
        let node: cc.Node = null;
        if (this.nodes.mapNode.getChildByName(`layer${layer}`)) {
            node = this.nodes.mapNode.getChildByName(`layer${layer}`);
        } else {
            node = cc.instantiate(this.nodes.layer);
            node.parent = this.nodes.mapNode;
            node.name = `layer${layer}`;
            node.zIndex = layer * 5;
            node.setPosition(layer * -9, layer * 10);
        }
        let skewingX = this.mapInfo.layer * 20;
        let skewingY = this.mapInfo.layer * 20;
        node.setContentSize(this.nodes.mapNode.width - skewingX, this.nodes.mapNode.height - skewingY);
        return node;
    }
    /**检测左右是否有麻将*/
    checkHorizontalLock(info: mahMapType) {
        let posLeft = [
            new cc.Vec3(info.wNum - 2, info.hNum - 1, info.layer),
            new cc.Vec3(info.wNum - 2, info.hNum, info.layer),
            new cc.Vec3(info.wNum - 2, info.hNum + 1, info.layer)
        ];
        let posRight = [
            new cc.Vec3(info.wNum + 2, info.hNum - 1, info.layer),
            new cc.Vec3(info.wNum + 2, info.hNum, info.layer),
            new cc.Vec3(info.wNum + 2, info.hNum + 1, info.layer)
        ];
        let leftLock = false;
        let rightLock = false;
        posLeft.forEach(pos => {
            if (this.blockMap.has(`mahBlock-${pos.x}-${pos.y}-${pos.z}`) && !this.blockMap.get(`mahBlock-${pos.x}-${pos.y}-${pos.z}`).signTip) leftLock = true;
        });
        posRight.forEach(pos => {
            if (this.blockMap.has(`mahBlock-${pos.x}-${pos.y}-${pos.z}`) && !this.blockMap.get(`mahBlock-${pos.x}-${pos.y}-${pos.z}`).signTip) rightLock = true;
        });
        return [leftLock, rightLock];
    }
    /**检测上层是否有麻将*/
    checkTopLayerLock(info: mahMapType) {
        // 定义上层检查的相对位置偏移
        const offsets = [
            { x: 0, y: 0 },    // 正上方
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: -1 },  // 左上
            { x: -1, y: 0 },   // 左
            { x: -1, y: 1 },   // 左下
            { x: 1, y: -1 },   // 右上
            { x: 1, y: 0 },    // 右
            { x: 1, y: 1 }     // 右下
        ];
        // 从当前层+1开始到顶层
        for (let layer = info.layer + 1; layer < this.mapInfo.layer; layer++) {
            for (const offset of offsets) {
                const x = info.wNum + offset.x;
                const y = info.hNum + offset.y;
                const key = `mahBlock-${x}-${y}-${layer}`;
                // 检查是否存在未标记的方块
                const block = this.blockMap.get(key);
                if (block && !block.signTip) return true; // 发现锁定方块，立即返回
            }
        }
        return false; // 未发现锁定方块
    }
    //按钮管理
    btnManager() {
        this.nodes.replayBtn.click(() => {
            if (this.isReplay) return;
            this.blockMap.forEach((block) => {
                block.node.active = false;
                block.resetNode();
                Pool.putPool(block.node, "gameItem");
            });
            this.scheduleOnce(() => {
                this.blockMap = new Map();
                this.gameFlowFunc();
            })
        })
        this.nodes.backBtn.click(() => {
            this.blockMap.forEach((block) => {
                block.resetNode();
                Pool.putPool(block.node, "gameItem");
            });
            UIMgr.ui.home.show();
        })
    }
}
UIMgr.register(new UIClass({
    ID: "game",
    parfabPath: "game",
    group: "core",
    fullScreen: true
}));