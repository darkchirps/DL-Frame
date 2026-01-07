const package = require("../../package.json");
function onCreateMenu() {
    const selectedType = Editor.Selection.getLastSelectedType();
    const menu = [];
    menu.push({
        label: "点击1", click() {
        }
    });
    return menu;
}
exports.onCreateMenu = onCreateMenu;//创建菜单栏

function onAssetMenu() {
    const selectedType = Editor.Selection.getLastSelectedType();
    const menu = [];
    menu.push({
        label: "点击2", click() {
        }
    });
    return menu;
}
exports.onAssetMenu = onAssetMenu;//点击assets文件夹的子文件及其子文件夹

function onDbMenu() {
    const selectedType = Editor.Selection.getLastSelectedType();
    const menu = [];
    menu.push({
        label: "点击3", click() {
        }
    });
    return menu;
}
exports.onDbMenu = onDbMenu;//点击最高层级文件夹

function onPanelMenu() {
    const selectedType = Editor.Selection.getLastSelectedType();
    const menu = [];
    menu.push({
        label: "i18n:dl-plugin.update_spr", click() {
            Editor.Message.send(package.name, 'update_spr');
        }
    });
    menu.push({
        label: "i18n:dl-plugin.update_pre", click() {
            Editor.Message.send(package.name, 'update_pre');
        }
    });
    menu.push({
        label: "i18n:dl-plugin.update_conf", click() {
            Editor.Message.send(package.name, 'update_conf');
        }
    });
    menu.push({
        label: "i18n:dl-plugin.update_mp3", click() {
            Editor.Message.send(package.name, 'update_mp3');
        }
    });
    return menu;
}
exports.onPanelMenu = onPanelMenu;//资源管理器空白位置

