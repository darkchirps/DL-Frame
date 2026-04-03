/*******************************************************************************
 * 描述:    本项目所需缓存信息
*******************************************************************************/

import C from "../../appDL/Manager/CacheMgr";
import { doveCKey } from "./doveEnum";

class DoveCache extends C {
    static signKey = "dove";

    /** 金币总量快捷属性 */
    static get gold(): number {
        return this.get(doveCKey.metaData, "gold") ?? 0;
    }
    static set gold(v: number) {
        this.set(doveCKey.metaData, v, "gold");
    }

    /** 局外强化等级表快捷属性 */
    static get metaUpgrades(): Record<string, number> {
        return this.get(doveCKey.metaData, "upgrades") ?? {};
    }
    static set metaUpgrades(v: Record<string, number>) {
        this.set(doveCKey.metaData, v, "upgrades");
    }
}

export default class doveC extends DoveCache {}
declare global { var doveC: typeof DoveCache }
globalThis["doveC"] = doveC;
