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

    private _boundSetStr: () => void;

    onLoad() {
        this.label = this.getComponent(Label);
        if (this.textId <= 0) console.warn("i18n: textId not selected");
        // 绑定 this，确保回调内 this 指向组件实例，同时保存引用用于 unwatch
        this._boundSetStr = this.setStr.bind(this);
        // watch 注册时会立即触发一次 setStr，无需手动调用
        C.watch("languageId", this._boundSetStr, this.node);
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
        // 使用保存的绑定引用解绑，与注册时的引用一致
        C.unwatch("languageId", this._boundSetStr);
        this._boundSetStr = null;
        this.label = null;
    }
}