# DL Framework — Cocos Creator 编辑器插件说明

两个插件均基于 Cocos Creator 3.8.6+ 扩展 API 开发，安装后在编辑器菜单栏中使用。

---

## 安装方式

两个插件均需先编译再使用：

```bash
cd extensions/dl-plugin     # 或 toolkit-plugin
npm install
npm run build
```

编译完成后在 Cocos Creator 中启用对应扩展即可。

---

## dl-plugin — 工作台（代码提示生成器）

菜单位置：顶部菜单栏 → `工作台`

该插件的核心作用是**为框架生成 TypeScript 类型声明文件**，让编辑器对节点树、UI 脚本、配置表、音频资源都有完整的代码补全提示。

### 功能列表

#### 更新脚本提示 `update_spr`

扫描 `config.json` 中 `sprName` 配置的目录（默认 `assets/appScr`），找出所有继承 `UIScr` 的类，自动生成 `type_spr.d.ts`。

生成内容：
- 每个 UI 脚本对应一个 `XxxClass` 接口，包含 `uiScr` 字段指向具体脚本类型
- 全局 `UIClassDict` 接口，使 `UIMgr.ui.home` 有完整类型推断

```ts
// 生成示例
interface homeClass extends UIClass {
    uiScr: home
}
interface UIClassDict {
    home: homeClass
}
```

#### 更新预制提示 `update_pre`

扫描 `config.json` 中 `preName` 配置的目录（默认 `assets/appUi`），解析每个 `.prefab` 文件，提取所有节点名称，生成 `type_pre.d.ts`。

生成内容：
- 每个 prefab 对应一个 `tree_Xxx` 类型，包含该 prefab 下所有节点名到 `Node` 的映射

```ts
// 生成示例
type tree_home = {
    "btnStart": Node,
    "labTitle": Node,
    "imgBg": Node,
}
```

在业务脚本中声明后即可获得 `this.nodes.xxx` 的类型提示：

```ts
export class home extends UIScr {
    nodesType: tree_home;  // 声明节点树类型
    onShow() {
        this.nodes.btnStart.click(() => {}); // 有类型提示
    }
}
```

### 配置文件 `config.json`

```json
{
    "sprName": ["assets/appScr"],     // 扫描 UIScr 脚本的目录（可配置多个）
    "preName": ["assets/appUi"],      // 扫描 prefab 的目录（可配置多个）
    "confName": ["/assets/appRes/config"],  // 配置表目录（预留）
    "mp3Name": ["/assets/appRes/audio"]     // 音频目录（预留）
}
```

> `sprName` 和 `preName` 均支持配置多个目录，插件会合并扫描结果统一生成。

### 使用时机

- 新增 UI 脚本后 → 执行「更新脚本提示」
- 新增或修改 prefab 节点结构后 → 执行「更新预制提示」

---

## toolkit-plugin — 工具集（资源转换工具）

菜单位置：顶部菜单栏 → `工具集`

快捷键：`Ctrl+Shift+X`（Windows）/ `Cmd+Shift+X`（Mac）

该插件提供一系列**离线资源转换工具**，将外部资源转换为游戏可用格式，转换完成后自动通知编辑器刷新资源数据库。

### 功能列表

#### 表格转 JSON `open_jsonChange`

将选中目录下的所有 `.xlsx` / `.xls` 文件转换为 JSON 格式，输出到 `assets/resources/json/`。

支持两种表格布局：

**竖式表格**（首行为字段名，适合列表型数据）

| id | name | hp | skills |
|----|------|----|--------|
| int | string | int | array1 |
| ID | 名称 | 血量 | 技能列表 |
| 1001 | 战士 | 500 | 1,2,3 |

**横式表格**（首列为字段名，适合键值型配置）

| key | type | comment | value |
|-----|------|---------|-------|
| maxLevel | int | 最大等级 | 100 |
| serverUrl | string | 服务器地址 | https://... |

支持的字段类型：

| 类型 | 说明 | 示例输入 | 输出 |
|------|------|---------|------|
| `int` | 整数 | `100` | `100` |
| `string` | 字符串 | `hello` | `"hello"` |
| `array1` | 一维数组 | `1,2,3` | `[1,2,3]` |
| `array2` | 二维数组 | `1,2;3,4` | `[[1,2],[3,4]]` |
| `kv` | 键值对 | `a:1,b:2` | `{"a":1,"b":2}` |
| `array1<int>` | 泛型一维数组 | `1,2,3` | `[1,2,3]` |
| `array2<string>` | 泛型二维数组 | `a,b\|c,d` | `[["a","b"],["c","d"]]` |
| `kv<int>` | 泛型键值对 | `hp:100,mp:50` | `{"hp":100,"mp":50}` |

同时自动生成 `type_conf.d.ts`，为 `G.config` 提供完整类型推断：

```ts
// 自动生成示例
interface heroConfig {
    /** ID */
    id?: number;
    /** 名称 */
    name?: string;
    /** 血量 */
    hp?: number;
}
interface configType {
    hero?: ConfigFunc<heroConfig>;
}
```

#### 表格转 BIN `open_binChange`

与「表格转 JSON」逻辑完全相同，但输出为 `.bin` 二进制文件（本质是 UTF-8 编码的 JSON Buffer），输出到 `assets/resources/bin/`。

同时生成 `type_bin.d.ts` 类型声明文件。

适用场景：需要对配置内容做简单混淆，或减少文本资源在包体中的可读性。

#### 图片转 TXT `open_pic_txtChange`

将选中目录下的 `.jpg` / `.png` 图片转换为 Base64 编码的 `.txt` 文件，输出路径由 `config.json` 中 `picTxtPath` 指定。

适用场景：将图片以文本形式存储，配合 `GeneralShift.Base64SpriteFrame()` 在运行时解码还原为 `SpriteFrame`。

#### 图片转 BIN `open_pic_binChange`

将选中目录下的图片（支持 `.png` `.jpg` `.jpeg` `.gif` `.webp` `.bmp` `.tiff`）直接以二进制形式写出为 `.bin` 文件，输出路径由 `config.json` 中 `picBinPath` 指定。

适用场景：将图片打包为二进制资源，通过 `AssetRemoteMgr` 或自定义加载逻辑在运行时读取。

#### 视频首帧图 `open_videoFrame`

依赖系统安装的 FFmpeg，提取选中目录下所有视频文件（`.mp4` `.avi` `.mov` `.mkv` `.wmv` `.flv` `.webm`）的第一帧，保存为 `1024x1536` 的 `.jpg` 图片。

输出目录：项目目录的上级文件夹下的 `视频首帧图/` 文件夹。

前置要求：系统需安装 FFmpeg 并加入 PATH，或在项目中安装 `fluent-ffmpeg`：

```bash
npm install fluent-ffmpeg
```

适用场景：为视频列表生成封面缩略图，配合 `videoToFrame` 组件使用。

### 配置文件 `config.json`

```json
{
    "picTxtPath": "输出目录/图片txt",   // 图片转 txt 的输出路径（绝对路径）
    "picBinPath": "输出目录/图片bin"    // 图片转 bin 的输出路径（绝对路径）
}
```

---

## 两个插件的协作关系

```
开发流程
  │
  ├─ 新建 prefab / 修改节点结构
  │     └─ dl-plugin → 更新预制提示 → 生成 type_pre.d.ts
  │           └─ this.nodes.xxx 有类型提示
  │
  ├─ 新建 UI 脚本（继承 UIScr）
  │     └─ dl-plugin → 更新脚本提示 → 生成 type_spr.d.ts
  │           └─ UIMgr.ui.xxx 有类型提示
  │
  ├─ 策划更新 Excel 配置表
  │     └─ toolkit-plugin → 表格转 json/bin → 生成 type_conf.d.ts / type_bin.d.ts
  │           └─ G.config.xxx.get() 有类型提示
  │
  └─ 美术提供图片/视频资源
        └─ toolkit-plugin → 图片转 txt/bin / 视频首帧图
```
