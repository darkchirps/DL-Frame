import { UIClass } from "./UIClass";

const { ccclass } = cc._decorator;

// UI逻辑基类
@ccclass
export default class UIScr extends cc.Component {
    // 持有 UIClass 实例
    public uiClass: UIClass;

    // 节点树类型
    nodesType: k_v<cc.Node>;

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
    async getAsset(bundleName: string, path: string, type?: typeof cc.Asset) {
        return new Promise((resolve, reject) => {
            G.asset.getAsset(bundleName, path, this.uiClass.uiConfig.ID, type).then((v) => {
                if (cc.isValid(this.node, true)) {
                    resolve(v);
                }
            });
        });
    }
    public async getAudio(path: string): Promise<cc.AudioClip> {
        return this.getAsset("resources", `audio/${path}`, cc.AudioClip) as any;
    }
    public async getPrefab(bundleName: string = "ui", path: string): Promise<cc.Prefab> {
        return this.getAsset(bundleName, path, cc.Prefab) as any;
    }
    public async getSpriteFrame(bundleName: string = "ui", path: string): Promise<cc.SpriteFrame> {
        return this.getAsset(bundleName, path, cc.SpriteFrame) as any;
    }
    public async getTexture(bundleName: string = "ui", path: string): Promise<cc.Texture2D> {
        return this.getAsset(bundleName, path, cc.Texture2D) as any;
    }
    public async getText(bundleName: string = "ui", path: string): Promise<cc.TextAsset> {
        return this.getAsset(bundleName, path, cc.TextAsset) as any;
    }
    public async getJson(bundleName: string = "ui", path: string): Promise<cc.JsonAsset> {
        return this.getAsset(bundleName, path, cc.JsonAsset) as any;
    }
    /** 动态图获取接口 */
    public async getDynamicPic(name: string) {
        return this.getAsset("resources", "imgDynamic/" + name, cc.SpriteFrame) as any;
    }
}