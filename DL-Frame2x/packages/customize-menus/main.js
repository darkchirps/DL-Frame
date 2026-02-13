// 在重写Editor.Menu之前，先持有其引用，在必要的时候可以还原回去
// 并且这一行必须写在文件前面，因为CustomMenu需要继承Editor.Menu,
// 但是又不能直接extends Editor.Menu，因为Editor.Menu本身会被CustomMenu覆盖
if (!Editor.__Menu__) {
  Editor.__Menu__ = Editor.Menu;
};
// 创建脚本文件
const fs = require('fs');
const path = require('path');

module.exports = {
  load() {
    // execute when package loaded
    Editor.Menu = CustomMenu; // 应用自定义菜单
  },

  unload() {
    // execute when package unloaded
    Editor.Menu = Editor.__Menu__; // 恢复原来的菜单逻辑
  },

  // register your ipc messages here
  messages: {
    'active'() {
      Editor.Menu = CustomMenu;
      Editor.log("已启用自定义上下文菜单");
    },
    'disactive'() {
      Editor.Menu = Editor.__Menu__;
      Editor.log("已停用自定义上下文菜单");
    },
  },
};

// 获取资源管理器中选中的第一个资源
function getSelectedFirstAssetInfo() {
  let asset_selection = Editor.Selection.curSelection("asset");
  if (asset_selection == null || asset_selection.length == 0) return null;
  let info = Editor.assetdb.assetInfoByUuid(asset_selection[0]);
  return info;
}

// template菜单模板
// https://docs.cocos.com/creator/2.4/api/zh/editor/main/menu.html
class CustomMenu extends Editor.__Menu__ {
  constructor(template, webContent) {
    let menuLocation; // 菜单所在区域

    if (template.length > 0) {
      let first = template[0];
      if (first.label == "创建节点") { // 场景节点右键菜单
        menuLocation = "node";
      } else if (first.label == "新建") { // asset右键菜单
        menuLocation = "asset";
      } else if (first.label == "Remove") { // 脚本组件菜单
        menuLocation = "component";
      } else if (first.path && first.path.startsWith("渲染组件")) { // 添加组件菜单
        menuLocation = "addcomponent";
      }
    }

    if (menuLocation == "asset") {
      let assetInfo = getSelectedFirstAssetInfo();
      template.push({ type: "separator" });
      template.push({
        label: '★ 新建UIScr ★',
        enabled: true,
        click: (n) => {
          const c = require("./createUIScr");
          c.createUIScr(assetInfo);
        }
      });
    }
    super(template, webContent);
  }
}
