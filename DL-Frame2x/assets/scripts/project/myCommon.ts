/*******************************************************************************
 * 描述:    本项目通用方法
*******************************************************************************/
//项目通用
class myCommon {
    
}

/**项目通用*/
export default class common extends myCommon { }
declare global { var common: typeof myCommon }
globalThis["common"] = common;
