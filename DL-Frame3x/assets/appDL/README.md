# DL Framework — Cocos Creator 3.x 游戏框架

基于 Cocos Creator 3.x 的轻量级游戏框架，核心理念是**无需手动挂载脚本**，通过全局单例 + Node 扩展实现开箱即用的开发体验。

---

## 目录结构

```
appDL/
├── General/        全局工具方法集合
├── Manager/        各类管理器
├── Component/      可复用 UI 组件
├── Shader/         内置 Shader 效果
└── System/         框架底层系统
```

---

## 全局入口 — `G`

`General.ts` 导出全局单例 `G`，是框架所有模块的统一访问入口。

```ts
G.init(main);           // 框架初始化，传入 Main 场景组件
G.asset                 // 资源管理器
G.assetRemote           // 远程资源管理器（静态类）
G.event                 // 全局事件总线 (EventTarget)
G.mp3                   // 音频库代理
G.config                // 配置表代理
G.main                  // Main 场景组件实例
G.time                  // 当前时间戳 Date.now()
G.materials             // 全局材质资源表
G.arrayMgr              // 数组/Map 工具
G.effectMgr             // 动效工具
G.i18nMgr               // 多语言工具
G.shiftMgr              // 转换/下载工具
G.timeMgr               // 时间格式化工具
G.valueMgr              // 数值工具
```

框架同时拦截了 `console.log/warn/error`，通过 `G.openLog = false` 可一键关闭所有日志输出。

---

## Manager — 管理器层

### `C` — 本地缓存管理 `CacheMgr.ts`

基于 `localStorage` 的持久化存储，支持命名空间隔离和数据变化监听。

```ts
// 读写
C.set("gold", 999);
C.get("gold");
C.set("config", 99, "volume");   // 局部更新对象字段
C.get("config", "volume");       // 读取对象字段

// 监听变化（注册时立即触发一次，Node 销毁自动解绑）
C.watch("gold", (newVal, oldVal) => {
    this.goldLabel.string = newVal;
}, this.node);

// 对象写法同时监听多个 key
C.watch({ gold: (val) => {}, level: (val) => {} }, this.node);

C.unwatch("gold", callback);     // 手动解绑
C.clearAll();                    // 清空本项目命名空间下所有缓存
C.signKey = "main";              // 命名空间前缀，默认 "main"

// 内置快捷属性（自动初始化默认值）
C.musicSwitch   // 音乐开关，默认 true
C.soundSwitch   // 音效开关，默认 true
C.shakeSwitch   // 震动开关，默认 true
C.languageId    // 语言设置，默认 LanguageType.Chinese
```

> `C.init()` 应在 `C.watch()` 之前调用，确保默认值写入后再触发首次回调。

---

### `UIMgr` / `UIClass` / `UIScr` — UI 管理

框架 UI 系统的核心，实现无需手动挂载脚本的 UI 管理。

**注册 UI（在脚本文件末尾）**

```ts
UIMgr.register(new UIClass({
    ID: "home",              // prefab 名，同时也是脚本类名
    parfabPath: "home",      // prefab 所在文件夹
    bundleName: bundleType.appUi,
    fullScreen: true,        // 全屏 UI（自动隐藏其他全屏 UI）
    animBool: true,          // 开启打开/关闭动画
    group: "core",           // 同组 UI 只显示最新打开的
    noMask: false,           // 是否关闭遮罩
}));
```

**显示 / 关闭**

```ts
UIMgr.ui.home.show();           // 显示
UIMgr.ui.home.show({ id: 1 }); // 携带数据
UIMgr.ui.home.remove();         // 关闭
UIMgr.ui.home.isShow;           // 是否显示中
UIMgr.ui.home.once("show", () => {}); // 监听显示事件
```

**业务脚本继承 `UIScr`**

```ts
@ccclass('home')
export class home extends UIScr {
    nodesType: tree_home;   // 节点树类型（配合插件生成）

    onShow() {
        // UI 打开动画结束后调用，此时 Widget 布局已完成
        const data = this.data; // 获取 show() 传入的数据
    }
}
```

`UIScr` 内置资源加载方法，加载的资源会在 UI 关闭时自动释放：

```ts
await this.getPrefab("ui", "path/to/prefab");
await this.getSpriteFrame("ui", "path/to/image");
await this.getJson("ui", "path/to/config");
await this.getDynamicPic("avatar_001");  // 动态图快捷接口
```

---

### `G.asset` — 资源管理 `AssetMgr.ts`

基于引用计数的 Bundle 资源管理，UI 关闭时自动 `decRef`。

```ts
await G.asset.getPrefab("bundleName", "path/prefab");
await G.asset.getSpriteFrame("bundleName", "path/image");
await G.asset.getAudio("bundleName", "bgm");
await G.asset.getJson("bundleName", "path/config");
await G.asset.loadDirRes("bundleName", "audio");  // 加载整个目录
```

---

### `AssetRemoteMgr` — 远程资源管理 `AssetRemoteMgr.ts`

下载远程资源并缓存到本地（Native 平台），Web 平台直接返回原始 URL。支持并发防重复下载。

```ts
const path = await AssetRemoteMgr.loadAssetRemote("https://xxx/video.mp4", "mp4");
AssetRemoteMgr.removeCache("https://xxx/video.mp4", "mp4");
AssetRemoteMgr.clearAllCache();
```

---

### `AudioMgr` — 音频管理 `AudioMgr.ts`

```ts
// 初始化（预加载指定 bundle 的 audio 目录）
await AudioMgr.init("resources");

// 通过 G.mp3 代理访问（受 C.musicSwitch / C.soundSwitch 控制）
G.mp3.bgm.playMusic();          // 播放背景音乐（循环）
G.mp3.click.playEffect();       // 播放音效（单次）

// 直接控制
AudioMgr.playAudio(clip, true);
AudioMgr.stopMusic();
AudioMgr.stopAllEffects();
```

---

### `ConfigMgr` — 配置管理 `ConfigMgr.ts`

支持加载 `.bin`（二进制 JSON）和 `.json` 两种格式的配置表。

```ts
// 初始化
ConfigMgr.initBin("config", "bin", (config) => { G.config = config; });
ConfigMgr.initJson("config", "json", (config) => { G.config = config; });

// 查询（通过代理访问）
G.config.hero.get(1001);              // 按 id 查找
G.config.hero.get(1001, "heroId");    // 按指定 key 查找
G.config.hero.getAll();               // 获取全部数据
```

---

### `Pool` — 对象池管理 `NodePoolMgr.ts`

```ts
const node = Pool.getPoolName(poolType.mahBlock, prefab);  // 取出（池空时实例化）
Pool.putPool(node, poolType.mahBlock);                      // 回收
Pool.getPoolSize(poolType.mahBlock);                        // 查看池大小
Pool.clearAll();                                            // 清空所有池
```

---

## General — 工具方法层

所有工具方法通过 `G.xxxMgr` 访问，也可直接 `new` 使用。

| 实例 | 类 | 功能 |
|------|-----|------|
| `G.arrayMgr` | `GeneralArrayMap` | 数组打乱、分组、去重、排序、坐标查重等 |
| `G.effectMgr` | `GeneralEffect` | 贝塞尔 tween、虚线绘制、呼吸动效 |
| `G.i18nMgr` | `GeneralI18n` | 根据 `C.languageId` 获取多语言文本，支持占位符替换 |
| `G.shiftMgr` | `GeneralShift` | base64 转 SpriteFrame、浏览器下载文件/图片 |
| `G.timeMgr` | `GeneralTime` | 秒数格式化（`timetostr`）、跨天判断 |
| `G.valueMgr` | `GeneralValue` | 数值格式化（K/M/B）、随机整数、随机不重复数组 |

**`X` — 静态工具方法**

```ts
X.isPointInBox(point, boxNode);       // 点是否在矩形内
X.isBoxIntersect(boxA, boxB);         // 两矩形是否相交
```

---

## Component — UI 组件层

所有组件均可通过 `node.xxx` 快捷访问（由 `Extends.ts` 注入）。

| 组件 | 访问方式 | 功能 |
|------|---------|------|
| `switcher` | `node.switcher` | 多状态切换，编辑器内可视化配置各状态节点属性 |
| `labelChange` | `node.labelChange` | 数值滚动动画，支持逗号格式化、前缀 |
| `listSpfs` | `node.listSpfs` | 图片帧切换 |
| `virtualList` | `node.virtualList` | 虚拟列表，支持网格布局和分页吸附模式 |
| `maskplus` | `node.maskplus` | 多边形遮罩，支持旋转、缩放、镂空点击穿透 |
| `videoToFrame` | — | 视频逐帧解析播放（仅浏览器平台） |
| `tip` | `Tip.show("内容")` | 全局飘字提示，自带对象池 |
| `i18n` | `node.i18n` | 挂载到 Label 节点，自动跟随语言切换 |

**`switcher` 使用示例**

```ts
// 切换到指定状态（按索引）
node.switcher.statusIndex = 1;
// 切换到指定状态（按名称）
node.switcher.statusName = "selected";
```

**`virtualList` 使用示例**

```ts
const list = node.virtualList;
list.bindRenderEvent(this, "onRenderItem");
list.numItems = 100;
list.scrollToIndex(0);

onRenderItem(item: Node, index: number) {
    item.string = `item ${index}`;
}
```

**`labelChange` 使用示例**

```ts
node.labelChange.changeTo(0.5, 9999);           // 0.5s 滚动到 9999
node.labelChange.changeBy(0.3, 100);            // 0.3s 增加 100
node.labelChange.stop();                         // 立即停止并跳到终值
```

---

## Shader — 内置着色器

| 组件 | 菜单路径 | 功能 |
|------|---------|------|
| `gradient` | 常用Shader/文本渐变 | Label 文字三色渐变，支持横/竖方向 |
| `mosaic` | 常用Shader/图片马赛克 | Sprite 马赛克模糊效果，可调模糊度 |

---

## System — 底层系统

### `Extends.ts` — Node 扩展属性

为 `Node.prototype` 注入大量快捷属性，无需 `getComponent` 即可访问常用组件：

```ts
node.label          // Label
node.sprite         // Sprite
node.button         // Button
node.scrollView     // ScrollView
node.virtualList    // VirtualList
node.string         // Label/RichText 的 string（读写）
node.spriteFrame    // Sprite 的 spriteFrame（读写）
node.scaleXY        // 等比缩放（读写）
node.opacity        // UIOpacity.opacity（读写，自动添加组件）
node.zIndex         // 层级（写入后帧末统一排序，批量设置无性能损耗）
node.uiPosition     // 转换为 other 容器坐标系下的 UI 坐标
node.nodes          // 子节点名称索引缓存（首次访问时初始化）
node.refreshNodes() // 手动刷新 nodes 缓存（节点树增删后调用）
```

`Component.prototype` 同样注入了 `nodes`，可直接在脚本中用 `this.nodes.xxx` 访问子节点。

### `Reconstruction.ts` — 原型扩展

为 `Node` 和 `sp.Skeleton` 扩展了更便捷的 API：

```ts
// Node 调度（无需持有 Component 引用）
node.schedule(callback, interval);
node.scheduleOnce(callback, delay);
node.unschedule(callback);

// 节点置灰（Sprite + Spine 统一处理）
node.setGray(true);

// 触摸事件
node.click((sender) => { /* 点击回调，自带缩放反馈和防连点 */ });
node.touch((sender, type, event) => { /* 完整触摸事件 */ }, {
    onTouchTypes: [...],    // 监听的事件类型
    touchDelay: 0.2,        // 点击冷却时间（秒）
    longTouchDelay: 500,    // 长按触发时间（ms）
    propagationStopped: true,
});

// Spine 动画
spine.runAni("idle", true, onEnd, onEvent);
spine.stopAni();
spine.stopAllAni();
spine.getLastAnimationName();
```

### `TaskQueue.ts` — 任务队列

顺序执行异步任务，支持优先级、暂停/恢复、超时、条件判断。

```ts
const queue = new TaskQueue();
queue.onQueueComplete = () => console.log("全部完成");

queue
    .add(async () => await loadConfig(), "加载配置", 0)
    .add(async () => await loadAudio(), "加载音频", 1);

queue.pause();
queue.resume();
```

### `GlobalEventEnum.ts` — 全局事件枚举

```ts
G.event.on(Gvent.NodeClick, (node) => {});
G.event.on(Gvent.ScreenChange, () => {});
G.event.on(Gvent.DayChange, () => {});
G.event.emit(Gvent.GlobalError, err);
```

### `MainLoading.ts` — 加载等待组件

挂载在加载圈节点上，`loadingNode.active = true` 触发显示，内置 0.15s 延迟避免短暂加载时闪烁。

---

## 多语言

框架内置完整的多语言支持链路：

1. `C.languageId` 存储当前语言（持久化）
2. `G.i18nMgr.getI18n(id, ...args)` 根据 id 获取对应语言文本
3. `i18n` 组件挂载到 Label 节点，自动响应语言切换
4. 监听语言变化：`C.watch("languageId", (val) => { ... }, this.node)`

支持语言：简体中文 / 英语 / 法语 / 德语 / 日语 / 俄语 / 韩语

---

## 初始化流程

```ts
// Main.ts（场景入口）
G.init(this);                                    // 1. 框架初始化
await ConfigMgr.initBin("config", "bin", ...);  // 2. 加载配置表
await AudioMgr.init("resources");               // 3. 预加载音频
C.init();                                        // 4. 初始化缓存默认值（框架内部已调用）
UIMgr.ui.home.show();                           // 5. 打开首页
```
