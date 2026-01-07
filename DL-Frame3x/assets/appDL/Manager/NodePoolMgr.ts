/*******************************************************************************
 * 描述:    统一对象池管理器
*******************************************************************************/
import { Prefab, NodePool, instantiate, Node } from "cc";

class NodePoolMgr {
    private static nodePool: Map<string, NodePool> = new Map<string, NodePool>();

    /**获取对象*/
    static getPoolName(p: poolType, node?: Node | Prefab): Node {
        if (!this.nodePool.get(p)) {
            this.nodePool.set(p, new NodePool());
        }
        if (this.getPoolSize(p) == 0 && node) {
            return instantiate(node) as Node;
        }
        return this.nodePool.get(p).get();
    }
    /**丢入对象池*/
    static putPool(node: Node, p: poolType) {
        let name = p || node.name;
        if (this.nodePool.get(name)) {
            this.nodePool.get(name).put(node);
        }
    }
    /**清除对象池所有节点 */
    static clearAll() {
        for (let key in this.nodePool) {
            if (Object.prototype.hasOwnProperty.call(this.nodePool, key)) {
                (this.nodePool[key] as NodePool).clear();
            }
        }
    }
    /** 获取指定对象池大小 */
    static getPoolSize(p: poolType): number {
        if (!this.nodePool.get(p)) return 0;
        return this.nodePool.get(p).size();
    }
}

export enum poolType {
    mahBlock = "mahBlock",
}

/** 节点池管理器 */
export default class Pool extends NodePoolMgr { }
declare global { var Pool: typeof NodePoolMgr }
globalThis["Pool"] = Pool;