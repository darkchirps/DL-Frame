/*
company:LeGu Game
author:ciniao

仿FGUI的状态控制器
将该脚本挂载到节点后开始编辑

业务逻辑中，可通过以下2种方式切换状态
switcher.statusIndex = 0;
switcher.statusName = "open";

使用示例，参见同目录下的 switcher.prefab
*/

import { CCBoolean, CCFloat, CCInteger, Font, math, CCString, Color, Component, Button, Enum, Label, LabelOutline, Node, RichText, sp, Sprite, SpriteFrame, UIOpacity, UITransform, Vec2, Vec3, _decorator } from "cc";
import { EDITOR } from "cc/env";
const { ccclass, property, executeInEditMode } = _decorator;

let EditIndex = Enum({
    第0个: 0, 第1个: 1, 第2个: 2, 第3个: 3, 第4个: 4, 第5个: 5, 第6个: 6, 第7个: 7, 第8个: 8, 第9个: 9
});

@ccclass("StatusData")
export class StatusData {
    @property(CCString)
    public status = "";
    @property(CCString)
    public fileId = "";
    @property(CCBoolean)
    public active = true;
    @property(Vec3)
    public position: Vec3 = new Vec3(0, 0, 0);
    @property(math.Quat)
    public rotation: math.Quat = new math.Quat(0, 0, 0, 0);
    @property(Vec3)
    public scale: Vec3 = new Vec3(0, 0, 0);
    @property(Vec2)
    public anchor: Vec2 = new Vec2(0.5, 0.5);
    @property(Vec2)
    public size: Vec2 = new Vec2(0, 0);
    @property(CCInteger)
    public opacity = 255;
    @property(Vec3)
    public color: Vec3 = new Vec3(255, 255, 255);
    @property(Vec3)
    public outlinecolor: Vec3 = new Vec3(255, 255, 255);
    @property(CCString)
    public string = "";
    @property(CCFloat)
    public fontsize = 10;
    @property(CCFloat)
    public outlineWidth = 2;
    @property(SpriteFrame)
    public spriteFrame;
    @property(CCBoolean)
    public grayscale = false;
    @property(CCString)
    public i18nLabelStr = "";
    @property(Color)
    public shadowcolor: Color = new Color();
    @property(Vec2)
    public shadowoffset: Vec2 = new Vec2(0, 0);
    @property(CCInteger)
    public shadowblur = 0;
    @property(Font)
    public label_font;
    @property(CCInteger)
    public jianbianOpen = 0;
}

@ccclass("switcher")
@executeInEditMode()
export class switcher extends Component {
    /**
     * 状态列表
     * 在业务逻辑中只读，切勿修改
     * statusNameArray 是最终逻辑中用到的数据
     * _statusNameArrayCtrl 是编辑中用来set的数据
     */

    @property({ displayName: "visible_false", type: [CCString], visible: false })
    public statusNameArray: string[] = [];

    private _statusNameArrayCtrl: string[] = [];
    @property({ displayName: "节点数量", type: [CCString], group: "状态配置" })
    get statusNameArrayCtrl() {
        return this._statusNameArrayCtrl;
    }
    set statusNameArrayCtrl(val) {
        if (val.length > 20) {
            alert("目前只支持20个状态，如果需要更多，需要修改代码");
            return;
        }
        if (val.length < this._statusNameArrayCtrl.length) {
            //说明删除了某个Name，需要把数据中，和该Name相关的信息都删除掉
            this._statusNameArrayCtrl.forEach((name) => {
                if (val.indexOf(name) == -1) {
                    //name被删除了
                    this.statusData = this.statusData.filter((item) => {
                        return item.status !== name;
                    });
                }
            });
        }
        this._statusNameArrayCtrl = val;
        this.statusNameArray = val;
    }

    /**
     * 状态影响的节点列表
     * 在业务逻辑中只读，切勿修改
     * statusNodes 是最终逻辑中用到的数据
     * _statusNodesCtrl是编辑中用来set的数据
     */
    @property({ displayName: "visible_false", type: [Node], visible: false })
    statusNodes: Node[] = [];

    private _statusNodesCtrl: Node[] = [];
    @property({ displayName: "节点数量", type: [Node], group: "节点配置" })
    get statusNodesCtrl() {
        return this._statusNodesCtrl;
    }
    set statusNodesCtrl(val) {
        if (val.length < this._statusNodesCtrl.length) {
            //说明删除了Node，需要把数据中，和该Node相关的信息都删除掉
            let nfileId = [];
            val.forEach((node) => {
                if (!node) return;
                nfileId.push(node["_prefab"]["fileId"]);
            });

            this._statusNodesCtrl.forEach((node) => {
                if (!node) return;
                let ofileId = node["_prefab"]["fileId"];
                if (nfileId.indexOf(ofileId) == -1) {
                    //ofileId被删除了
                    this.statusData = this.statusData.filter((item) => {
                        return item.fileId !== ofileId;
                    });
                }
            });
        }
        this._statusNodesCtrl = val;
        this.statusNodes = val;
    }

    onLoad() {
        if (EDITOR) {
            this._statusNodesCtrl = this.statusNodes;
            this._statusNameArrayCtrl = this.statusNameArray;
        }
        this.statusIndex = this._statusIndex;
    }

    /**
     * 切换到第几个状态
     * 在业务逻辑中调用
     */
    @property({ displayName: "visible_false", type: CCInteger, visible: false })
    public _statusIndex: number = -1;

    @property({ displayName: "切换到第几个状态", type: EditIndex })
    get statusIndex() {
        return this._statusIndex;
    }
    set statusIndex(val) {
        if (val > this.statusNameArray.length - 1) {
            console.error("超过上限");
            return;
        }
        let _name = this.getStatusNameByIndex(val);
        if (!_name) {
            console.error("未命名的状态，请先命名");
            return;
        }
        this.currStatusName = _name;
        this._statusIndex = val;
        this.onStatusChange();
    }

    /**
     * 切换到哪个状态名
     * 在业务逻辑中调用
     */
    get statusName() {
        return this.currStatusName;
    }
    set statusName(val) {
        let index = this.statusNameArray.indexOf(val);
        if (index > -1) {
            this.statusIndex = index;
        }
    }
    @property({ displayName: "当前状态名", readonly: true })
    currStatusName: string = "";

    /**
     * 保存逻辑，主要用于编辑器
     * 在业务逻辑中请勿调用
     */
    private _isEditing = false;
    @property({ displayName: "点后面的复选框保存", type: CCBoolean })
    get isEditing() {
        return this._isEditing;
    }
    set isEditing(val) {
        this._isEditing = val;
        this._save();
    }

    /**
     * debug状态，主要用于编辑器
     * 在业务逻辑中请勿调用
     */
    // @property({ displayName: "Debug", type: CCBoolean })  visible() { return this.isDebug },
    // public isDebug: boolean = false;
    @property({ displayName: "变化节点属性", type: [StatusData], group: "Debug信息" })
    statusData: StatusData[] = [];

    /**
     * 当状态发生改变时候，重置所有node的所有属性
     */
    private onStatusChange() {
        let nodeIndex = 0;
        for (let i = 0; i < this.statusData.length; i++) {
            if (this.statusData[i].status == this.currStatusName) {
                let node = this.statusNodes[nodeIndex];
                if (node && node.isValid) {
                    this.changeNodeProp(this.statusNodes[nodeIndex], this.statusData[i]);
                }
                nodeIndex++;
            }

            if (nodeIndex >= this.statusNodes.length) {
                break;
            }
        }
    }

    /**
     * 修改节点的属性
     * @param node 被修改的node
     * @param data 属性集
     */
    private changeNodeProp(node: Node, data: StatusData) {
        node.active = data.active;
        node.setPosition(data.position);
        node.setRotation(data.rotation.x, data.rotation.y, data.rotation.z, data.rotation.w);
        node.setScale(data.scale);

        let uiTransform = node.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.setContentSize(data.size.x, data.size.y);
            uiTransform.setAnchorPoint(data.anchor.x, data.anchor.y);
        }

        let label = node.getComponent(Label);
        if (label) {
            label.color = new Color(data.color.x, data.color.y, data.color.z, data.opacity);
            if (data.string) {
                label.string = data.string;
            }
            label.fontSize = data.fontsize;
            label.font = data.label_font;
        }
        let richText = node.getComponent(RichText);
        if (richText) {
            richText.string = data.string;
            richText.fontSize = data.fontsize;
        }

        let sprite = node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(data.color.x, data.color.y, data.color.z, data.opacity);
            if (data.spriteFrame) {
                sprite.spriteFrame = data.spriteFrame;
            } else {
                sprite.spriteFrame = null;
            }
            sprite.grayscale = data.grayscale;
        }

        let uiOpacity = node.getComponent(UIOpacity);
        if (uiOpacity) {
            uiOpacity.opacity = data.opacity;
        }
    }

    /**
     * 通过状态索引返回状态名
     * @param index 索引
     * @returns 名字
     */
    getStatusNameByIndex(index: number) {
        return this.statusNameArray[index] || "";
    }

    /**
     * 清空某个状态的数据
     * @param name 状态名
     */
    private _clearStatus(name: string) {
        this.statusData = this.statusData.filter((item) => {
            return item.status !== name;
        });
    }

    /**
     * 保存时，生成对应的StatusData数据集合
     * @param name 状态名
     * @returns
     */
    private _getNodeSaveData(name) {
        let datas: StatusData[] = [];

        this.statusNodes.forEach((item) => {
            let data: StatusData = new StatusData();
            data.status = name;
            data.fileId = item["_prefab"]["fileId"];
            data.active = !!item.active;
            data.position = new Vec3(item.position.x, item.position.y, item.position.z);
            data.scale = new Vec3(item.scale.x, item.scale.y, item.scale.z);
            data.rotation = new math.Quat(item.rotation.x, item.rotation.y, item.rotation.z, item.rotation.w);

            let uiTransform = item.getComponent(UITransform);
            if (uiTransform) {
                data.size = new Vec2(uiTransform.contentSize.width, uiTransform.contentSize.height);
                data.anchor = new Vec2(uiTransform.anchorPoint.x, uiTransform.anchorPoint.y);
            }

            let label = item.getComponent(Label);
            if (label) {
                data.color = new Vec3(label.color.r, label.color.g, label.color.b);
                data.opacity = label.color.a;
                data.string = label.string;
                data.fontsize = label.fontSize;
                data.label_font = label.font;
            }
            let richText = item.getComponent(RichText);
            if (richText) {
                data.string = richText.string;
                data.fontsize = richText.fontSize;
            }

            let sprite = item.getComponent(Sprite);
            if (sprite) {
                data.color = new Vec3(sprite.color.r, sprite.color.g, sprite.color.b);
                data.opacity = sprite.color.a;
                data.spriteFrame = sprite.spriteFrame;
                data.grayscale = sprite.grayscale;
            }

            let uiOpacity = item.getComponent(UIOpacity);
            if (uiOpacity) {
                data.opacity = uiOpacity.opacity;
            }

            let outline = item.getComponent(LabelOutline);
            if (outline) {
                data.outlinecolor = new Vec3(outline.color.r, outline.color.g, outline.color.b);
                data.outlineWidth = outline.width;
            }
            datas.push(data);
        });
        return datas;
    }

    /**
     * 保存数据，用于编辑器，业务逻辑请勿调用
     * @returns
     */
    private _save() {
        let index = this._statusIndex;
        let name = this.getStatusNameByIndex(index);
        if (!name) {
            alert("请先选择保存到第几个状态");
            return;
        }
        this._clearStatus(name);
        let data = this._getNodeSaveData(name);
        this.statusData = this.statusData.concat(data);

        this.statusData = this.statusData.filter((item) => {
            return this.statusNameArray.indexOf(item.status) !== -1;
        });

        alert("状态保存成功\n确认编辑完毕后，请保存预置体或场景");
    }
}
