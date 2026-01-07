import { _decorator, Component, screen, Node, math, sys, view, ResolutionPolicy, AssetManager, find, director } from 'cc';
import { BUILD } from 'cc/env';

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
        this.adaptiveType();
    }

    start() {
        G.init(this);
        myG.init();
    }

    /**适配*/
    adaptiveType() {
        var frameSize = screen.windowSize;
        let designSize = new math.Size(720, 1280);
        let maxSection = 1560;
        let minSection = BUILD ? 1280 : 977;
        if (sys.platform == sys.Platform.MOBILE_BROWSER) {
            minSection = 977;
        }
        let ratio = designSize.width / frameSize.width;
        let calculateSize = ratio * frameSize.height;
        if (calculateSize > maxSection) {
            calculateSize = maxSection;
        } else if (calculateSize < minSection) {
            calculateSize = minSection;
        }
        view.setDesignResolutionSize(designSize.width, calculateSize, ResolutionPolicy.SHOW_ALL);
    }
}
