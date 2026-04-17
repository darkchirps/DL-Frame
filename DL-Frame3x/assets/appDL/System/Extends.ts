/*******************************************************************************
 * 描述:    扩展节点提示组件
*******************************************************************************/
import {
    Button, EditBox, Label, Animation, Layout, Mask, Node, Vec3, Toggle, Component, SpriteFrame,
    PageView, PageViewIndicator, ParticleSystem, ProgressBar, RichText, SafeArea, ScrollView, v3, View, PolygonCollider2D,
    Slider, Sprite, UIOpacity, UITransform, Widget, js, sp, BlockInputEvents, EventTouch, view, CircleCollider2D, RigidBody2D,
    director, Director
} from "cc";
import i18n from "../Component/i18n";
import labelChange from "../Component/labelChange";
import listSpfs from "../Component/listSpfs";
import virtualList from "../Component/virtualList";
import gradient from "../Shader/gradient/gradient";
import { maskplus } from "../Component/maskplus";

// 脏标记集合：记录本帧内需要重排子节点的父节点
const _dirtyParents = new Set<Node>();
let _sortScheduled = false;

function _flushZIndexSort() {
    _dirtyParents.forEach(parent => {
        if (!parent || !parent.isValid) return;
        const children = parent.children;
        // 只有存在 __zIndex 标记的节点才参与排序，其余保持原位
        const sorted = children.slice().sort((a, b) => {
            const az = (a as any).__zIndex ?? a.getSiblingIndex();
            const bz = (b as any).__zIndex ?? b.getSiblingIndex();
            return az - bz;
        });
        for (let i = 0; i < sorted.length; i++) {
            sorted[i].setSiblingIndex(i);
        }
    });
    _dirtyParents.clear();
    _sortScheduled = false;
}

function markZIndexDirty(parent: Node) {
    if (!parent || !parent.isValid) return;
    _dirtyParents.add(parent);
    if (!_sortScheduled) {
        _sortScheduled = true;
        // 帧末统一排序，同一帧多次 set zIndex 只排序一次
        director.once(Director.EVENT_AFTER_UPDATE, _flushZIndexSort);
    }
}

if (!Object.getOwnPropertyDescriptor(Node.prototype, "nodes")) {
    Object.defineProperties(Node.prototype, {
        nodes: {
            get(this: Node) {
                if (!this.nodesCache) {
                    const _cache = { nodesCache: {} };
                    this.walk((_node) => {
                        _cache.nodesCache[_node.name] = _node;
                    });
                    this.attr(_cache);
                }
                return this.nodesCache;
            },
        },
        // 手动刷新 nodes 缓存（节点树增删后调用）
        refreshNodes: {
            value(this: Node) {
                const cache: Record<string, Node> = {};
                this.walk((_node) => {
                    cache[_node.name] = _node;
                });
                this.attr({ nodesCache: cache });
            },
        },
        uiTransform: {
            get(this: Node) {
                return this.getComponent(UITransform) ?? this.addComponent(UITransform);
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
                return (this as any).__zIndex ?? this.getSiblingIndex();
            },
            set(this: Node, val: number) {
                if ((this as any).__zIndex === val) return; // 值未变则跳过
                (this as any).__zIndex = val;
                markZIndexDirty(this.parent);
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
                return (this.getComponent(UIOpacity) ?? this.addComponent(UIOpacity)).opacity;
            },
            set(this: Node, v: number) {
                (this.getComponent(UIOpacity) ?? this.addComponent(UIOpacity)).opacity = v;
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
                return this.getComponent(Sprite)?.spriteFrame ?? null;
            },
            set(this: Node, v: SpriteFrame) {
                (this.getComponent(Sprite) ?? this.addComponent(Sprite)).spriteFrame = v;
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
                if (!G?.main?.other?.uiTransform) {
                    console.warn('uiPosition: G.main.other is not ready');
                    return v3(0, 0);
                }
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

