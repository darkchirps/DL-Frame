import CCMVideo, { VideoEventType } from "./CCMVideo";

/*******************************************************************************
 * 描述:    播放视频的节点上挂载此组件
*******************************************************************************/
const { ccclass, property, menu } = cc._decorator;
@ccclass
@menu('常用组件/CCMVideoItem')
export class CCMVideoItem extends cc.Component {

    get CCMVideo() {
        return this.node.getComponent(CCMVideo);
    }

    onLoad() {
        try {
            const video = this.CCMVideo;
            if (!video) return;

            // avoid adding duplicate handlers
            const compName = 'CCMVideoItem';
            const handlerName = 'onVideoEvent';
            for (let i = 0; i < video.videoPlayerEvent.length; i++) {
                const h = video.videoPlayerEvent[i];
                if (h && h.target === this.node && h.component === compName && h.handler === handlerName) {
                    // already registered
                    this._eventHandler = h;
                    return;
                }
            }

            const newEventHandler = new cc.Component.EventHandler();
            newEventHandler.target = this.node;
            newEventHandler.component = compName;
            newEventHandler.handler = handlerName;
            video.videoPlayerEvent.push(newEventHandler);
            this._eventHandler = newEventHandler;
        } catch (e) {
            // ignore errors during editor-time wiring
        }
    }
    private _eventHandler: cc.Component.EventHandler | null = null;

    onDestroy() {
        try {
            const video = this.CCMVideo;
            if (video && this._eventHandler) {
                for (let i = video.videoPlayerEvent.length - 1; i >= 0; i--) {
                    const h = video.videoPlayerEvent[i];
                    if (h && h.target === this._eventHandler.target && h.component === this._eventHandler.component && h.handler === this._eventHandler.handler) {
                        video.videoPlayerEvent.splice(i, 1);
                    }
                }
                this._eventHandler = null;
            }
        } catch (e) { }
    }

    onVideoEvent(sender: any, event: number) {
        switch (event) {
            case VideoEventType.READY:
                const v = this.CCMVideo;
                if (v) v.play();
                this.node.opacity = 255;
                break;
            default:
                break;
        }
    }
}