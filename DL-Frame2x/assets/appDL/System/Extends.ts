/*******************************************************************************
 * 描述:    节点扩展
*******************************************************************************/
import timekeep from "../Component/timekeep";
import labelChange from "../Component/labelChange";
import listSpfs from "../Component/listSpfs";
import richTextPlus from "../Component/richTextPlus";
import roundBox from "../Component/roundBox";
import CCMVideo from "../Component/VideoUi/CCMVideo";
import pageRoll from "../Component/pageRoll";
import switcher from "../Component/switcher";
import customPolygon from "../Component/customPolygon";
import virtualList from "../Component/virtualList";
import videoPlay from "../Component/VideoUi/videoPlay";

if (!Object.getOwnPropertyDescriptor(cc.Node.prototype, "nodes")) {
    Object.defineProperties(cc.Node.prototype, {
        nodes: {
            get(this: cc.Node) {
                if (!this.nodesCache) {
                    //初始化一次
                    var _cache = { nodesCache: {} };
                    this.walk((_node) => {
                        _cache.nodesCache[_node.name] = _node;
                    }, (node) => { });
                    this.attr(_cache);
                }
                return this.nodesCache;
            }
        },
        string: {
            get(this: cc.Node) {
                if (!this.label && !this.richText) {
                    return `node: ${this.name} don't find label component`;
                }
                return this.label ? this.label.string : this.richText.string;
            },
            set(this: cc.Node, str: string | number) {
                if (!str && str !== 0) str = "";
                if (this.label) this.label.string = str.toString();
                else if (this.richText) this.richText.string = str.toString();
            },
        },
        label: {
            get(this: cc.Node) {
                return this.getComponent(cc.Label);
            },
        },
        labelOutline: {
            get(this: cc.Node) {
                return this.getComponent(cc.LabelOutline);
            },
        },
        richText: {
            get(this: cc.Node) {
                return this.getComponent(cc.RichText);
            },
        },
        mask: {
            get(this: cc.Node) {
                return this.getComponent(cc.Mask);
            },
        },
        sprite: {
            get(this: cc.Node) {
                return this.getComponent(cc.Sprite);
            },
        },
        spine: {
            get(this: cc.Node) {
                return this.getComponent(sp.Skeleton);
            },
        },
        blockInputEvents: {
            get(this: cc.Node) {
                return this.getComponent(cc.BlockInputEvents);
            },
        },
        button: {
            get(this: cc.Node) {
                return this.getComponent(cc.Button);
            },
        },
        editBox: {
            get(this: cc.Node) {
                return this.getComponent(cc.EditBox);
            },
        },
        layout: {
            get(this: cc.Node) {
                return this.getComponent(cc.Layout);
            },
        },
        pageView: {
            get(this: cc.Node) {
                return this.getComponent(cc.PageView);
            },
        },
        progressBar: {
            get(this: cc.Node) {
                return this.getComponent(cc.ProgressBar);
            },
        },
        scrollView: {
            get(this: cc.Node) {
                return this.getComponent(cc.ScrollView);
            },
        },
        slider: {
            get(this: cc.Node) {
                return this.getComponent(cc.Slider);
            },
        },
        widget: {
            get(this: cc.Node) {
                return this.getComponent(cc.Widget);
            },
        },
        animation: {
            get(this: cc.Node) {
                return this.getComponent(cc.Animation);
            },
        },
        toggle: {
            get(this: cc.Node) {
                return this.getComponent(cc.Toggle);
            },
        },
        polygonCollider: {
            get(this: cc.Node) {
                return this.getComponent(cc.PolygonCollider);
            },
        },
        physicsPolygonCollider: {
            get(this: cc.Node) {
                return this.getComponent(cc.PhysicsPolygonCollider);
            },
        },
        rigidBody: {
            get(this: cc.Node) {
                return this.getComponent(cc.RigidBody);
            },
        },
        particleSystem: {
            get(this: cc.Node) {
                return this.getComponent(cc.ParticleSystem);
            }
        },


        //新增组件
        virtualList: {
            get(this: cc.Node) {
                return this.getComponent(virtualList);
            },
        },
        labelChange: {
            get(this: cc.Node) {
                return this.getComponent(labelChange);
            },
        },
        richTextPlus: {
            get(this: cc.Node) {
                return this.getComponent(richTextPlus);
            },
        },
        listSpfs: {
            get(this: cc.Node) {
                return this.getComponent(listSpfs);
            },
        },
        videoPlay: {
            get(this: cc.Node) {
                return this.getComponent(videoPlay);
            },
        },
        roundBox: {
            get(this: cc.Node) {
                return this.getComponent(roundBox);
            },
        },
        timekeep: {
            get(this: cc.Node) {
                return this.getComponent(timekeep);
            },
        },
        pageRoll: {
            get(this: cc.Node) {
                return this.getComponent(pageRoll);
            },
        },
        switcher: {
            get(this: cc.Node) {
                return this.getComponent(switcher);
            },
        },
        customPolygon: {
            get(this: cc.Node) {
                return this.getComponent(customPolygon);
            },
        },

        uiPosition: {
            get(this: cc.Node) {
                let startWp = this.convertToWorldSpaceAR(cc.Vec2.ZERO);
                let startPos = G.main.rootNode.convertToNodeSpaceAR(startWp);
                return cc.v3(startPos.x, startPos.y);
            },
        }
    });
}
if (!Object.getOwnPropertyDescriptor(cc.Component.prototype, "nodes")) {
    Object.defineProperties(cc.Component.prototype, {
        nodes: {
            get(this: cc.Component) {
                return this.node?.nodes;
            },
        },
    });
}

