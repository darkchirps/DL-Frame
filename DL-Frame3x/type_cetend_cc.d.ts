import { Mask, RichText, NodeEventType, Node } from "cc";
import listSpfs from "./assets/appDL/Component/listSpfs";
import labelChange from "./assets/appDL/Component/labelChange";
import i18n from "./assets/appDL/Component/i18n";
import virtualList from "./assets/appDL/Component/virtualList";
//扩展接口
type k_v<T> = {
    [k: string]: T;
    [k: number]: T;
};
type k_v1<T> = { [k: string]: T };
type k_v2<T> = { [k: string | number]: T };

type touchConf = {
    /**锁定按钮点击的间隔 Unit: s*/
    touchDelay?: number;
    /**监听事件列表 */
    onTouchTypes?: NodeEventType[];
    /**多少时间后触发长按 Unit: s*/
    longTouchDelay?: number;
    /**长按回调触发longTouchRepeat + 1次，可以传入macro.REPEAT_FOREVER达到无限次 */
    longTouchRepeat?: number;
    /**需要长按时触发的间隔 Unit: s*/
    longTouchInterval?: number;
    /**点击穿透 停止传递当前事件 */
    propagationStopped?: boolean;
    /**设置是否阻止事件被节点吞噬, 默认为 false 。 如果设置为 true，则事件允许派发给渲染在下一层级的节点 */
    preventSwallow?: boolean;
};
declare module "cc" {
    enum NodeEventType {
        /**手指结束触摸期间无移动时触发*/
        TOUCH_NOMOVE = "touch-nomove",
        /**长按触发*/
        TOUCH_LONG = "touch-long",
    }

    interface Node {
        /**
         * 绑定点击事件，多次调用时覆盖
         * @param fn 回调函数
         * @param delayTime 可选，点击后锁定多少秒，锁定期间该Node不再响应任何事件
         */
        click(fn: (sender?: this, type?: string, event?: EventTouch, fromcode?: boolean) => void, scaleBool?: boolean): void;
        touch(fn, conf?: touchConf): void;
        triggerTouch(type: NodeEventType): void;
        /**是否关闭点击事件 */
        _touchEnabled: boolean;
        get uiTransform(): UITransform;
        get string(): string;
        set string(str: string | number);
        get scaleXY(): number;
        set scaleXY(val: number);
        __zIndex: number;
        get zIndex(): number;
        set zIndex(val: number);
        get label(): Label;
        get richText(): RichText;
        get mask(): Mask;
        get polygonCollider2D(): PolygonCollider2D;
        get spine(): sp.Skeleton;
        get blockInputEvents(): BlockInputEvents;
        get button(): Button;
        get editBox(): EditBox;
        get layout(): Layout;
        get pageView(): PageView;
        get pageViewIndicator(): PageViewIndicator;
        get progressBar(): ProgressBar;
        get safeArea(): SafeArea;
        get scrollView(): ScrollView;
        get slider(): Slider;
        get widget(): Widget;
        get opacity(): number;
        set opacity(v: number);
        get animation(): Animation;
        get toggle(): Toggle;
        get rigidBody2D(): RigidBody2D;
        get circleCollider2D(): CircleCollider2D;

        get sprite(): Sprite;
        get spriteFrame(): SpriteFrame;
        set spriteFrame(v: SpriteFrame);

        nodesType: k_v<Node>;
        get nodes(): this["nodesType"];
        nodesCache: object;

        /**切换图片组件*/
        get listSpfs(): listSpfs;
        /**列表组件*/
        get virtualList(): virtualList;
        /**数值滚动组件*/
        get labelChange(): labelChange;
        /**多语言组件*/
        get i18n(): i18n;
        /**节点在屏幕上的坐标*/
        get uiPosition(): Vec3;

    }

    interface Component {
        nodesType: k_v<Node>;
        get nodes(): this["nodesType"];
    }
}