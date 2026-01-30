//扩展接口
type k_v<T> = {
    [k: string]: T;
    [k: number]: T;
};

type k_v1<T> = { [k: string]: T };
type k_v2<T> = { [k: string | number]: T };

declare class virtualList {
    bindRenderEvent(uiScr: cc.Component, handler: string)
    numItems: number;
    /**
     * 跳转到指定索引
     * @param index 目标索引
     * @param duration 动画时间，0 为瞬间跳转，-1 使用默认值
     */
    scrollToIndex(index: number, duration: number = -1)
}
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
        /**虚拟列表*/
        get virtualList(): virtualList;
        get labelChange(): labelChange;
        get richTextPlus(): richTextPlusr;
        get listSpfs(): listSpfs;
        get videoPlay(): videoPlay;
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