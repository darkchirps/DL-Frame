import { Asset, AudioClip, TextAsset, Component, error, Node, Prefab, sp, SpriteFrame, Texture2D, _decorator, isValid, JsonAsset } from "cc";
import { UIClass } from "./UIClass";
import { k_v } from "../../../type_cetend_cc";

const { ccclass } = _decorator;

// UI逻辑基类
@ccclass
export default class UIScr extends Component {
    // 持有 UIClass 实例
    public uiClass: UIClass;

    // 节点树类型
    nodesType: k_v<Node>;

    /** 额外数据 */
    get data() {
        return this.uiClass._data;
    }

    /** 界面显示 */
    onShow(): void {
    }
    /** 移除UI */
    remove(): void {
        this.uiClass?.remove();
    }

    //通过本窗体加载资源，会在窗体被关闭时，销毁对应的资源
    async getAsset(bundleName: string, path: string, type?: typeof Asset) {
        return new Promise((resolve, reject) => {
            G.asset.getAsset(bundleName, path, this.uiClass.uiConfig.ID, type).then((v) => {
                if (isValid(this.node, true)) resolve(v);
            });
        });
    }

    public async getPrefab(bundleName: string = "ui", path: string): Promise<Prefab> {
        return this.getAsset(bundleName, path, Prefab) as any;
    }
    public async getSpriteFrame(bundleName: string = "ui", path: string): Promise<SpriteFrame> {
        return this.getAsset(bundleName, path, SpriteFrame) as any;
    }
    public async getTexture(bundleName: string = "ui", path: string): Promise<Texture2D> {
        return this.getAsset(bundleName, path, Texture2D) as any;
    }
    public async getText(bundleName: string = "ui", path: string): Promise<TextAsset> {
        return this.getAsset(bundleName, path, TextAsset) as any;
    }
    public async getJson(bundleName: string = "ui", path: string): Promise<JsonAsset> {
        return this.getAsset(bundleName, path, JsonAsset) as any;
    }
    /** 动态图获取接口 */
    public async getDynamicPic(name: string) {
        return this.getAsset("resources", "imgDynamic/" + name, SpriteFrame) as any;
    }
}