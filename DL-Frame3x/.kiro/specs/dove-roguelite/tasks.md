# 实现计划：dove-roguelite

## 概览

基于 appDL 框架（Cocos Creator 3.x）实现 Roguelite 游戏。所有扩展在 `assets/doveScr/project/` 中完成，功能脚本在 `assets/doveScr/ui/` 中按模块分子目录存放。统一使用 `doveG`（非 `G`）和 `doveC`（非 `C`）访问框架能力。

## 任务列表

- [x] 1. 实现副框架（doveScr/project）
  - [x] 1.1 实现 doveCommon.ts — Bundle 名称常量
    - 声明 `BUNDLE_UI = "doveUi"` 和 `BUNDLE_RES = "doveRes"` 两个字符串常量并导出
    - _需求：1.1_

  - [x] 1.2 实现 doveEnum.ts — 项目专属枚举
    - 声明 `dovePoolType`（enemy / projectile / expOrb）
    - 声明 `weaponType`（projectile / aoe / orbit）
    - 声明 `enemyType`（normal / fast / tank / boss）
    - 声明 `gameState`（idle / running / paused / over）
    - 声明 `doveCKey`（metaData）
    - _需求：1.1_

  - [x] 1.3 实现 doveGeneral.ts — 全局入口
    - 继承 appDL 的 `G`（`assets/appDL/General/General.ts`）
    - 扩展静态字段 `runData: RunData`
    - 导出 `doveG` 并挂载到 `globalThis["doveG"]`
    - _需求：1.1_

  - [x] 1.4 实现 doveCache.ts — 缓存入口
    - 继承 appDL 的 `C`（`assets/appDL/Manager/CacheMgr.ts`）
    - 设置 `signKey = "dove"`
    - 扩展快捷属性 `gold`（get/set）和 `metaUpgrades`（get/set），均通过 `doveCKey.metaData` 读写
    - 导出 `doveC` 并挂载到 `globalThis["doveC"]`
    - _需求：1.1, 12.1_


- [ ] 2. 创建配置表 JSON（doveRes/config/config.json）
  - [ ] 2.1 创建 config.json 骨架结构
    - 按 `ConfigTable` 接口创建 JSON 文件，包含 `hero`、`enemy`、`weapon`、`upgrade`、`wave`、`stage` 六个顶层字段
    - `hero`：至少 2 个角色（id、name、maxHp、speed、pickupRadius、initWeaponId）
    - `enemy`：4 种敌人（normal / fast / tank / boss），含 expOrbCount 范围
    - `weapon`：至少 3 种武器（投射型、范围型、轨道型），含 cooldown、damage、maxLevel 及各自专属字段
    - `upgrade`：至少 5 种永久强化项（hp_up / spd_up / exp_up / dmg_up / cd_down），含 costPerLevel 数组
    - `wave`：至少 3 条波次配置（time / enemyType / count / spawnInterval）
    - `stage`：duration / maxEnemyCount / maxWeaponSlots / decorDensity / goldBaseReward / goldKillCoeff
    - 文件路径：`assets/doveRes/config/config.json`
    - _需求：1.2, 1.3_


- [ ] 3. 实现游戏主系统（doveGame.ts）
  - [ ] 3.1 创建 `assets/doveScr/ui/game/doveGame.ts`，定义 `RunData` 和 `MetaData` 接口
    - `RunData`：heroId / level / exp / expToNext / hp / maxHp / speed / elapsedTime / killCount / goldEarned / equippedWeaponIds
    - `MetaData`：gold / upgrades
    - _需求：12.3_

  - [ ] 3.2 实现 `doveGame` 组件的 `registerUIs()` 方法
    - 通过 `UIMgr.register` 注册 doveGameHUD / doveLevelUpPanel / doveResultPanel / doveMetaShop 四个 UI
    - 使用 `BUNDLE_UI` 常量作为 bundleName
    - _需求：1.4_

  - [ ] 3.3 实现 `loadConfig()` 方法
    - 通过 `doveG.asset` 加载 `BUNDLE_RES` 中的 `config/config.json`
    - 加载成功后注入 `doveG.config`
    - 加载失败时使用内置默认配置并输出 `console.warn`
    - _需求：1.2, 1.3_

  - [ ] 3.4 实现 `startGame(heroId)` 方法
    - 按流程：loadConfig → registerUIs → 初始化 RunData → 初始化子系统 → show HUD → 播放 BGM → state = running
    - _需求：1.2, 1.4, 2.3_

  - [ ] 3.5 实现 `pauseGame()` / `resumeGame()` 方法
    - 切换 `state` 为 paused / running
    - _需求：8.6_

  - [ ] 3.6 实现 `onPlayerDead()` 和 `onStageClear()` 方法
    - state = over，计算金币奖励（base + killCount × coeff），`doveC.gold += goldEarned`
    - 打开 doveResultPanel 并传入 ResultData
    - _需求：3.6, 9.1, 9.3_


- [ ] 4. 实现玩家角色（dovePlayer.ts + 虚拟摇杆）
  - [ ] 4.1 创建 `assets/doveScr/ui/game/dovePlayer.ts`，实现基础属性初始化
    - `init(heroId)` 从 `doveG.config.hero[heroId]` 读取 maxHp / speed / pickupRadius / initWeaponId
    - 初始化 `hp = maxHp`
    - _需求：3.2_

  - [ ] 4.2 实现 `setJoystickDir(dir: Vec2)` 和 `update(dt)` 移动逻辑
    - 每帧按 `speed × dt × dir`（归一化）更新节点位置
    - 松开摇杆（dir 为零向量）时在 0.1 秒内线性减速至停止
    - _需求：3.2, 3.3_

  - [ ]* 4.3 为 dovePlayer 移动位移编写属性测试
    - **属性 1：Player 移动位移正确性**
    - 使用 fast-check 生成随机方向向量和 dt，验证 `calcMoveDelta(dir, speed, dt).length()` 与 `speed × dt` 误差 < 0.001
    - **验证：需求 3.2**

  - [ ] 4.4 实现 `getFacingDir(enemies: Node[]): Vec2`
    - 遍历 enemies 找到距离最近的节点，返回指向该节点的单位向量
    - enemies 为空时返回默认朝向（Vec2.RIGHT）
    - _需求：3.4_

  - [ ]* 4.5 为 getFacingDir 编写属性测试
    - **属性 2：Player 始终面向最近 Enemy**
    - 使用 fast-check 生成随机 Enemy 位置列表，验证返回方向与暴力枚举结果一致
    - **验证：需求 3.4**

  - [ ] 4.6 实现 `takeDamage(dmg: number)` 受击逻辑
    - hp -= dmg，hp <= 0 时调用 `doveGame.onPlayerDead()`
    - 触发 `doveG.mp3.hit.playEffect()` 和 HUD 飘字
    - _需求：3.6, 11.2_

  - [ ] 4.7 在 doveGame 场景中集成虚拟摇杆
    - 摇杆区域覆盖屏幕左半侧，监听 touch 事件，将方向向量传入 `dovePlayer.setJoystickDir()`
    - _需求：3.1_


- [ ] 5. 实现敌人系统（doveEnemy.ts + doveEnemyMgr.ts）
  - [ ] 5.1 创建 `assets/doveScr/ui/game/doveEnemy.ts`，实现 `init(cfg: EnemyConfig)` 和 `takeDamage(dmg)`
    - 初始化 hp / maxHp / speed / damage / contactCooldown
    - hp <= 0 时通知 doveEnemyMgr 触发死亡回调
    - _需求：4.4, 4.5_

  - [ ] 5.2 实现 doveEnemy 的 `update(dt)` — AI 追踪与碰撞检测
    - 每帧向 Player 当前位置移动（speed × dt × 方向）
    - 与 Player 碰撞时造成 damage，进入 0.5 秒冷却（contactCooldown 计时）
    - _需求：4.4, 4.5_

  - [ ]* 5.3 为 doveEnemy 移动编写属性测试
    - **属性 5：Enemy 每帧靠近 Player**
    - 使用 fast-check 生成随机 Enemy/Player 位置（不重合），验证一帧 update 后距离严格减小
    - **验证：需求 4.4**

  - [ ] 5.4 创建 `assets/doveScr/ui/game/doveEnemyMgr.ts`，实现 `startSpawning()` 和 `update(dt)`
    - 维护 `spawnTimer`，每隔 `spawnInterval` 秒触发一次生成检查
    - 活跃 Enemy 数量 >= `maxEnemyCount` 时跳过生成
    - _需求：4.2, 4.7_

  - [ ]* 5.5 为生成间隔编写属性测试
    - **属性 4：Enemy 生成间隔符合配置**
    - 使用 fast-check 生成随机 spawnInterval 和模拟时间 T，验证触发次数等于 `floor(T / spawnInterval)` ±1
    - **验证：需求 4.2**

  - [ ]* 5.6 为 maxEnemyCount 上限编写属性测试
    - **属性 7：超过 maxEnemyCount 时不生成新 Enemy**
    - 使用 fast-check 生成随机 maxEnemyCount，验证活跃数量 >= 上限时触发生成检查后数量不增加
    - **验证：需求 4.7**

  - [ ] 5.7 实现 `spawnWave(wave)` — 在 Player 视口外随机位置生成敌人
    - 通过 `Pool.getPoolName(dovePoolType.enemy, enemyPrefab)` 取出节点
    - 生成位置距 Player 中心距离 > 视口对角线半径
    - _需求：4.1_

  - [ ]* 5.8 为生成位置编写属性测试
    - **属性 3：Enemy 生成位置在视口外**
    - 使用 fast-check 生成随机 Player 位置和视口尺寸，验证所有生成位置在视口外
    - **验证：需求 4.1**

  - [ ] 5.9 实现 `onEnemyDead(enemyNode, pos)` — 掉落 ExpOrb 并归还 Pool
    - 按 `expOrbCount [min, max]` 随机生成 ExpOrb 数量
    - 通过 `Pool.putPool(enemyNode, dovePoolType.enemy)` 回收节点
    - 触发 `doveG.mp3.die.playEffect()`
    - _需求：4.6, 11.3_

  - [ ]* 5.10 为 ExpOrb 掉落数量编写属性测试
    - **属性 6：Enemy 死亡掉落 ExpOrb 数量在配置范围内**
    - 使用 fast-check 生成随机 [min, max] 配置，验证掉落数量满足 `min <= count <= max`
    - **验证：需求 4.6**


- [ ] 6. 实现武器系统（doveWeapon.ts + doveWeaponMgr.ts + doveProjectile.ts）
  - [ ] 6.1 创建 `assets/doveScr/ui/game/doveWeapon.ts` — 武器基类
    - 属性：weaponId / type / level / cooldown / cooldownTimer
    - `update(dt)`：cooldownTimer 累加，达到 cooldown 时调用 `fire()` 并重置计时器
    - `fire(playerPos, targetDir)` 为抽象方法，由子类实现
    - _需求：5.2_

  - [ ]* 6.2 为武器 cooldown 触发编写属性测试
    - **属性 8：武器按 cooldown 触发攻击**
    - 使用 fast-check 生成随机 cooldown 值和模拟时间 T，验证触发次数等于 `floor(T / cooldown)` ±1
    - **验证：需求 5.2**

  - [ ] 6.3 创建 `assets/doveScr/ui/game/doveProjectile.ts` — 投射物脚本
    - `init(dir, speed, damage, range)`：初始化方向、速度、伤害、最大射程
    - `update(dt)`：按方向移动，累计距离超过 range 或命中 Enemy 后归还 Pool
    - 命中 Enemy 时调用 `enemy.takeDamage(damage)`
    - _需求：5.3_

  - [ ] 6.4 实现投射型武器（ProjectileWeapon extends doveWeapon）
    - `fire()` 调用 `dovePlayer.getFacingDir()` 获取方向，从 Pool 取出 Projectile 节点并初始化
    - _需求：5.3_

  - [ ]* 6.5 为投射型武器方向编写属性测试
    - **属性 9：投射型武器方向指向最近 Enemy**
    - 使用 fast-check 生成随机 Enemy 列表，验证 Projectile 初始方向与暴力枚举最近 Enemy 方向一致
    - **验证：需求 5.3**

  - [ ] 6.6 实现范围型武器（AOEWeapon extends doveWeapon）
    - `fire()` 遍历所有活跃 Enemy，对距 Player 中心 <= aoeRadius 的 Enemy 调用 `takeDamage()`
    - _需求：5.4_

  - [ ]* 6.7 为 AOE 武器范围编写属性测试
    - **属性 10：AOE 武器只伤害范围内 Enemy**
    - 使用 fast-check 生成随机 Enemy 列表和 aoeRadius，验证只有范围内 Enemy 受到伤害
    - **验证：需求 5.4**

  - [ ] 6.8 实现轨道型武器（OrbitWeapon extends doveWeapon）
    - `fire()` 从 Pool 取出若干 Projectile 节点，均匀分布在 orbitRadius 圆周上
    - `update(dt)` 驱动所有轨道 Projectile 绕 Player 旋转，持续对接触 Enemy 造成伤害
    - _需求：5.5_

  - [ ]* 6.9 为轨道型武器距离编写属性测试
    - **属性 11：轨道型武器 Projectile 与 Player 保持固定距离**
    - 使用 fast-check 生成随机 orbitRadius 和旋转角度，验证任意时刻距离误差 < 1 像素
    - **验证：需求 5.5**

  - [ ] 6.10 创建 `assets/doveScr/ui/game/doveWeaponMgr.ts`，实现 `equipWeapon(weaponId)` 和 `upgradeWeapon(weaponId)`
    - `equipWeapon`：已装备数量 >= maxWeaponSlots 时返回 false 并触发 HUD 提示"武器槽已满"
    - `upgradeWeapon`：将对应武器 level +1，更新 cooldown 等属性
    - _需求：5.7_

  - [ ] 6.11 实现 `doveWeaponMgr.update(dt)` — 驱动所有武器 cooldown 计时
    - 遍历 `weapons` 数组，调用每个武器的 `update(dt)`
    - _需求：5.2_


- [ ] 7. 实现经验系统（doveExpOrb.ts）
  - [ ] 7.1 创建 `assets/doveScr/ui/game/doveExpOrb.ts`
    - `init(expValue)`：设置经验值
    - `update(dt)`：检测与 Player 的距离，进入 pickupRadius 后向 Player 吸附移动
    - 到达 Player 位置时调用 `doveGame` 的经验增加逻辑，并归还 Pool
    - _需求：6.1, 6.2_

  - [ ]* 7.2 为 ExpOrb 拾取编写属性测试
    - **属性 12：ExpOrb 拾取后经验值正确增加**
    - 使用 fast-check 生成随机 expValue 和初始经验，验证拾取后经验增量正确且 ExpOrb 被回收
    - **验证：需求 6.1**

  - [ ] 7.3 在 doveGame 中实现升级触发逻辑
    - 经验达到 expToNext 时：level +1，exp 清零，state = paused，打开 doveLevelUpPanel
    - _需求：6.3_


- [ ] 8. 实现地图系统（doveMapMgr.ts）
  - [ ] 8.1 创建 `assets/doveScr/ui/game/doveMapMgr.ts`，实现 `init()` — 初始化 3×3 分块网格
    - `CHUNK_SIZE = 512`，以 Player 为中心创建 9 个分块节点
    - _需求：7.1_

  - [ ] 8.2 实现 `update(dt)` — 检测 Player 位置，触发分块循环
    - 当 Player 移出中心分块时，将超出范围的分块移动至对侧
    - _需求：7.2_

  - [ ]* 8.3 为地图分块循环编写属性测试
    - **属性 14：地图分块循环后总数保持 9**
    - 使用 fast-check 生成随机 Player 移动方向和距离，验证循环后活跃分块总数始终等于 9
    - **验证：需求 7.2**

  - [ ] 8.4 实现 `recycleChunk(chunk, newGridPos)` — 分块重置与装饰物生成
    - 按 `decorDensity` 随机放置装饰物，跳过与 Player 或 Enemy 重叠的位置
    - _需求：7.3, 7.4_

  - [ ]* 8.5 为装饰物不重叠编写属性测试
    - **属性 15：装饰物不与 Player/Enemy 重叠**
    - 使用 fast-check 生成随机 Player 位置和 Enemy 列表，验证所有装饰物位置不与任何碰撞半径重叠
    - **验证：需求 7.4**


- [ ] 9. 检查点 — 确保核心游戏循环可运行
  - 确保所有测试通过，核心循环（移动 → 攻击 → 敌人生成 → 经验拾取 → 升级）可正常运行，如有问题请向用户反馈。

- [ ] 10. 实现 UI 层
  - [ ] 10.1 创建 `assets/doveScr/ui/hud/doveGameHUD.ts`，实现 HUD 数据绑定方法
    - `updateHP(cur, max)`：更新血量数字和血条进度
    - `updateTime(seconds)`：格式化为 MM:SS 并更新标签
    - `updateKillCount(count)`：更新击杀数标签
    - `updateExpBar(cur, max, level)`：更新经验条和等级标签
    - _需求：8.1, 8.2, 8.3, 8.4_

  - [ ]* 10.2 为时间格式化编写属性测试
    - **属性 16：时间格式化为 MM:SS**
    - 使用 fast-check 生成随机非负整数秒数（0 <= s <= 5999），验证输出匹配正则 `^\d{2}:\d{2}$` 且数值正确
    - **验证：需求 8.2**

  - [ ] 10.3 实现 `showDamageFloat(worldPos, dmg)` — 飘字伤害数值
    - 在受击位置显示伤害数字，0.8 秒内向上移动并淡出
    - _需求：8.5_

  - [ ] 10.4 实现暂停按钮逻辑
    - 点击后调用 `doveGame.pauseGame()`，显示暂停菜单（继续/返回主菜单）
    - _需求：8.6_

  - [ ] 10.5 创建 `assets/doveScr/ui/levelup/doveLevelUpPanel.ts`
    - `onShow(data: LevelUpOption[])`：渲染 3 个选项卡（名称、图标、效果描述）
    - `onSelectOption(option)`：应用效果（weapon_unlock / weapon_upgrade / passive），播放升级音效，关闭面板，恢复游戏
    - _需求：6.4, 6.5, 6.6, 11.4_

  - [ ]* 10.6 为 LevelUpPanel 选项抽取编写属性测试
    - **属性 13：LevelUpPanel 抽取选项数量正确且无重复**
    - 使用 fast-check 生成随机可用选项池（大小 N），验证抽取数量等于 `min(3, N)` 且无重复
    - **验证：需求 6.4, 6.6**

  - [ ] 10.7 创建 `assets/doveScr/ui/result/doveResultPanel.ts`
    - `onShow(data: ResultData)`：展示存活时间、击杀数、最终等级、获得金币
    - `onReplay()`：重置 RunData，调用 `doveGame.startGame(heroId)`
    - `onBackHome()`：关闭关卡场景，返回主菜单
    - _需求：9.2, 9.4, 9.5_

  - [ ]* 10.8 为结算面板数据一致性编写属性测试
    - **属性 17：结算面板数据与 RunData 一致**
    - 使用 fast-check 生成随机 RunData，验证面板展示的各字段与 RunData 完全一致
    - **验证：需求 9.2**

  - [ ] 10.9 创建 `assets/doveScr/ui/shop/doveMetaShop.ts`
    - `onShow()`：读取 `doveC.metaUpgrades`，渲染所有强化项（名称、描述、当前等级、升级费用）
    - `onUpgrade(upgradeId)`：检查金币，足够则扣除并 level +1，通过 `doveC.set` 持久化；不足则提示"金币不足"；已满级则按钮置灰
    - `refreshGold()`：通过 `doveC.watch` 注册，金币变化时自动刷新顶部金币显示
    - _需求：10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 10.10 为 MetaShop 购买逻辑编写属性测试
    - **属性 19：MetaShop 金币购买正确性**
    - 使用 fast-check 生成随机金币总量和升级费用，验证金币充足时正确扣除且等级 +1，不足时金币和等级均不变
    - **验证：需求 10.2, 10.3, 10.4**

  - [ ]* 10.11 为 MetaShop 金币显示自动刷新编写属性测试
    - **属性 20：金币变化时 MetaShop 顶部显示自动刷新**
    - 验证 `doveC.watch` 回调被触发后，显示值等于 `doveC.gold` 最新值
    - **验证：需求 10.6**


- [ ] 11. 集成音频系统
  - [ ] 11.1 在 doveGame.startGame() 中集成 BGM 播放
    - 关卡加载完成后调用 `doveG.mp3.bgm.playMusic()`（循环）
    - 检查 `doveC.musicSwitch`，为 false 时静音
    - _需求：11.1, 11.5_

  - [ ] 11.2 在 dovePlayer.takeDamage() 中集成受击音效
    - 调用 `doveG.mp3.hit.playEffect()`，检查 `doveC.soundSwitch`
    - _需求：11.2, 11.6_

  - [ ] 11.3 在 doveEnemyMgr.onEnemyDead() 中集成死亡音效
    - 调用 `doveG.mp3.die.playEffect()`，检查 `doveC.soundSwitch`
    - _需求：11.3, 11.6_

  - [ ] 11.4 在 doveLevelUpPanel.onSelectOption() 中集成升级音效
    - 调用 `doveG.mp3.levelup.playEffect()`，检查 `doveC.soundSwitch`
    - _需求：11.4, 11.6_

- [ ] 12. 实现数据持久化（doveC 集成）
  - [ ] 12.1 在 doveGame 启动时读取 MetaData
    - 通过 `doveC.get(doveCKey.metaData)` 读取，不存在时初始化默认值 `{ gold: 0, upgrades: {} }`
    - localStorage 读取失败时使用默认值并输出 `console.warn`
    - _需求：12.2, 12.5_

  - [ ] 12.2 在关卡结算时写入 MetaData
    - `doveC.gold += goldEarned`，通过 `doveC.set` 立即持久化
    - localStorage 写入失败时捕获异常并输出 `console.error`，内存数据保持正确
    - _需求：12.1, 12.4_

  - [ ]* 12.3 为 MetaData 持久化编写属性测试
    - **属性 21：MetaData 持久化正确性**
    - 使用 fast-check 生成随机 MetaData，验证 `doveC.set` 后从 localStorage 读取的值与写入值完全一致（JSON 序列化往返）
    - **验证：需求 12.1**

  - [ ]* 12.4 为金币奖励计算编写属性测试
    - **属性 18：金币奖励计算正确**
    - 使用 fast-check 生成随机 killCount / base / coeff，验证结算后 `doveC.gold` 增量等于 `base + killCount × coeff`
    - **验证：需求 9.3**

- [ ] 13. 最终检查点 — 确保所有测试通过
  - 确保所有测试通过，完整游戏循环（开始 → 战斗 → 升级 → 结算 → 局外商店）可正常运行，如有问题请向用户反馈。

## 备注

- 标有 `*` 的子任务为可选测试任务，可跳过以加快 MVP 进度
- 每个任务均引用具体需求条款，确保可追溯性
- 属性测试使用 fast-check 库，每个属性最少运行 100 次迭代
- 所有脚本统一使用 `doveG`（非 `G`）和 `doveC`（非 `C`）访问框架能力
- Pool 操作使用 `dovePoolType` 枚举的字符串值（`as any` 绕过 appDL 类型约束）
