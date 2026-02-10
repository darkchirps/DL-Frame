cc.macro.ENABLE_MULTI_TOUCH = false;
cc.macro.CLEANUP_IMAGE_CACHE = false;
cc.dynamicAtlasManager.enabled = true;
cc.dynamicAtlasManager.maxFrameSize = 1024;

const { ccclass, property } = cc._decorator;

//框架入口脚本，请勿修改
@ccclass
export class main extends cc.Component {

    /**根节点*/
    rootNode: cc.Node = null;
    /**根遮罩节点*/
    rootMaskNode: cc.Node = null;

    /**存放其他*/
    other: cc.Node = null;
    /**页面加载进度节点*/
    loadingNode: cc.Node = null;
    /**货币栏*/
    currencyNode: cc.Node = null;
    /**所需货币栏的页面*/
    currencyHaveName: string[] = [];

    onLoad() {
        this.rootNode = cc.find(`Canvas/Root`);
        this.rootMaskNode = cc.find(`Canvas/Root/RootMask`);
        this.other = cc.find(`Canvas/Other`);
        this.loadingNode = cc.find(`Canvas/Other/Loading`);
        this.currencyNode = cc.find(`Canvas/Other/CurrencyItem`);
        this.adaptiveType();
    }
    start() {
        G.init(this);
        myG.init();
        this.showFPS();
    }
    showFPS() {
        // 修改fps的颜色并添加白色描边
        this.scheduleOnce(() => {
            let previewFPS = cc.find('PROFILER-NODE');
            if (previewFPS && previewFPS.childrenCount > 0) {
                previewFPS.children.forEach((child: cc.Node) => {
                    // 设置文本颜色为黑色
                    child.color = cc.Color.BLACK;
                    // 添加或获取描边组件
                    let outline = child.getComponent(cc.LabelOutline);
                    if (!outline) {
                        outline = child.addComponent(cc.LabelOutline);
                    }
                    // 设置描边属性
                    outline.color = cc.Color.WHITE;
                    outline.width = 2;  // 描边宽度
                });
            }
        });
    }
    /**适配*/
    adaptiveType() {
        var frameSize = cc.view.getFrameSize(); // 屏幕分辨率
        let designSize = new cc.Size(720, 1280);
        let maxSection = 1560;
        let minSection = CC_BUILD ? 1280 : 977;
        if (cc.sys.platform === cc.sys.MOBILE_BROWSER) {
            minSection = 977;
        }
        let ratio = designSize.width / frameSize.width;
        let calculateSize = ratio * frameSize.height;
        if (calculateSize > maxSection) {
            calculateSize = maxSection;
        } else if (calculateSize < minSection) {
            calculateSize = minSection;
        }
        cc.view.setDesignResolutionSize(designSize.width, calculateSize, cc.ResolutionPolicy.SHOW_ALL);
    }
}
