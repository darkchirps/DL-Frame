/*******************************************************************************
 * 描述:    本项目所需枚举
*******************************************************************************/

/** 对象池类型（扩展 appDL 的 poolType） */
export enum dovePoolType {
    enemy      = "dove_enemy",
    projectile = "dove_projectile",
    expOrb     = "dove_expOrb",
}

/** 武器类型 */
export enum weaponType {
    projectile = "projectile",  // 投射型
    aoe        = "aoe",         // 范围型
    orbit      = "orbit",       // 轨道型
}

/** 敌人类型 */
export enum enemyType {
    normal = "normal",   // 普通敌人
    fast   = "fast",     // 快速敌人
    tank   = "tank",     // 坦克敌人
    boss   = "boss",     // Boss
}

/** 游戏状态 */
export enum gameState {
    idle    = "idle",
    running = "running",
    paused  = "paused",
    over    = "over",
}

/** 缓存 Key（dove 项目专属） */
export enum doveCKey {
    metaData = "dove_metaData",
}
