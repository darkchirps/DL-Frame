"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAssetMenu = void 0;
const svn_1 = require("./svn");
function onAssetMenu(assetInfo) {
    let isEnabled = assetInfo.file.indexOf(Editor.Project.path) != -1;
    return [
        {
            label: 'svn更新',
            enabled: isEnabled,
            submenu: [
                {
                    label: '更新（当前选中目录）',
                    enabled: isEnabled,
                    click() {
                        (0, svn_1.svnUpdate)(assetInfo.file);
                    },
                },
                {
                    label: '更新（项目根目录）',
                    enabled: isEnabled,
                    click() {
                        (0, svn_1.svnUpdate)(Editor.Project.path);
                    },
                },
            ],
        },
        {
            label: 'svn提交',
            enabled: isEnabled,
            submenu: [
                {
                    label: '提交（当前选中目录）',
                    enabled: isEnabled,
                    click() {
                        (0, svn_1.svnCommit)(assetInfo.file);
                    },
                },
                {
                    label: '提交（项目根目录）',
                    enabled: isEnabled,
                    click() {
                        (0, svn_1.svnCommit)(Editor.Project.path);
                    },
                },
            ],
        },
        {
            label: 'svn',
            submenu: [
                {
                    label: '日志',
                    click() {
                        (0, svn_1.svnLog)(assetInfo.file);
                    },
                },
                {
                    label: '还原',
                    click() {
                        (0, svn_1.svnRevert)(assetInfo.file);
                    },
                },
                {
                    label: '清理',
                    click() {
                        (0, svn_1.svnCleanup)(assetInfo.file);
                    },
                },
            ],
            enabled: isEnabled,
        }
    ];
}
exports.onAssetMenu = onAssetMenu;
