/*******************************************************************************
 * 描述:    扩展节点提示组件
*******************************************************************************/
import {
    Button, EditBox, Label, Animation, Layout, Mask, Node, Vec3, Toggle, Component, SpriteFrame,
    PageView, PageViewIndicator, ParticleSystem, ProgressBar, RichText, SafeArea, ScrollView, v3, View, PolygonCollider2D,
    Slider, Sprite, UIOpacity, UITransform, Widget, js, sp, BlockInputEvents, EventTouch, view, CircleCollider2D, RigidBody2D
} from "cc";
import i18n from "../Component/i18n";
import labelChange from "../Component/labelChange";
import listSpfs from "../Component/listSpfs";
import virtualList from "../Component/virtualList";
import gradient from "../Shader/gradient/gradient";
import { maskplus } from "../Component/maskplus";

function resetSiblingIndexByZindex(node: Node) {
    let children = node.children;
    let zorder = [];
    for (var i = 0; i < children.length; i++) {
        zorder.push({ node: children[i], zIndex: children[i].zIndex });
    }
    zorder.sort((a, b) => { return a.zIndex - b.zIndex });
    for (var i = 0; i < zorder.length; i++) {
        zorder[i].node.setSiblingIndex(i);
    }
    return zorder;
}

if (!Object.getOwnPropertyDescriptor(Node.prototype, "nodes")) {
    Object.defineProperties(Node.prototype, {
        nodes: {
            get(this: Node) {
                if (!this.nodesCache) {
                    //初始化一次
                    var _cache = { nodesCache: {} };
                    this.walk((_node) => {
                        _cache.nodesCache[_node.name] = _node;
                    });
                    this.attr(_cache);
                }
                return this.nodesCache;
            },
        },
        uiTransform: {
            get(this: Node) {
                if (!this.getComponent(UITransform)) {
                    this.addComponent(UITransform);
                }
                return this.getComponent(UITransform);
            },
        },
        string: {
            get(this: Node) {
                if (!this.label && !this.richText) {
                    return `node: ${this.name} don't find label component`;
                }
                return this.label ? this.label.string : this.richText.string;
            },
            set(this: Node, str: string | number) {
                if (!str && str !== 0) str = "";
                if (this.label) this.label.string = str.toString();
                else if (this.richText) this.richText.string = str.toString();
            },
        },
        scaleXY: {
            get(this: Node) {
                return this.scale.x;
            },
            set(this: Node, v: number) {
                this.setScale(v, v, 1);
            },
        },
        zIndex: {
            get(this: Node) {
                return this.__zIndex == null ? this.getSiblingIndex() : this.__zIndex;
            },
            set(this: Node, val: number) {
                // if (val == this.zIndex) return;
                this.__zIndex = val;
                resetSiblingIndexByZindex(this.parent);
            },
        },
        label: {
            get(this: Node) {
                return this.getComponent(Label);
            },
        },
        richText: {
            get(this: Node) {
                return this.getComponent(RichText);
            },
        },
        mask: {
            get(this: Node) {
                return this.getComponent(Mask);
            },
        },
        polygonCollider2D: {
            get(this: Node) {
                return this.getComponent(PolygonCollider2D);
            },
        },
        spine: {
            get(this: Node) {
                return this.getComponent(sp.Skeleton);
            },
        },
        blockInputEvents: {
            get(this: Node) {
                return this.getComponent(BlockInputEvents);
            },
        },
        button: {
            get(this: Node) {
                return this.getComponent(Button);
            },
        },
        editBox: {
            get(this: Node) {
                return this.getComponent(EditBox);
            },
        },
        layout: {
            get(this: Node) {
                return this.getComponent(Layout);
            },
        },
        pageView: {
            get(this: Node) {
                return this.getComponent(PageView);
            },
        },
        pageViewIndicator: {
            get(this: Node) {
                return this.getComponent(PageViewIndicator);
            },
        },
        progressBar: {
            get(this: Node) {
                return this.getComponent(ProgressBar);
            },
        },
        safeArea: {
            get(this: Node) {
                return this.getComponent(SafeArea);
            },
        },
        scrollView: {
            get(this: Node) {
                return this.getComponent(ScrollView);
            },
        },
        slider: {
            get(this: Node) {
                return this.getComponent(Slider);
            },
        },
        widget: {
            get(this: Node) {
                return this.getComponent(Widget);
            },
        },
        opacity: {
            get(this: Node) {
                if (!this.getComponent(UIOpacity)) {
                    this.addComponent(UIOpacity);
                }
                return this.getComponent(UIOpacity).opacity;
            },
            set(this: Node, v: number) {
                if (!this.getComponent(UIOpacity)) {
                    this.addComponent(UIOpacity);
                }
                this.getComponent(UIOpacity).opacity = v;
            },
        },
        animation: {
            get(this: Node) {
                return this.getComponent(Animation);
            },
        },
        toggle: {
            get(this: Node) {
                return this.getComponent(Toggle);
            },
        },
        rigidBody2D: {
            get(this: Node) {
                return this.getComponent(RigidBody2D);
            },
        },
        circleCollider2D: {
            get(this: Node) {
                return this.getComponent(CircleCollider2D);
            },
        },
        sprite: {
            get(this: Node) {
                return this.getComponent(Sprite);
            },
        },
        spriteFrame: {
            get(this: Node) {
                return this.getComponent(Sprite).spriteFrame;
            },
            set(this: Node, v: SpriteFrame) {
                if (!this.getComponent(Sprite)) {
                    this.addComponent(Sprite);
                }
                this.getComponent(Sprite).spriteFrame = v;
            }
        },

        //新增组件
        /**文本渐变*/
        gradient: {
            get(this: Node) {
                return this.getComponent(gradient);
            },
        },
        /**图片切换*/
        listSpfs: {
            get(this: Node) {
                return this.getComponent(listSpfs);
            },
        },
        /**多边形遮罩*/
        maskplus: {
            get(this: Node) {
                return this.getComponent(maskplus);
            },
        },
        /**虚拟列表(含分页)*/
        virtualList: {
            get(this: Node) {
                return this.getComponent(virtualList);
            },
        },
        /**数值滚动*/
        labelChange: {
            get(this: Node) {
                return this.getComponent(labelChange);
            },
        },
        /**多语言*/
        i18n: {
            get(this: Node) {
                return this.getComponent(i18n);
            },
        },
        uiPosition: {
            get(this: Node) {
                let startWp = this.uiTransform.convertToWorldSpaceAR(Vec3.ZERO);
                let startPos = G.main.other.uiTransform.convertToNodeSpaceAR(startWp);
                return v3(startPos.x, startPos.y);
            },
        }
    });
}

if (!Object.getOwnPropertyDescriptor(Component.prototype, "nodes")) {
    Object.defineProperties(Component.prototype, {
        nodes: {
            get(this: Component) {
                return this.node?.nodes;
            },
        },
    });
}

