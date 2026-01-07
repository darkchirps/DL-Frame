# DL(DarkLin)框架介绍 2x为删减版 推荐用3x版开发
DL是一个适合多环境开发框架，无论是独自开发还是团队开发都能快速实现功能。

## 主要特点
- 简单易用：DL提供了丰富的组件，快速开发。
- 易扩展：DL扩充性强，可以方便的扩展。
- 无需挂载脚本：DL实现了无需挂载脚本。
- 全局化全面,任意调用，任意环境方便调试

## 目前自带两个扩展
## 工作台 配合框架使用
  - 更新脚本 更新所有脚本将其加入框架管理,可通过UIMgr.ui.脚本名.show()直接打开对应页面
  - 更新节点 更新所有预制节点，在脚本中可通过this.nodes.节点名获取对应节点
  - 更新配置
  - 更新音频
## 工具集 配合项目使用 可根据项目所需增加工具
  - 图片转文本 选中文件夹 可将文件夹中的图片转换成txt(base64) //可在config.json中配置输出的txt路径 以及 在base64数据中前后可添加的脏数据
  - 表格转配置 选中文件夹 可将文件夹中的配置表转换成json //可再用工作台中的更新配置提示

### !!!非必要性不要改动DL文件夹中的任何文件!!!
## DL框架的目录结构如下： 
- Component：框架自带的常用组件
  - Gradien 图片/文本渐变 
  - ListPlus 虚拟列表/页面 
  - Mosaic 图片马赛克效果 
  - VideoUi 视频播放上显示Ui 
  - 其他看脚本中抬头注释
- Manager：框架主要控制器脚本
- System：框架系统性脚本

## scripts文件夹 存放项目脚本
- project 跟项目挂钩的脚本目录
  - myCache 本项目所需缓存
  - myGameEnum 本项目游戏枚举
  - myGeneral 本项目通用脚本/初始操作
  - myGeneralX 本项目通用脚本/扩展操作
  - mySystenEnum 本项目系统枚举
- ui 自定义项目功能性脚本所在文件夹
  - 功能文件夹/功能脚本

## ui文件夹 存放项目预制/资源
- 功能文件夹
  - 功能资源文件夹
  - 功能预制体1
  - 功能预制体2

## 页面脚本格式介绍
const { ccclass, property } = cc._decorator;
@ccclass
export class 脚本名(同预制体名) extends UIScr {
    nodesType: tree_预制体名; //通过更新节点生成对应提示
    start() {
        this.showUi();
        this.btnManager();
    }
    showUi() {
    }
    btnManager() {
       this.nodes.节点名.click(()=>{//节点添加点击事件
       })
    }
}
UIMgr.register(new UIClass({ 详情见UIClass
    ID: "脚本名(同预制体名)", //唯一
    bundleName: bundleType.ui, //预制体所在bundle包
    prefabPath: "预制体所在文件夹/预制体",
    uiType: UIType.POPUP, //页面层级
}));


