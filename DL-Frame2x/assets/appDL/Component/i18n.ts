/*******************************************************************************
 * 描述:    文本节点挂载 多语言 填写多语言id
*******************************************************************************/
import { Gvent } from "../System/GlobalEventEnum";
const { ccclass, property, menu, requireComponent } = cc._decorator;
@ccclass
@menu("常用组件/多语言")
@requireComponent(cc.Label)
export default class i18n extends cc.Component {
    @property({ type: cc.Integer, displayName: "文本id" })
    private textId: number = 0;

    onLoad(): void {
        if (this.textId > 0) {
            this.setStr();
        } else {
            console.log("not select langue textid!!");
        }
        G.event.on(Gvent.changeLanguage, this.setStr, this);
    }

    /**重新设置节点多语言*/
    setTextById(id: number) {
        if (id > 0) {
            this.textId = id;
            this.setStr();
        } else {
            console.warn('id is undefined');
        }
    }

    setStr() {
        let textStr = X.getI18n(this.textId);
        if (textStr) {
            this.node.label.string = textStr;
        } else {
            console.error("lock text config id:=" + this.textId);
        }
    }

    getString() {
        return this.node.label.string;
    }

    onDestroy() {
        G.event.off(Gvent.changeLanguage, this.setStr, this);
    }
}