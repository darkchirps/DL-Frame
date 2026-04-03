/*******************************************************************************
 * 描述:    本项目相关信息入口初始脚本
*******************************************************************************/
import G from "../../appDL/General/General";

class DoveGeneral extends G {
    /** 当前局运行时数据（内存级，不持久化） */
    public static runData: any = null;
}

export default class doveG extends DoveGeneral {}
declare global { var doveG: typeof DoveGeneral }
globalThis["doveG"] = doveG;
