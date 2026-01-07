import { _decorator, Component, screen, Node, math, sys, view, ResolutionPolicy, AssetManager, find, director } from 'cc';

const { ccclass, property } = _decorator;
@ccclass('main')
export class main extends Component {

    /**根节点*/
    rootNode: Node = null;
    /**根遮罩节点*/
    rootMaskNode: Node = null;

    /**存放其他*/
    other: Node = null;
    /**页面加载进度节点*/
    loadingNode: Node = null;

    onLoad() {
        this.rootNode = find("Canvas/Root");
        this.rootMaskNode = find("Canvas/Root/RootMask");
        this.other = find("Canvas/Other");
        this.loadingNode = find(`Canvas/Other/Loading`);
    }

    start() {
        G.init(this);
        myG.init();
    }
}
