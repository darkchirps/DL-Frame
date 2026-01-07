function onCreateMenu() {
    const selectedType = Editor.Selection.getLastSelectedType();
    const menu = [];
    if (selectedType === "node") {
        menu.push({
            label: "点击1", click() {
                console.log('节点信息:', Editor.Selection.getLastSelectedType(), Editor.Selection.getLastSelected("node"));
            }
        });

    }
    return menu;
}
exports.onCreateMenu = onCreateMenu;//创建菜单栏

function onNodeMenu() {
    const selectedType = Editor.Selection.getLastSelectedType();
    const menu = [];
    if (selectedType === "node") {
        menu.push({
            label: "点击2", click() {
                console.log('节点信息:', Editor.Selection.getLastSelectedType(), Editor.Selection.getLastSelected("node"));
            }
        });

    }
    return menu;
}
exports.onNodeMenu = onNodeMenu;//非根节点

function onRootMenu() {
    const selectedType = Editor.Selection.getLastSelectedType();
    const menu = [];
    if (selectedType === "node") {
        menu.push({
            label: "点击3", click() {
                console.log('节点信息:', Editor.Selection.getLastSelectedType(), Editor.Selection.getLastSelected("node"));
            }
        });

    }
    return menu;
}
exports.onRootMenu = onRootMenu;//根节点