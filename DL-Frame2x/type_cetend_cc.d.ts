//扩展接口
type k_v<T> = {
    [k: string]: T;
    [k: number]: T;
};

type k_v1<T> = { [k: string]: T };
type k_v2<T> = { [k: string | number]: T };

declare class timekeep {
    onFinished(callback: Function, target?: any): void;
    play(timer?: number): void;
    pause(): void;
    resume(): void;
    stop(): void;
    reset(seconds?: number): void;
}
declare namespace cc {

    interface Node {
        /**
         * 绑定点击事件，多次调用时覆盖
         * @param fn 回调函数
         * @param enableScale 可选,默认开启,缩放
         */
        click(fn: (sender?: this, type?: string, event?: cc.EventTouch) => void, enableScale?: boolean = true, clickSoundBool: boolean = true): void;
        /**是否关闭点击事件 */
        _touchEnabled: boolean;

        get string(): string;
        set string(str: string | number);
        get label(): cc.Label;
        get labelOutline(): cc.LabelOutline;
        get richText(): cc.RichText;
        get mask(): cc.Mask;
        get sprite(): cc.Sprite;
        get spine(): sp.Skeleton;
        get blockInputEvents(): sp.BlockInputEvents;
        get button(): cc.Button;
        get editBox(): cc.EditBox;
        get layout(): cc.Layout;
        get pageView(): cc.PageView;
        get progressBar(): cc.ProgressBar;
        get scrollView(): cc.ScrollView;
        get slider(): cc.cc.Slider;
        get widget(): cc.Widget;
        get animation(): cc.Animation;
        get toggle(): cc.Toggle;
        get polygonCollider(): cc.PolygonCollider;
        get physicsPolygonCollider(): cc.PhysicsPolygonCollider;
        get rigidBody(): cc.RigidBody;
        get particleSystem(): cc.ParticleSystem;

        nodesType: k_v<cc.Node>;
        get nodes(): this["nodesType"];
        nodesCache: object;

        //新增组件
        get list(): list;
        get labelChange(): labelChange;
        get richTextPlus(): richTextPlusr;
        get listSpfs(): listSpfs;
        get CCMVideo(): CCMVideo;
        get roundBox(): roundBox;
        get timekeep(): timekeep;
        get pageRoll(): pageRoll;
        get switcher(): switcher;
        get customPolygon(): customPolygon;

        get uiPosition(): cc.Vec3;
    }
    interface Component {
        nodesType: k_v<cc.Node>;
        get nodes(): this["nodesType"];
    }
}