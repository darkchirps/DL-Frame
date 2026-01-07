/*******************************************************************************
 * 描述:    统一对象池管理器
*******************************************************************************/
class NodePoolMgr {
    static nodePool: Map<string, cc.NodePool> = new Map<string, cc.NodePool>();

    /**获取对象*/
    static getPoolName(p: poolType | string, node?: cc.Node | cc.Prefab): cc.Node {
        if (!this.nodePool.get(p)) {
            this.nodePool.set(p, new cc.NodePool());
        }
        if (this.getPoolSize(p) == 0 && node) {
            return cc.instantiate(node) as cc.Node;
        }
        return this.nodePool.get(p).get();
    }
    /**丢入对象池*/
    static putPool(node: cc.Node, p: poolType | string) {
        if (this.nodePool.get(p)) {
            this.nodePool.get(p).put(node);
        }
    }
    /**清除对象池所有节点 */
    static clearAll() {
        for (let key in this.nodePool) {
            if (Object.prototype.hasOwnProperty.call(this.nodePool, key)) {
                (this.nodePool[key] as cc.NodePool).clear();
            }
        }
    }
    /** 获取指定对象池大小 */
    static getPoolSize(p: poolType | string): number {
        if (!this.nodePool.get(p)) return 0;
        return this.nodePool.get(p).size();
    }
    /**根据预制名创建节点返回*/
    static creatorNode(preName: string): cc.Node {
        if (Pool.getPoolSize(preName) != 0) {
            return Pool.getPoolName(preName);
        } else {
            let pre = common.preArr.get(preName);
            return Pool.getPoolName(preName, pre);
        }
    }
}

export enum poolType {
    gameBoard1 = "gameBoard1",
}

export default class Pool extends NodePoolMgr { }
declare global { var Pool: typeof NodePoolMgr }
globalThis["Pool"] = Pool;