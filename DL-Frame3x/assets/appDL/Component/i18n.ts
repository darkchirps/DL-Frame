/*******************************************************************************
 * 描述:    文本节点挂载 多语言 填写多语言id
*******************************************************************************/
import { Label, _decorator, Component, CCInteger } from "cc";

const { ccclass, property, menu, requireComponent } = _decorator;

@ccclass('I18n')
@menu("常用组件/多语言")
@requireComponent(Label)
export default class I18n extends Component {
    @property({ type: CCInteger, displayName: "多语言id" })
    public textId: number = 0;

    private label: Label | null = null;

    onLoad() {
        this.label = this.getComponent(Label);
        if (this.textId <= 0) console.warn("i18n: textId not selected");
        // watch 注册时会立即触发一次 setStr，无需手动调用
        C.watch("languageId", this.setStr, this.node);
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
        let textStr = G.i18nMgr.getI18n(this.textId);
        if (textStr) {
            this.node.label.string = textStr;
        } else {
            console.error("lock text config id:=" + this.textId);
        }
    }

    onDestroy() {
        C.unwatch("languageId", this.setStr);
        this.label = null;
    }
}