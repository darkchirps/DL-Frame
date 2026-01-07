"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
exports.load = load;
exports.unload = unload;
const svn_1 = require("./svn");
//@ts-ignore
if (!Editor.__Menu__) {
    //@ts-ignore
    Editor.__Menu__ = Editor.Menu;
}
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    active() {
        //@ts-ignore
        Editor.Menu = CustomMenu;
        console.log("已启用自定义上下文菜单");
    },
    disactive() {
        //@ts-ignore
        Editor.Menu = Editor.__Menu__;
        console.log("已停用自定义上下文菜单");
    },
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() {
    //@ts-ignore
    Editor.Menu = CustomMenu; //应用自定义菜单
}
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
function unload() {
    //@ts-ignore
    Editor.Menu = Editor.__Menu__; //恢复原来的菜单逻辑
}
//@ts-ignore
class CustomMenu extends Editor.__Menu__ {
    //@ts-ignore
    constructor(template, webContent) {
        let menuLocation; //菜单所在区域
        //判断是哪种菜单，暂时没有找到很优雅的办法
        //构造函数的template是编辑器自带的菜单配置数组，
        //可以添加/删除/重写template的元素实现自定义菜单功能
        if (template.length > 0) {
            let first = template[0];
            if (first.label == "新建") {
                //TODO 在这里插入asset右键菜单
                let assetInfo = getSelectedFirstAssetInfo();
                template.push({ type: "separator" });
                template.push({
                    label: "复制资源 UUID",
                    click: () => {
                        const clipboard = Editor.require("electron").clipboard;
                        clipboard.writeText(assetInfo.uuid);
                        Editor.log(assetInfo.uuid);
                    },
                });
                template.push({
                    label: "复制资源路径",
                    click: () => {
                        const clipboard = Editor.require("electron").clipboard;
                        clipboard.writeText(assetInfo.url);
                        Editor.log(assetInfo.url);
                    },
                });
                template.push({ type: "separator" });
                template.push({
                    label: "svn更新",
                    submenu: [
                        {
                            label: "更新（当前选中目录）",
                            click() {
                                (0, svn_1.svnUpdate)(assetInfo.path);
                            },
                        },
                        {
                            label: "更新（项目根目录）",
                            click() {
                                (0, svn_1.svnUpdate)(Editor.Project.path);
                            },
                        },
                    ],
                }, {
                    label: "svn提交",
                    submenu: [
                        {
                            label: "提交（当前选中目录）",
                            click() {
                                (0, svn_1.svnCommit)(assetInfo.path);
                            },
                        },
                        {
                            label: "提交（项目根目录）",
                            click() {
                                (0, svn_1.svnCommit)(Editor.Project.path);
                            },
                        },
                    ],
                }, {
                    label: "svn",
                    submenu: [
                        {
                            label: "日志",
                            click() {
                                (0, svn_1.svnLog)(assetInfo.path);
                            },
                        },
                        {
                            label: "还原",
                            click() {
                                (0, svn_1.svnRevert)(assetInfo.path);
                            },
                        },
                        {
                            label: "清理",
                            click() {
                                (0, svn_1.svnCleanup)(assetInfo.path);
                            },
                        },
                    ],
                }, {
                    label: "svn增加",
                    submenu: [
                        {
                            label: "增加（当前选中目录）",
                            click() {
                                (0, svn_1.svnAdd)(assetInfo.path);
                            },
                        },
                        {
                            label: "增加（项目根目录）",
                            click() {
                                (0, svn_1.svnAdd)(Editor.Project.path);
                            },
                        },
                    ],
                });
            }
        }
        super(template, webContent);
    }
}
/**
 * 获取资源管理器中选中的第一个资源
 * @returns
 */
function getSelectedFirstAssetInfo() {
    let asset_selection = Editor.Selection.curSelection("asset");
    if (asset_selection == null || asset_selection.length == 0) {
        return null;
    }
    let info = Editor.assetdb.assetInfoByUuid(asset_selection[0]);
    return info;
}
