
import UIMgr from '../../../appDL/Manager/UIMgr';
import UIScr from '../../../appDL/Manager/UIScr';
import { UIClass } from '../../../appDL/Manager/UIClass';
import pageViewPlus, { PageChangeStartCallback, RenderPageCallback } from '../../../appDL/Component/pageViewPlus';
const { ccclass, property } = cc._decorator;

//脚本同预制体名
@ccclass
export class test extends UIScr {
    nodesType: tree_test; //对应 tree_预制体名

    start() {
        this.showUi();
        this.btnManager();
        // 1. 构造你的分页数据
        const pageData = [
            { title: "第一页", color: cc.Color.RED },
            { title: "第二页", color: cc.Color.GREEN },
            { title: "第三页", color: cc.Color.BLUE },
            { title: "第四页", color: cc.Color.YELLOW },
        ];

        // 2. 页面渲染回调：负责渲染每个页面的UI
        const renderCallback: RenderPageCallback = (node, data, index) => {
            console.log(`渲染第${index}页`, data);
        };

        // 3. ✅ 核心：翻页开始回调【你要的逻辑都写在这里】
        const pageChangeCallback: PageChangeStartCallback = (dir, targetIndex) => {
            // dir=1 → 向上滑 → 上一页
            // dir=-1 → 向下滑 → 下一页
            // targetIndex → 即将显示的页面索引

            console.log("===== 翻页开始 =====");
            if (dir === 1) {
                console.log(`翻到【上一页】，目标索引：${targetIndex}`);
                // 写你的上一页逻辑，比如：播放上一页音效、统计翻页次数、请求上一页数据等
            } else {
                console.log(`翻到【下一页】，目标索引：${targetIndex}`);
                // 写你的下一页逻辑，比如：发送埋点、加载下一页资源、更新顶部标题等
            }
        };
        // 4. 初始化翻页组件
        this.nodes.loopPageView.getComponent(pageViewPlus).setPageSize(400,290); // 设置单页尺寸
        this.nodes.loopPageView.getComponent(pageViewPlus).init(pageData, renderCallback, pageChangeCallback, 0);
    }

    showUi() {
        // UI显示逻辑
    }

    btnManager() {
        // 按钮管理逻辑
    }
}

// 注册UI管理
UIMgr.register(new UIClass({
    ID: "test",//唯一id 对应预制体名
    parfabPath: "test",//预制体所处父文件夹名
}));