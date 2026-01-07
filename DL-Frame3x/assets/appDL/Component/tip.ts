/*******************************************************************************
 * 描述:    提示弹窗
*******************************************************************************/
import { NodePool, Prefab, instantiate, tween, v3, Vec3, Node, _decorator, Label } from "cc";

const { ccclass } = _decorator;

// 提示系统常量配置
const TIP_CONFIG = {
    HEIGHT_PER_TIP: 50,      // 每个提示的高度间隔
    BASE_Y_POS: 0,           // 基础Y轴位置
    FADE_DURATION: 0.5,      // 消失动画时长
    DISPLAY_DURATION: 1.0,   // 显示持续时间
    SCALE_FACTOR: 1,         // 初始缩放
    MOVE_DISTANCE: 300        // 移动距离
};

@ccclass('TipSystem')
class TipSystem {
    private static _nextTipId = 0;                  // 下一个提示ID
    private static _activeTips = new Map<string, {
        id: number;
        node: Node;
        tween: any;
    }>();                                           // 当前活动的提示
    private static _nodePool: NodePool = new NodePool();
    private static _prefabPromise: Promise<Prefab> | null = null;

    static async show(content: string) {
        if (!content) {
            console.warn('Tip content cannot be empty');
            return;
        }
        try {
            // 如果已有相同内容的提示，先移除
            if (this._activeTips.has(content)) {
                const existingTip = this._activeTips.get(content)!;
                this._removeTip(existingTip.node, existingTip.tween);
            }
            const node = await this._getTipNode();
            const tipId = this._nextTipId++;
            // 设置节点内容
            this._setupTipNode(node, content, tipId);
            // 创建动画
            const newTween = this._createTipAnimation(node, tipId, content);
            // 存储新提示
            this._activeTips.set(content, { id: tipId, node, tween: newTween });

        } catch (error) {
            console.error('Failed to show tip:', error);
        }
    }

    private static async _getTipNode(): Promise<Node> {
        // 从对象池获取节点
        if (this._nodePool.size() > 0) {
            return this._nodePool.get();
        }
        // 确保只加载一次预制体
        if (!this._prefabPromise) {
            this._prefabPromise = G.asset.getPrefab("ui", "common/tip", "SYSTEM");
        }
        const prefab = await this._prefabPromise;
        return instantiate(prefab);
    }

    private static _setupTipNode(node: Node, content: string, tipId: number) {
        const canvasTip = G.main.other;
        if (!canvasTip) {
            throw new Error('Tip container not found');
        }
        node.parent = canvasTip;
        node.setPosition(0, TIP_CONFIG.BASE_Y_POS);
        node.scaleXY = TIP_CONFIG.SCALE_FACTOR;
        // 在节点上存储内容，用于回收时清理
        (node as any).tipContent = content;
        const contentNode = node.getChildByName("tipLab");
        if (contentNode) {
            contentNode.getComponent(Label)!.string = content;
        }
    }

    private static _createTipAnimation(node: Node, tipId: number, content: string) {
        return tween(node)
            .delay(TIP_CONFIG.DISPLAY_DURATION)
            .by(TIP_CONFIG.FADE_DURATION, {
                position: v3(0, TIP_CONFIG.MOVE_DISTANCE, 0),
                scaleXY: -TIP_CONFIG.SCALE_FACTOR
            }, { easing: "quintIn" })
            .call(() => this._recycleTipNode(node, content))
            .start();
    }

    private static _removeTip(node: Node, tweenObj: any) {
        // 停止动画
        tweenObj.stop();
        // 立即回收节点
        this._recycleTipNode(node, (node as any).tipContent, true);
    }

    private static _recycleTipNode(node: Node, content: string, immediate = false) {
        // 从活动提示中移除
        if (this._activeTips.get(content)?.node === node) {
            this._activeTips.delete(content);
        }
        // 从父节点移除
        if (node.parent) {
            node.removeFromParent();
        }
        // 重置节点状态
        node.scaleXY = TIP_CONFIG.SCALE_FACTOR;
        node.position = Vec3.ZERO;
        // 清理自定义属性
        delete (node as any).tipContent;
        // 放回对象池
        this._nodePool.put(node);
    }
}

// 全局导出
export const Tip = TipSystem;
declare global {
    var Tip: typeof TipSystem;
}
globalThis.Tip = TipSystem;