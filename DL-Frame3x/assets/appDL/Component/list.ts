/*******************************************************************************
 * 描述:    虚拟列表组件
*******************************************************************************/

const { ccclass, property, disallowMultiple, menu, executionOrder, requireComponent } = _decorator;
import { Node, Event, Component, Enum, tween, _decorator, EventHandler, Tween, ScrollView, Prefab, Layout, Vec2, Size, NodePool, isValid, instantiate, Vec3, Widget, UITransform, CCFloat, CCBoolean, CCInteger, js } from "cc";
import { DEV } from "cc/env";
import UIScr from "../Manager/UIScr";

enum SelectedType {
    NONE = 0,
    SINGLE = 1, //单选
    MULT = 2, //多选
}

@ccclass
@disallowMultiple()
@menu("常用组件/list")
@requireComponent(ScrollView)
//脚本生命周期回调的执行优先级。小于 0 的脚本将优先执行，大于 0 的脚本将最后执行。该优先级只对 onLoad, onEnable, start, update 和 lateUpdate 有效，对 onDisable 和 onDestroy 无效。
@executionOrder(-5000)
export default class list extends Component {
    //模板Item（Node）
    @property({ type: Node }) tmpNode: Node = null;

    public lackCenter: boolean = false;
    // 该组件为纯虚拟列表（不再提供切换或循环模式）
    //刷新频率
    @property({ type: CCInteger })
    private _updateRate: number = 0;
    @property({
        type: CCInteger,
        range: [0, 6, 1],
        tooltip: DEV && "刷新频率（值越大刷新频率越低、性能越高）",
        slide: true,
    })
    set updateRate(val: number) {
        if (val >= 0 && val <= 6) {
            this._updateRate = val;
        }
    }
    get updateRate() {
        return this._updateRate;
    }
    //分帧渲染（每帧渲染的Item数量（<=0时关闭分帧渲染））
    @property({
        type: CCInteger,
        range: [0, 12, 1],
        tooltip: DEV && "逐帧渲染时，每帧渲染的Item数量（<=0时关闭分帧渲染）",
        slide: true,
    })
    public frameByFrameRenderNum: number = 0;
    //渲染事件（渲染器）
    @property({
        type: EventHandler,
        tooltip: DEV && "渲染事件（渲染器）",
    })
    public renderEvent: EventHandler = new EventHandler();

    // 是否使用 content 上的 Layout 来排列子节点（在编辑器中打开可更直观显示）
    @property({ tooltip: DEV && "使用 ScrollView.content 的 Layout 布局来排列子节点（可在编辑器打开，运行时可关闭以优化性能）" })
    public useLayout: boolean = true;

    //绑定渲染回调事件
    bindRenderEvent(uiScr: UIScr, handler: string, num: number = 1) {
        this.renderEvent.target = uiScr.node;
        this.renderEvent.component = js.getClassName(uiScr);
        this.renderEvent.handler = handler;
        this.numItems = num;
    }

    //选择模式
    @property({
        type: Enum(SelectedType),
        tooltip: DEV && "选择模式",
    })
    public selectedMode: SelectedType = SelectedType.NONE;
    //触发选择事件

    public selectedEvent: EventHandler = new EventHandler();

    //绑定item选择回调事件
    public bindSelectedEvent(uiLogic: UIScr, handler: string) {
        this.selectedEvent.target = uiLogic.node;
        this.selectedEvent.component = js.getClassName(uiLogic);
        this.selectedEvent.handler = handler;
    }

    public repeatEventSingle: boolean = false;

    //当前选择id
    private _selectedId: number = -1;
    private _lastSelectedId: number;
    private multSelected: number[] = [];
    set selectedId(val: number) {
        let t: any = this;
        let item: any;
        switch (t.selectedMode) {
            case SelectedType.SINGLE: {
                if (!t.repeatEventSingle && val == t._selectedId) return;
                item = t.getItemByListId(val);
                if (t._selectedId >= 0) t._lastSelectedId = t._selectedId;
                //如果＜0则取消选择，把_lastSelectedId也置空吧，如果以后有特殊需求再改吧。
                else t._lastSelectedId = null;
                t._selectedId = val;
                if (t._lastSelectedId >= 0 && t._lastSelectedId != t._selectedId) {
                    let lastItem: any = t.getItemByListId(t._lastSelectedId);
                    if (lastItem) {
                        // 移除 ListItem 依赖：用通用属性记录选中状态（如果原生组件存在请自行处理）
                        lastItem["selected"] = false;
                    }
                }
                if (t.selectedEvent) {
                    EventHandler.emitEvents([t.selectedEvent], item, val % this._actualNumItems, t._lastSelectedId == null ? null : t._lastSelectedId % this._actualNumItems);
                }
                break;
            }
            case SelectedType.MULT: {
                item = t.getItemByListId(val);
                if (!item) return;
                if (t._selectedId >= 0) t._lastSelectedId = t._selectedId;
                t._selectedId = val;
                // 移除 ListItem 依赖：使用节点上的通用属性保存选中状态
                let bool: boolean = !item["selected"];
                item["selected"] = bool;
                let sub: number = t.multSelected.indexOf(val);
                if (bool && sub < 0) {
                    t.multSelected.push(val);
                } else if (!bool && sub >= 0) {
                    t.multSelected.splice(sub, 1);
                }
                if (t.selectedEvent) {
                    EventHandler.emitEvents([t.selectedEvent], item, val % this._actualNumItems, t._lastSelectedId == null ? null : t._lastSelectedId % this._actualNumItems, bool);
                }
                break;
            }
        }
    }
    get selectedId() {
        return this._selectedId;
    }
    private _forceUpdate: boolean = false;
    private _align: number;
    private _horizontalDir: number;
    private _verticalDir: number;
    private _startAxis: number;
    private _alignCalcType: number;
    public content: Node;
    private _contentUt: UITransform;
    private _lastContentW = 0;
    private _lastContentH = 0;
    private firstListId: number;
    public displayItemNum: number;
    private _updateDone: boolean = true;
    private _updateCounter: number;
    public _actualNumItems: number;
    // 循环列表相关字段已移除，组件为单一虚拟列表实现

    /**当前的id */
    public listId: number = 0;
    //列表数量
    @property({
        serializable: false,
    })
    private _numItems: number = 0;
    set numItems(val: number) {
        let t = this;
        if (!t.checkInited(false)) return;
        if (val == null || val < 0) {
            console.error("numItems set the wrong::", val, "如果是加了widget适配List大小，初始化可无视这条警告");
            return;
        }
        t._actualNumItems = t._numItems = val;
        t._forceUpdate = true;

        t._resizeContent();
        t._onScrolling();
    }
    get numItems() {
        return this._actualNumItems;
    }

    private _inited: boolean = false;
    private _scrollView: ScrollView;
    get scrollView() {
        return this._scrollView;
    }
    private _layout: Layout;
    private _resizeMode: number;
    private _topGap: number;
    private _rightGap: number;
    private _bottomGap: number;
    private _leftGap: number;

    private _columnGap: number;
    private _lineGap: number;
    private _colLineNum: number;

    private _lastDisplayData: number[];
    public displayData: any[];
    private _pool: NodePool;

    private _itemTmp: any;
    private _itemTmpUt: UITransform;
    private _needUpdateWidget: boolean = false;
    private _itemSize: Size;
    private _sizeType: boolean;

    public _customSize: any;

    private frameCount: number;
    private _aniDelRuning: boolean = false;
    private _aniDelCB: Function;
    private _aniDelItem: any;
    private _aniDelBeforePos: Vec2;
    private _aniDelBeforeScale: number;
    private viewTop: number;
    private viewRight: number;
    private viewBottom: number;
    private viewLeft: number;

    private _doneAfterUpdate: boolean = false;

    private elasticTop: number;
    private elasticRight: number;
    private elasticBottom: number;
    private elasticLeft: number;

    private scrollToListId: number;

    private adhering: boolean = false;

    private _adheringBarrier: boolean = false;
    private nearestListId: number;

    public curPageNum: number = 0;
    private _beganPos: number;
    private _scrollPos: number;
    private _curScrollIsTouch: boolean; //当前滑动是否为手动

    private _scrollToListId: number;
    private _scrollToEndTime: number;
    private _scrollToSo: any;

    private _lack: boolean;
    private _allItemSize: number;
    private _allItemSizeNoEdge: number;

    private _scrollItem: any; //当前控制 ScrollView 滚动的 Item

    private _thisNodeUt: UITransform;

    //----------------------------------------------------------------------------

    onLoad() {
        this._init();
    }

    onDestroy() {
        let t: any = this;
        if (isValid(t._itemTmp)) t._itemTmp.destroy();
        if (isValid(t.tmpNode)) t.tmpNode.destroy();
        t._pool && t._pool.clear();
    }

    onEnable() {
        // if (!EDITOR)
        this._registerEvent();
        this._init();
        // 处理重新显示后，有可能上一次的动画移除还未播放完毕，导致动画卡住的问题
        if (this._aniDelRuning) {
            this._aniDelRuning = false;
            if (this._aniDelItem) {
                if (this._aniDelBeforePos) {
                    this._aniDelItem.position = this._aniDelBeforePos;
                    delete this._aniDelBeforePos;
                }
                if (this._aniDelBeforeScale) {
                    this._aniDelItem.scale = this._aniDelBeforeScale;
                    delete this._aniDelBeforeScale;
                }
                delete this._aniDelItem;
            }
            if (this._aniDelCB) {
                this._aniDelCB();
                delete this._aniDelCB;
            }
        }
    }

    onDisable() {
        // if (!EDITOR)
        this._unregisterEvent();
    }
    //注册事件
    _registerEvent() {
        let t: any = this;
        t.node.on(Node.EventType.TOUCH_START, t._onTouchStart, t);
        t.node.on("touch-up", t._onTouchUp, t);
        t.node.on(Node.EventType.TOUCH_CANCEL, t._onTouchCancelled, t);
        t.node.on("scroll-began", t._onScrollBegan, t);
        t.node.on("scroll-ended", t._onScrollEnded, t);
        t.node.on("scrolling", t._onScrolling, t);
        t.node.on(Node.EventType.SIZE_CHANGED, t._onSizeChanged, t);
        t._contentUt.node.on(Node.EventType.SIZE_CHANGED, t._onContentSizeChanged, t);
    }
    //卸载事件
    _unregisterEvent() {
        let t: any = this;
        t.node.off(Node.EventType.TOUCH_START, t._onTouchStart, t);
        t.node.off("touch-up", t._onTouchUp, t);
        t.node.off(Node.EventType.TOUCH_CANCEL, t._onTouchCancelled, t);
        t.node.off("scroll-began", t._onScrollBegan, t);
        t.node.off("scroll-ended", t._onScrollEnded, t);
        t.node.off("scrolling", t._onScrolling, t);
        t.node.off(Node.EventType.SIZE_CHANGED, t._onSizeChanged, t);
        t._contentUt.node.off(Node.EventType.SIZE_CHANGED, t._onContentSizeChanged, t);
    }
    //初始化各种..
    _init() {
        let t: any = this;
        if (t._inited) return;

        t._thisNodeUt = t.node.getComponent(UITransform);
        t._scrollView = t.node.getComponent(ScrollView);

        t.content = t._scrollView.content;
        t._contentUt = t.content.getComponent(UITransform);

        t._lastContentW = t._contentUt.width;
        t._lastContentH = t._contentUt.height;

        if (!t.content) {
            console.error(t.node.name + "'s ScrollView unset content!");
            return;
        }

        t._layout = t.content.getComponent(Layout);

        t._align = t._layout.type; //排列模式
        t._resizeMode = t._layout.resizeMode; //自适应模式
        t._startAxis = t._layout.startAxis;

        t._topGap = t._layout.paddingTop; //顶边距
        t._rightGap = t._layout.paddingRight; //右边距
        t._bottomGap = t._layout.paddingBottom; //底边距
        t._leftGap = t._layout.paddingLeft; //左边距

        t._columnGap = t._layout.spacingX; //列距
        t._lineGap = t._layout.spacingY; //行距

        t._colLineNum; //列数或行数（非GRID模式则=1，表示单列或单行）;

        t._verticalDir = t._layout.verticalDirection; //垂直排列子节点的方向
        t._horizontalDir = t._layout.horizontalDirection; //水平排列子节点的方向

        t.setTemplateItem(instantiate(t.tmpNode));

        // 该组件始终为虚拟列表，lackCenter 保持原行为（只对虚拟列表有意义）

        t._lastDisplayData = []; //最后一次刷新的数据
        t.displayData = []; //当前数据
        t._pool = new NodePool(); //这是个池子..
        t._forceUpdate = false; //是否强制更新
        t._updateCounter = 0; //当前分帧渲染帧数
        t._updateDone = true; //分帧渲染是否完成

        t.curPageNum = 0; //当前页数

        // 已移除循环列表（cyclic）支持；不覆写 ScrollView 的自动滚动逻辑

        switch (t._align) {
            case Layout.Type.HORIZONTAL: {
                switch (t._horizontalDir) {
                    case Layout.HorizontalDirection.LEFT_TO_RIGHT:
                        t._alignCalcType = 1;
                        break;
                    case Layout.HorizontalDirection.RIGHT_TO_LEFT:
                        t._alignCalcType = 2;
                        break;
                }
                break;
            }
            case Layout.Type.VERTICAL: {
                switch (t._verticalDir) {
                    case Layout.VerticalDirection.TOP_TO_BOTTOM:
                        t._alignCalcType = 3;
                        break;
                    case Layout.VerticalDirection.BOTTOM_TO_TOP:
                        t._alignCalcType = 4;
                        break;
                }
                break;
            }
            case Layout.Type.GRID: {
                switch (t._startAxis) {
                    case Layout.AxisDirection.HORIZONTAL:
                        switch (t._verticalDir) {
                            case Layout.VerticalDirection.TOP_TO_BOTTOM:
                                t._alignCalcType = 3;
                                break;
                            case Layout.VerticalDirection.BOTTOM_TO_TOP:
                                t._alignCalcType = 4;
                                break;
                        }
                        break;
                    case Layout.AxisDirection.VERTICAL:
                        switch (t._horizontalDir) {
                            case Layout.HorizontalDirection.LEFT_TO_RIGHT:
                                t._alignCalcType = 1;
                                break;
                            case Layout.HorizontalDirection.RIGHT_TO_LEFT:
                                t._alignCalcType = 2;
                                break;
                        }
                        break;
                }
                break;
            }
        }
        // 清空 content
        // t.content.children.forEach((child: Node) => {
        //     child.removeFromParent();
        //     if (child != t.tmpNode && child.isValid)
        //         child.destroy();
        // });
        t.content.removeAllChildren();
        t._inited = true;
    }
    // 循环列表相关的 ScrollView 覆写逻辑已移除（组件不再支持循环）
    //设置模板Item
    setTemplateItem(item: any) {
        if (!item) return;
        let t: any = this;
        t._itemTmp = item;
        t._itemTmpUt = item.getComponent(UITransform);

        if (t._resizeMode == Layout.ResizeMode.CHILDREN) t._itemSize = t._layout.cellSize;
        else {
            let itemUt: UITransform = item.getComponent(UITransform);
            t._itemSize = new Size(itemUt.width, itemUt.height);
        }

    //尝试获取名为 ListItem 的组件（ListItem 逻辑已弱化）
    let com: any = item.getComponent && item.getComponent('ListItem');
        let remove = false;
        if (!com) remove = true;
        // if (com) {
        //     if (!com._btnCom && !item.getComponent(cc.Button)) {
        //         remove = true;
        //     }
        // }
        if (remove) {
            t.selectedMode = SelectedType.NONE;
        }
        com = item.getComponent(Widget);
        if (com && com.enabled) {
            t._needUpdateWidget = true;
        }
        if (t.selectedMode == SelectedType.MULT) t.multSelected = [];

        switch (t._align) {
            case Layout.Type.HORIZONTAL:
                t._colLineNum = 1;
                t._sizeType = false;
                break;
            case Layout.Type.VERTICAL:
                t._colLineNum = 1;
                t._sizeType = true;
                break;
            case Layout.Type.GRID:
                switch (t._startAxis) {
                    case Layout.AxisDirection.HORIZONTAL:
                        //计算列数
                        let trimW: number = t._contentUt.width - t._leftGap - t._rightGap;
                        t._colLineNum = Math.floor((trimW + t._columnGap) / (t._itemSize.width + t._columnGap));
                        t._sizeType = true;
                        break;
                    case Layout.AxisDirection.VERTICAL:
                        //计算行数
                        let trimH: number = t._contentUt.height - t._topGap - t._bottomGap;
                        t._colLineNum = Math.floor((trimH + t._lineGap) / (t._itemSize.height + t._lineGap));
                        t._sizeType = false;
                        break;
                }
                break;
        }
    }
    /**
     * 检查是否初始化
     * @param {Boolean} printLog 是否打印错误信息
     * @returns
     */
    checkInited(printLog: boolean = true) {
        if (!this._inited) {
            if (printLog) console.error("List initialization not completed!");
            return false;
        }
        return true;
    }
    //禁用 Layout 组件，自行计算 Content Size
    _resizeContent() {
        let t: any = this;
        let result: number;

        switch (t._align) {
            case Layout.Type.HORIZONTAL: {
                if (t._customSize) {
                    let fixed: any = t._getFixedSize(null);
                    result = t._leftGap + fixed.val + t._itemSize.width * (t._numItems - fixed.count) + t._columnGap * (t._numItems - 1) + t._rightGap;
                } else {
                    result = t._leftGap + t._itemSize.width * t._numItems + t._columnGap * (t._numItems - 1) + t._rightGap;
                }
                break;
            }
            case Layout.Type.VERTICAL: {
                if (t._customSize) {
                    let fixed: any = t._getFixedSize(null);
                    result = t._topGap + fixed.val + t._itemSize.height * (t._numItems - fixed.count) + t._lineGap * (t._numItems - 1) + t._bottomGap;
                } else {
                    result = t._topGap + t._itemSize.height * t._numItems + t._lineGap * (t._numItems - 1) + t._bottomGap;
                }
                break;
            }
            case Layout.Type.GRID: {
                //网格模式不支持居中
                if (t.lackCenter) t.lackCenter = false;
                switch (t._startAxis) {
                    case Layout.AxisDirection.HORIZONTAL:
                        let lineNum: number = Math.ceil(t._numItems / t._colLineNum);
                        result = t._topGap + t._itemSize.height * lineNum + t._lineGap * (lineNum - 1) + t._bottomGap;
                        break;
                    case Layout.AxisDirection.VERTICAL:
                        let colNum: number = Math.ceil(t._numItems / t._colLineNum);
                        result = t._leftGap + t._itemSize.width * colNum + t._columnGap * (colNum - 1) + t._rightGap;
                        break;
                }
                break;
            }
        }

    let layout: Layout = t.content.getComponent(Layout);
    // 根据 useLayout 决定是否启用 Layout，编辑器中可以打开查看排版效果，运行时可关闭以获得更精确的虚拟定位性能
    if (layout) layout.enabled = !!t.useLayout;

        t._allItemSize = result;
        t._allItemSizeNoEdge = t._allItemSize - (t._sizeType ? t._topGap + t._bottomGap : t._leftGap + t._rightGap);

        // 循环列表逻辑已移除，直接计算是否缺乏滚动区域
        t._lack = t._allItemSize < (t._sizeType ? t._thisNodeUt.height : t._thisNodeUt.width);
        let slideOffset: number = (!t._lack || !t.lackCenter) ? 0 : 0.1;

        let targetWH: number = t._lack ? (t._sizeType ? t._thisNodeUt.height : t._thisNodeUt.width) - slideOffset : t._allItemSize;
        if (targetWH < 0) targetWH = 0;

        if (t._sizeType) {
            t._contentUt.height = targetWH;
            t._lastContentH = targetWH;
        } else {
            t._contentUt.width = targetWH;
            t._lastContentW = targetWH;
        }
    }

    //滚动进行时...
    _onScrolling(ev: Event = null) {
        if (this.frameCount == null) this.frameCount = this._updateRate;
        if (!this._forceUpdate && ev && ev.type != "scroll-ended" && this.frameCount > 0) {
            this.frameCount--;
            return;
        } else this.frameCount = this._updateRate;

        if (this._aniDelRuning) return;

        this._calcViewPos();

        let vTop: number, vRight: number, vBottom: number, vLeft: number;
        if (this._sizeType) {
            vTop = this.viewTop;
            vBottom = this.viewBottom;
        } else {
            vRight = this.viewRight;
            vLeft = this.viewLeft;
        }

        // if (this._virtual) {
        this.displayData = [];
        let itemPos: any;

        let curId: number = 0;
        let endId: number = this._numItems - 1;

        if (this._customSize) {
            let breakFor: boolean = false;
            //如果该item的位置在可视区域内，就推入displayData
            for (; curId <= endId && !breakFor; curId++) {
                itemPos = this._calcItemPos(curId);
                switch (this._align) {
                    case Layout.Type.HORIZONTAL:
                        if (itemPos.right >= vLeft && itemPos.left <= vRight) {
                            this.displayData.push(itemPos);
                        } else if (curId != 0 && this.displayData.length > 0) {
                            breakFor = true;
                        }
                        break;
                    case Layout.Type.VERTICAL:
                        if (itemPos.bottom <= vTop && itemPos.top >= vBottom) {
                            this.displayData.push(itemPos);
                        } else if (curId != 0 && this.displayData.length > 0) {
                            breakFor = true;
                        }
                        break;
                    case Layout.Type.GRID:
                        switch (this._startAxis) {
                            case Layout.AxisDirection.HORIZONTAL:
                                if (itemPos.bottom <= vTop && itemPos.top >= vBottom) {
                                    this.displayData.push(itemPos);
                                } else if (curId != 0 && this.displayData.length > 0) {
                                    breakFor = true;
                                }
                                break;
                            case Layout.AxisDirection.VERTICAL:
                                if (itemPos.right >= vLeft && itemPos.left <= vRight) {
                                    this.displayData.push(itemPos);
                                } else if (curId != 0 && this.displayData.length > 0) {
                                    breakFor = true;
                                }
                                break;
                        }
                        break;
                }
            }
        } else {
            let ww: number = this._itemSize.width + this._columnGap;
            let hh: number = this._itemSize.height + this._lineGap;
            switch (this._alignCalcType) {
                case 1: //单行HORIZONTAL（LEFT_TO_RIGHT）、网格VERTICAL（LEFT_TO_RIGHT）
                    curId = (vLeft - this._leftGap) / ww;
                    endId = (vRight - this._leftGap) / ww;
                    break;
                case 2: //单行HORIZONTAL（RIGHT_TO_LEFT）、网格VERTICAL（RIGHT_TO_LEFT）
                    curId = (-vRight - this._rightGap) / ww;
                    endId = (-vLeft - this._rightGap) / ww;
                    break;
                case 3: //单列VERTICAL（TOP_TO_BOTTOM）、网格HORIZONTAL（TOP_TO_BOTTOM）
                    curId = (-vTop - this._topGap) / hh;
                    endId = (-vBottom - this._topGap) / hh;
                    break;
                case 4: //单列VERTICAL（BOTTOM_TO_TOP）、网格HORIZONTAL（BOTTOM_TO_TOP）
                    curId = (vBottom - this._bottomGap) / hh;
                    endId = (vTop - this._bottomGap) / hh;
                    break;
            }
            curId = Math.floor(curId) * this._colLineNum;
            endId = Math.ceil(endId) * this._colLineNum;
            endId--;
            if (curId < 0) curId = 0;
            if (endId >= this._numItems) endId = this._numItems - 1;
            for (; curId <= endId; curId++) {
                this.displayData.push(this._calcItemPos(curId));
            }
        }
        this._delRedundantItem();
        if (this.displayData.length <= 0 || !this._numItems) {
            //if none, delete all.
            this._lastDisplayData = [];
            return;
        }
        this.firstListId = this.displayData[0].id;
        this.displayItemNum = this.displayData.length;

        let len: number = this._lastDisplayData.length;

        let haveDataChange: boolean = this.displayItemNum != len;
        if (haveDataChange) {
            // 如果是逐帧渲染，需要排序
            if (this.frameByFrameRenderNum > 0) {
                this._lastDisplayData.sort((a, b) => {
                    return a - b;
                });
            }
            // 因List的显示数据是有序的，所以只需要判断数组长度是否相等，以及头、尾两个元素是否相等即可。
            haveDataChange = this.firstListId != this._lastDisplayData[0] || this.displayData[this.displayItemNum - 1].id != this._lastDisplayData[len - 1];
        }

        if (this._forceUpdate || haveDataChange) {
            //如果是强制更新
            if (this.frameByFrameRenderNum > 0) {
                //逐帧渲染
                if (this._numItems > 0) {
                    if (!this._updateDone) {
                        this._doneAfterUpdate = true;
                    } else {
                        this._updateCounter = 0;
                    }
                    this._updateDone = false;
                } else {
                    this._updateCounter = 0;
                    this._updateDone = true;
                }
                // }
            } else {
                //直接渲染
                this._lastDisplayData = [];
                for (let c = 0; c < this.displayItemNum; c++) {
                    this._createOrUpdateItem(this.displayData[c]);
                }
                this._forceUpdate = false;
            }
        }
        this._calcNearestItem();
        // }
    }
    //计算可视范围
    _calcViewPos() {
        let scrollPos: any = this.content.getPosition();
        switch (this._alignCalcType) {
            case 1: //单行HORIZONTAL（LEFT_TO_RIGHT）、网格VERTICAL（LEFT_TO_RIGHT）
                this.elasticLeft = scrollPos.x > 0 ? scrollPos.x : 0;
                this.viewLeft = (scrollPos.x < 0 ? -scrollPos.x : 0) - this.elasticLeft;

                this.viewRight = this.viewLeft + this._thisNodeUt.width;
                this.elasticRight = this.viewRight > this._contentUt.width ? Math.abs(this.viewRight - this._contentUt.width) : 0;
                this.viewRight += this.elasticRight;
                // cc.log(this.elasticLeft, this.elasticRight, this.viewLeft, this.viewRight);
                break;
            case 2: //单行HORIZONTAL（RIGHT_TO_LEFT）、网格VERTICAL（RIGHT_TO_LEFT）
                this.elasticRight = scrollPos.x < 0 ? -scrollPos.x : 0;
                this.viewRight = (scrollPos.x > 0 ? -scrollPos.x : 0) + this.elasticRight;
                this.viewLeft = this.viewRight - this._thisNodeUt.width;
                this.elasticLeft = this.viewLeft < -this._contentUt.width ? Math.abs(this.viewLeft + this._contentUt.width) : 0;
                this.viewLeft -= this.elasticLeft;
                // cc.log(this.elasticLeft, this.elasticRight, this.viewLeft, this.viewRight);
                break;
            case 3: //单列VERTICAL（TOP_TO_BOTTOM）、网格HORIZONTAL（TOP_TO_BOTTOM）
                this.elasticTop = scrollPos.y < 0 ? Math.abs(scrollPos.y) : 0;
                this.viewTop = (scrollPos.y > 0 ? -scrollPos.y : 0) + this.elasticTop;
                this.viewBottom = this.viewTop - this._thisNodeUt.height;
                this.elasticBottom = this.viewBottom < -this._contentUt.height ? Math.abs(this.viewBottom + this._contentUt.height) : 0;
                this.viewBottom += this.elasticBottom;
                // cc.log(this.elasticTop, this.elasticBottom, this.viewTop, this.viewBottom);
                break;
            case 4: //单列VERTICAL（BOTTOM_TO_TOP）、网格HORIZONTAL（BOTTOM_TO_TOP）
                this.elasticBottom = scrollPos.y > 0 ? Math.abs(scrollPos.y) : 0;
                this.viewBottom = (scrollPos.y < 0 ? -scrollPos.y : 0) - this.elasticBottom;
                this.viewTop = this.viewBottom + this._thisNodeUt.height;
                this.elasticTop = this.viewTop > this._contentUt.height ? Math.abs(this.viewTop - this._contentUt.height) : 0;
                this.viewTop -= this.elasticTop;
                // cc.log(this.elasticTop, this.elasticBottom, this.viewTop, this.viewBottom);
                break;
        }
    }
    //计算位置 根据id
    _calcItemPos(id: number) {
        let width: number, height: number, top: number, bottom: number, left: number, right: number, itemX: number, itemY: number;
        switch (this._align) {
            case Layout.Type.HORIZONTAL:
                switch (this._horizontalDir) {
                    case Layout.HorizontalDirection.LEFT_TO_RIGHT: {
                        if (this._customSize) {
                            let fixed: any = this._getFixedSize(id);
                            left = this._leftGap + (this._itemSize.width + this._columnGap) * (id - fixed.count) + (fixed.val + this._columnGap * fixed.count);
                            let cs: number = this._customSize[id];
                            width = cs > 0 ? cs : this._itemSize.width;
                        } else {
                            left = this._leftGap + (this._itemSize.width + this._columnGap) * id;
                            width = this._itemSize.width;
                        }
                        if (this.lackCenter) {
                            left -= this._leftGap;
                            let offset: number = this._contentUt.width / 2 - this._allItemSizeNoEdge / 2;
                            left += offset;
                        }
                        right = left + width;
                        return {
                            id: id,
                            left: left,
                            right: right,
                            x: left + this._itemTmpUt.anchorX * width,
                            y: this._itemTmp.y,
                        };
                    }
                    case Layout.HorizontalDirection.RIGHT_TO_LEFT: {
                        if (this._customSize) {
                            let fixed: any = this._getFixedSize(id);
                            right = -this._rightGap - (this._itemSize.width + this._columnGap) * (id - fixed.count) - (fixed.val + this._columnGap * fixed.count);
                            let cs: number = this._customSize[id];
                            width = cs > 0 ? cs : this._itemSize.width;
                        } else {
                            right = -this._rightGap - (this._itemSize.width + this._columnGap) * id;
                            width = this._itemSize.width;
                        }
                        if (this.lackCenter) {
                            right += this._rightGap;
                            let offset: number = this._contentUt.width / 2 - this._allItemSizeNoEdge / 2;
                            right -= offset;
                        }
                        left = right - width;
                        return {
                            id: id,
                            right: right,
                            left: left,
                            x: left + this._itemTmpUt.anchorX * width,
                            y: this._itemTmp.y,
                        };
                    }
                }
                break;
            case Layout.Type.VERTICAL: {
                switch (this._verticalDir) {
                    case Layout.VerticalDirection.TOP_TO_BOTTOM: {
                        if (this._customSize) {
                            let fixed: any = this._getFixedSize(id);
                            top = -this._topGap - (this._itemSize.height + this._lineGap) * (id - fixed.count) - (fixed.val + this._lineGap * fixed.count);
                            let cs: number = this._customSize[id];
                            height = cs > 0 ? cs : this._itemSize.height;
                        } else {
                            top = -this._topGap - (this._itemSize.height + this._lineGap) * id;
                            height = this._itemSize.height;
                        }
                        if (this.lackCenter) {
                            top += this._topGap;
                            let offset: number = this._contentUt.height / 2 - this._allItemSizeNoEdge / 2;
                            top -= offset;
                        }
                        bottom = top - height;
                        return {
                            id: id,
                            top: top,
                            bottom: bottom,
                            x: this._itemTmp.x,
                            y: bottom + this._itemTmpUt.anchorY * height,
                        };
                    }
                    case Layout.VerticalDirection.BOTTOM_TO_TOP: {
                        if (this._customSize) {
                            let fixed: any = this._getFixedSize(id);
                            bottom = this._bottomGap + (this._itemSize.height + this._lineGap) * (id - fixed.count) + (fixed.val + this._lineGap * fixed.count);
                            let cs: number = this._customSize[id];
                            height = cs > 0 ? cs : this._itemSize.height;
                        } else {
                            bottom = this._bottomGap + (this._itemSize.height + this._lineGap) * id;
                            height = this._itemSize.height;
                        }
                        if (this.lackCenter) {
                            bottom -= this._bottomGap;
                            let offset: number = this._contentUt.height / 2 - this._allItemSizeNoEdge / 2;
                            bottom += offset;
                        }
                        top = bottom + height;
                        return {
                            id: id,
                            top: top,
                            bottom: bottom,
                            x: this._itemTmp.x,
                            y: bottom + this._itemTmpUt.anchorY * height,
                        };
                        break;
                    }
                }
            }
            case Layout.Type.GRID: {
                let colLine: number = Math.floor(id / this._colLineNum);
                switch (this._startAxis) {
                    case Layout.AxisDirection.HORIZONTAL: {
                        switch (this._verticalDir) {
                            case Layout.VerticalDirection.TOP_TO_BOTTOM: {
                                top = -this._topGap - (this._itemSize.height + this._lineGap) * colLine;
                                bottom = top - this._itemSize.height;
                                itemY = bottom + this._itemTmpUt.anchorY * this._itemSize.height;
                                break;
                            }
                            case Layout.VerticalDirection.BOTTOM_TO_TOP: {
                                bottom = this._bottomGap + (this._itemSize.height + this._lineGap) * colLine;
                                top = bottom + this._itemSize.height;
                                itemY = bottom + this._itemTmpUt.anchorY * this._itemSize.height;
                                break;
                            }
                        }
                        itemX = this._leftGap + (id % this._colLineNum) * (this._itemSize.width + this._columnGap);
                        switch (this._horizontalDir) {
                            case Layout.HorizontalDirection.LEFT_TO_RIGHT: {
                                itemX += this._itemTmpUt.anchorX * this._itemSize.width;
                                itemX -= this._contentUt.anchorX * this._contentUt.width;
                                break;
                            }
                            case Layout.HorizontalDirection.RIGHT_TO_LEFT: {
                                itemX += (1 - this._itemTmpUt.anchorX) * this._itemSize.width;
                                itemX -= (1 - this._contentUt.anchorX) * this._contentUt.width;
                                itemX *= -1;
                                break;
                            }
                        }
                        return {
                            id: id,
                            top: top,
                            bottom: bottom,
                            x: itemX,
                            y: itemY,
                        };
                    }
                    case Layout.AxisDirection.VERTICAL: {
                        switch (this._horizontalDir) {
                            case Layout.HorizontalDirection.LEFT_TO_RIGHT: {
                                left = this._leftGap + (this._itemSize.width + this._columnGap) * colLine;
                                right = left + this._itemSize.width;
                                itemX = left + this._itemTmpUt.anchorX * this._itemSize.width;
                                itemX -= this._contentUt.anchorX * this._contentUt.width;
                                break;
                            }
                            case Layout.HorizontalDirection.RIGHT_TO_LEFT: {
                                right = -this._rightGap - (this._itemSize.width + this._columnGap) * colLine;
                                left = right - this._itemSize.width;
                                itemX = left + this._itemTmpUt.anchorX * this._itemSize.width;
                                itemX += (1 - this._contentUt.anchorX) * this._contentUt.width;
                                break;
                            }
                        }
                        itemY = -this._topGap - (id % this._colLineNum) * (this._itemSize.height + this._lineGap);
                        switch (this._verticalDir) {
                            case Layout.VerticalDirection.TOP_TO_BOTTOM: {
                                itemY -= (1 - this._itemTmpUt.anchorY) * this._itemSize.height;
                                itemY += (1 - this._contentUt.anchorY) * this._contentUt.height;
                                break;
                            }
                            case Layout.VerticalDirection.BOTTOM_TO_TOP: {
                                itemY -= this._itemTmpUt.anchorY * this._itemSize.height;
                                itemY += this._contentUt.anchorY * this._contentUt.height;
                                itemY *= -1;
                                break;
                            }
                        }
                        return {
                            id: id,
                            left: left,
                            right: right,
                            x: itemX,
                            y: itemY,
                        };
                    }
                }
                break;
            }
        }
    }
    // NOTE: _calcExistItemPos 已移除（未被调用），使用 getItemPos / _calcItemPos 获取位置。
    //获取Item位置
    getItemPos(id: number) {
        return this._calcItemPos(id);
    }
    //获取固定尺寸
    _getFixedSize(listId: number) {
        if (!this._customSize) return null;
        if (listId == null) listId = this._numItems;
        let fixed: number = 0;
        let count: number = 0;
        for (let id in this._customSize) {
            if (parseInt(id) < listId) {
                fixed += this._customSize[id];
                count++;
            }
        }
        return {
            val: fixed,
            count: count,
        };
    }
    //滚动结束时..
    _onScrollBegan() {
        this._beganPos = this._sizeType ? this.viewTop : this.viewLeft;
    }
    //滚动结束时..
    _onScrollEnded() {
        let t: any = this;
        t._curScrollIsTouch = false;
        if (t.scrollToListId != null) {
            let item: any = t.getItemByListId(t.scrollToListId);
            t.scrollToListId = null;
            if (item) {
                tween(item).to(0.1, { scale: 1.06 }).to(0.1, { scale: 1 }).start();
            }
        }
        t._onScrolling();
    }
    // 触摸时
    _onTouchStart(ev, captureListeners) {
        if (this._scrollView["_hasNestedViewGroup"](ev, captureListeners)) return;
        this._curScrollIsTouch = true;
        let isMe = ev.eventPhase === Event.AT_TARGET && ev.target === this.node;
        if (!isMe) {
            let itemNode: any = ev.target;
            while (itemNode._listId == null && itemNode.parent) itemNode = itemNode.parent;
            this._scrollItem = itemNode._listId != null ? itemNode : ev.target;
        }
    }
    //触摸抬起时..
    _onTouchUp() {
        let t: any = this;
        t._scrollPos = null;
        this._scrollItem = null;
    }

    _onTouchCancelled(ev, captureListeners) {
        let t = this;
        if (t._scrollView["_hasNestedViewGroup"](ev, captureListeners) || ev.simulate) return;

        t._scrollPos = null;
        this._scrollItem = null;
    }

    //当尺寸改变
    _onSizeChanged() {
        if (this.checkInited(false)) this._onScrolling();
    }

    _onContentSizeChanged() {
        if (this.checkInited(false) && this.isSizeChanged()) {
            if (this._align === Layout.Type.GRID) {
                //这里刷新存在于一个问题，就是之前的渲染完了没有，如果之前的没有渲染完的话，就会导致Rander的重复。暂时这样处理，后续想更好的方案
                switch (this._startAxis) {
                    case Layout.AxisDirection.HORIZONTAL:
                        //计算列数
                        this._lastContentW = this._contentUt.width;
                        let trimW: number = this._contentUt.width - this._leftGap - this._rightGap;
                        this._colLineNum = Math.floor((trimW + this._columnGap) / (this._itemSize.width + this._columnGap));
                        break;
                    case Layout.AxisDirection.VERTICAL:
                        //计算行数
                        this._lastContentH = this._contentUt.height;
                        let trimH: number = this._contentUt.height - this._topGap - this._bottomGap;
                        this._colLineNum = Math.floor((trimH + this._lineGap) / (this._itemSize.height + this._lineGap));
                        break;
                }
                //下一帧刷新排版，以免UI层创建重复
                this.scheduleOnce(() => {
                    this.numItems = this.numItems;
                });
            }
        }
    }

    private isSizeChanged() {
        switch (this._startAxis) {
            case Layout.AxisDirection.HORIZONTAL:
                return this._contentUt.width != this._lastContentW;

            case Layout.AxisDirection.VERTICAL:
                //计算行数
                return this._contentUt.height != this._lastContentH;
        }
        return false;
    }

    //当Item自适应
    _onItemAdaptive(item: any, resize = false) {
        let ut: UITransform = item.getComponent(UITransform);
        if ((!this._sizeType && ut.width != this._itemSize.width) || (this._sizeType && ut.height != this._itemSize.height) || resize) {
            if (!this._customSize) this._customSize = {};
            let val = this._sizeType ? ut.height : ut.width;
            if (this._customSize[item._listId] != val) {
                this._customSize[item._listId] = val;
                this._resizeContent();
                this.updateAll();
                // 如果当前正在运行 scrollTo，肯定会不准确，在这里做修正
                if (this._scrollToListId != null) {
                    this._scrollPos = null;
                    this.unschedule(this._scrollToSo);
                    this.scrollTo(this._scrollToListId, Math.max(0, this._scrollToEndTime - new Date().getTime() / 1000));
                }
            }
        }
    }
    //Update..
    update() {
        if (this.frameByFrameRenderNum <= 0 || this._updateDone) return;
        let len: number = this._updateCounter + this.frameByFrameRenderNum > this.displayItemNum ? this.displayItemNum : this._updateCounter + this.frameByFrameRenderNum;
        for (let n: number = this._updateCounter; n < len; n++) {
            let data: any = this.displayData[n];
            if (data) {
                this._createOrUpdateItem(data);
            }
        }
        if (this._updateCounter >= this.displayItemNum - 1) {
            //最后一个
            if (this._doneAfterUpdate) {
                this._updateCounter = 0;
                this._updateDone = false;
                // if (!this._scrollView.isScrolling())
                this._doneAfterUpdate = false;
            } else {
                this._updateDone = true;
                this._delRedundantItem();
                this._forceUpdate = false;
                this._calcNearestItem();
            }
        } else {
            this._updateCounter += this.frameByFrameRenderNum;
        }
    }
    /**
     * 创建或更新Item（虚拟列表用）
     * @param {Object} data 数据
     */
    _createOrUpdateItem(data: any) {
        let item: any = this.getItemByListId(data.id);
        if (!item) {
            //如果不存在
            let canGet: boolean = this._pool.size() > 0;
            if (canGet) {
                item = this._pool.get();
            } else {
                item = instantiate(this._itemTmp);
            }
            if (!canGet || !isValid(item)) {
                item = instantiate(this._itemTmp);
                canGet = false;
            }
            if (item._listId != data.id) {
                item._listId = data.id;
                let ut: UITransform = item.getComponent(UITransform);
                ut.setContentSize(this._itemSize);
            }
            // 添加到 content 后：如果启用了 Layout 则让 Layout 负责排列（仅对现有子节点生效），否则按计算位置摆放
            this.content.addChild(item);
            if (!(this._layout && this._layout.enabled)) {
                item.setPosition(new Vec3(data.x, data.y, 0));
            } else {
                const idx = this.displayData ? this.displayData.findIndex((d: any) => d.id === data.id) : -1;
                if (idx >= 0) item.setSiblingIndex(idx);
                // 尝试触发 Layout 更新（若支持）以在编辑器/运行时立即生效
                try {
                    (this._layout as any).updateLayout?.();
                } catch (e) {
                    // ignore
                }
            }
            if (canGet && this._needUpdateWidget) {
                let widget: Widget = item.getComponent(Widget);
                if (widget) widget.updateAlignment();
            }
            // 保底将 siblingIndex 置为末尾（不会覆盖上面的显式设置）
            item.setSiblingIndex(this.content.children.length - 1);

            // ListItem 相关逻辑已移除：不再绑定组件引用或调用其注册函数
            if (this.renderEvent) {
                EventHandler.emitEvents([this.renderEvent], item, data.id % this._actualNumItems);
            }
        } else if (this._forceUpdate && this.renderEvent) {
            // 强制更新：如果 Layout 生效则通过 siblingIndex 更新顺序，否则直接设置位置
            if (!(this._layout && this._layout.enabled)) {
                item.setPosition(new Vec3(data.x, data.y, 0));
            } else {
                const idx = this.displayData ? this.displayData.findIndex((d: any) => d.id === data.id) : -1;
                if (idx >= 0) item.setSiblingIndex(idx);
                try {
                    (this._layout as any).updateLayout?.();
                } catch (e) {
                    // ignore
                }
            }
            if (this.renderEvent) {
                EventHandler.emitEvents([this.renderEvent], item, data.id % this._actualNumItems);
            }
        }

    // ListItem 相关逻辑已移除，统一传入 null
    this._updateListItem(null);
        if (this._lastDisplayData.indexOf(data.id) < 0) {
            this._lastDisplayData.push(data.id);
        }
    }
    // NOTE: 非虚拟分支逻辑已精简并移除（组件现在始终为虚拟列表）。保留兼容接口 `_updateListItem`。

    _updateListItem(listItem: any) {
        // ListItem 相关逻辑已移除；保留接口以兼容旧调用
        return;
    }
    /**
     * 更新Item位置
     * @param {Number||Node} listIdOrItem
     */
    _updateItemPos(listIdOrItem: any) {
        let item: any = isNaN(listIdOrItem) ? listIdOrItem : this.getItemByListId(listIdOrItem);
        let pos: any = this.getItemPos(item._listId);
        item.setPosition(pos.x, pos.y);
    }
    /**
     * 设置多选
     * @param {Array} args 可以是单个listId，也可是个listId数组
     * @param {Boolean} bool 值，如果为null的话，则直接用args覆盖
     */
    setMultSelected(args: any, bool: boolean) {
        let t: any = this;
        if (!t.checkInited()) return;
        if (!Array.isArray(args)) {
            args = [args];
        }
        if (bool == null) {
            t.multSelected = args;
        } else {
            let listId: number, sub: number;
            if (bool) {
                for (let n: number = args.length - 1; n >= 0; n--) {
                    listId = args[n];
                    sub = t.multSelected.indexOf(listId);
                    if (sub < 0) {
                        t.multSelected.push(listId);
                    }
                }
            } else {
                for (let n: number = args.length - 1; n >= 0; n--) {
                    listId = args[n];
                    sub = t.multSelected.indexOf(listId);
                    if (sub >= 0) {
                        t.multSelected.splice(sub, 1);
                    }
                }
            }
        }
        t._forceUpdate = true;
        t._onScrolling();
    }
    /**
     * 获取多选数据
     * @returns
     */
    getMultSelected() {
        return this.multSelected;
    }
    /**
     * 多选是否有选择
     * @param {number} listId 索引
     * @returns
     */
    hasMultSelected(listId: number) {
        return this.multSelected && this.multSelected.indexOf(listId) >= 0;
    }
    /**
     * 更新指定的Item
     * @param {Array} args 单个listId，或者数组
     * @returns
     */
    updateItem(args: any) {
        if (!this.checkInited()) return;
        if (!Array.isArray(args)) {
            args = [args];
        }
        for (let n: number = 0, len: number = args.length; n < len; n++) {
            let listId: number = args[n];
            let item: any = this.getItemByListId(listId);
            if (item) EventHandler.emitEvents([this.renderEvent], item, listId % this._actualNumItems);
        }
    }
    /**
     * 更新全部
     */
    updateAll() {
        if (!this.checkInited()) return;
        this.numItems = this.numItems;
    }
    /**
     * 根据ListID获取Item
     * @param {Number} listId
     * @returns
     */
    getItemByListId(listId: number) {
        if (this.content) {
            for (let n: number = this.content.children.length - 1; n >= 0; n--) {
                let item: any = this.content.children[n];
                if (item._listId == listId) return item;
            }
        }
    }
    /**
     * 获取在显示区域外的Item
     * @returns
     */
    _getOutsideItem() {
        let item: any;
        let result: any[] = [];
        for (let n: number = this.content.children.length - 1; n >= 0; n--) {
            item = this.content.children[n];
            if (!this.displayData.find((d) => d.id == item._listId)) {
                result.push(item);
            }
        }
        return result;
    }
    //删除显示区域以外的Item
    _delRedundantItem() {
        let arr: any[] = this._getOutsideItem();
        for (let n: number = arr.length - 1; n >= 0; n--) {
            let item: any = arr[n];
            if (this._scrollItem && item._listId == this._scrollItem._listId) continue;
            item.isCached = true;
            this._pool.put(item);
            for (let m: number = this._lastDisplayData.length - 1; m >= 0; m--) {
                if (this._lastDisplayData[m] == item._listId) {
                    this._lastDisplayData.splice(m, 1);
                    break;
                }
            }
        }
    }
    //删除单个Item
    _delSingleItem(item: any) {
        // cc.log('DEL::', item['_listId'], item);
        item.removeFromParent();
        if (item.destroy) item.destroy();
        item = null;
    }
    /**
     * 动效删除Item（此方法只适用于虚拟列表，即_virtual=true）
     * 一定要在回调函数里重新设置新的numItems进行刷新，毕竟本List是靠数据驱动的。
     */
    aniDelItem(listId: number, callFunc: Function, aniType: number) {
        let t: any = this;

    if (!t.checkInited()) return console.error("This function is not allowed to be called!");

        if (!callFunc) return console.error("CallFunc are not allowed to be NULL, You need to delete the corresponding index in the data array in the CallFunc!");

        if (t._aniDelRuning) return console.warn("Please wait for the current deletion to finish!");

        let item: any = t.getItemByListId(listId);
        let listItem: any = null;
        if (!item) {
            callFunc(listId);
            return;
        } else if (item.getComponent) {
            // 尝试按字符串名获取原 ListItem 组件（若存在）
            try {
                listItem = item.getComponent && item.getComponent('ListItem');
            } catch (err) {
                listItem = null;
            }
        }
        t._aniDelRuning = true;
        t._aniDelCB = callFunc;
        t._aniDelItem = item;
        t._aniDelBeforePos = item.position;
        t._aniDelBeforeScale = item.scale;
        let curLastId: number = t.displayData[t.displayData.length - 1].id;
        let resetSelectedId: boolean = false;
        // 把原来在 ListItem.showAni 回调中执行的逻辑抽成函数，若组件存在且提供 showAni 则使用动画回调，否则同步执行
        const doAfterAni = () => {
            //判断有没有下一个，如果有的话，创建粗来
            let newId: number;
            if (curLastId < t._numItems - 2) {
                newId = curLastId + 1;
            }
            if (newId != null) {
                let newData: any = t._calcItemPos(newId);
                t.displayData.push(newData);
                // 组件为纯虚拟列表，直接创建/更新虚拟项
                t._createOrUpdateItem(newData);
            } else t._numItems--;
            if (t.selectedMode == SelectedType.SINGLE) {
                if (resetSelectedId) {
                    t._selectedId = -1;
                } else if (t._selectedId - 1 >= 0) {
                    t._selectedId--;
                }
            } else if (t.selectedMode == SelectedType.MULT && t.multSelected.length) {
                let sub: number = t.multSelected.indexOf(listId);
                if (sub >= 0) {
                    t.multSelected.splice(sub, 1);
                }
                //多选的数据，在其后的全部减一
                for (let n: number = t.multSelected.length - 1; n >= 0; n--) {
                    let id: number = t.multSelected[n];
                    if (id >= listId) t.multSelected[n]--;
                }
            }
            if (t._customSize) {
                if (t._customSize[listId]) delete t._customSize[listId];
                let newCustomSize: any = {};
                let size: number;
                for (let id in t._customSize) {
                    size = t._customSize[id];
                    let idNumber: number = parseInt(id);
                    newCustomSize[idNumber - (idNumber >= listId ? 1 : 0)] = size;
                }
                t._customSize = newCustomSize;
            }
            //后面的Item向前怼的动效
            let sec: number = 0.2333;
            let twe: Tween<Node>, haveCB: boolean;
            for (let n: number = newId != null ? newId : curLastId; n >= listId + 1; n--) {
                item = t.getItemByListId(n);
                if (item) {
                    let posData: any = t._calcItemPos(n - 1);
                    twe = tween(item).to(sec, { position: new Vec3(posData.x, posData.y, 0) });

                    if (n <= listId + 1) {
                        haveCB = true;
                        twe.call(() => {
                            t._aniDelRuning = false;
                            callFunc(listId);
                            delete t._aniDelCB;
                        });
                    }
                    twe.start();
                }
            }
            if (!haveCB) {
                t._aniDelRuning = false;
                callFunc(listId);
                t._aniDelCB = null;
            }
        };

        if (listItem && typeof listItem.showAni === 'function') {
            try {
                listItem.showAni(aniType, doAfterAni, true);
            } catch (err) {
                // 如果调用失败则退回到同步逻辑
                doAfterAni();
            }
        } else {
            doAfterAni();
        }
    }
    /**
     * 设置Item数量（不刷新滚动） 并且滚动指定索引  （）
     * @param val 列表数量
     * @param {Number} listId 索引（如果<0，则滚到首个Item位置，如果>=_numItems，则滚到最末Item位置）
     * @param {Number} timeInSecond 时间
     * @returns
     */
    scrollToNumItems(val: number, listId: number, timeInSecond: number = 0.5) {
        let t = this;
        if (!t.checkInited(false)) return;
        if (val == null || val < 0) {
            console.error("numItems set the wrong::", val, "如果是加了widget适配List大小，初始化可无视这条警告");
            return;
        }
        t._actualNumItems = t._numItems = val;
        t._forceUpdate = true;

        t._resizeContent();

        let runScroll = this.scrollTo(listId, timeInSecond);
        if (!runScroll) {
            t._onScrolling();
        }
    }
    /**
     * 滚动到..
     * @param {Number} listId 索引（如果<0，则滚到首个Item位置，如果>=_numItems，则滚到最末Item位置）
     * @param {Number} timeInSecond 时间
     * @param {Number} offset 索引目标位置偏移，0-1
     * @param {Boolean} overStress 滚动后是否强调该Item（这只是个实验功能）
     */
    scrollTo(listId: number, timeInSecond: number = 0.5, offset: number = null, overStress: boolean = false) {
        let t = this;
        t.listId = listId;
        if (!t.checkInited(false)) return;

        if (listId >= t._numItems - 1) t.node.emit("scroll-to-final");
        // t._scrollView.stopAutoScroll();
        if (timeInSecond == null)
            //默认0.5
            timeInSecond = 0.5;
        else if (timeInSecond < 0) timeInSecond = 0;
        if (listId < 0) listId = 0;
        else if (listId >= t._numItems) listId = t._numItems - 1;
        // 以防设置了numItems之后layout的尺寸还未更新

        let pos = t.getItemPos(listId);
        if (!pos) {
            return DEV && console.error("pos is null", listId);
        }
        let targetX: number, targetY: number;

    let scrollTarget: Vec2 | null = null;
    switch (t._alignCalcType) {
            case 1: //单行HORIZONTAL（LEFT_TO_RIGHT）、网格VERTICAL（LEFT_TO_RIGHT）
                targetX = pos.left;
                if (offset != null) targetX -= t._thisNodeUt.width * offset;
                else targetX -= t._leftGap;
                scrollTarget = new Vec2(targetX, 0);
                break;
            case 2: //单行HORIZONTAL（RIGHT_TO_LEFT）、网格VERTICAL（RIGHT_TO_LEFT）
                targetX = pos.right - t._thisNodeUt.width;
                if (offset != null) targetX += t._thisNodeUt.width * offset;
                else targetX += t._rightGap;
                scrollTarget = new Vec2(targetX + t._contentUt.width, 0);
                break;
            case 3: //单列VERTICAL（TOP_TO_BOTTOM）、网格HORIZONTAL（TOP_TO_BOTTOM）
                targetY = pos.top;
                if (offset != null) targetY += t._thisNodeUt.height * offset;
                else targetY += t._topGap;
                scrollTarget = new Vec2(0, -targetY);
                break;
            case 4: //单列VERTICAL（BOTTOM_TO_TOP）、网格HORIZONTAL（BOTTOM_TO_TOP）
                targetY = pos.bottom + t._thisNodeUt.height;
                if (offset != null) targetY -= t._thisNodeUt.height * offset;
                else targetY -= t._bottomGap;
                scrollTarget = new Vec2(0, -targetY + t._contentUt.height);
                break;
        }
    let viewPos: any = t.content.getPosition();
    viewPos = Math.abs(t._sizeType ? viewPos.y : viewPos.x);

    // 如果没有计算到 scrollTarget，则无法滚动
    if (!scrollTarget) return false;

    let comparePos = t._sizeType ? scrollTarget.y : scrollTarget.x;
    let runScroll = Math.abs((t._scrollPos != null ? t._scrollPos : viewPos) - comparePos) > 0.5;
        // cc.log(runScroll, t._scrollPos, viewPos, comparePos)

        // t._scrollView.stopAutoScroll();
        if (runScroll) {
            t._scrollView.scrollToOffset(scrollTarget, timeInSecond);
            t._scrollToListId = listId;
            t._scrollToEndTime = new Date().getTime() / 1000 + timeInSecond;
            // cc.log(listId, t.content.width, t.content.getPosition(), pos);
            t._scrollToSo = t.scheduleOnce(() => {
                if (!t._adheringBarrier) {
                    t.adhering = t._adheringBarrier = false;
                }
                t._scrollPos = t._scrollToListId = t._scrollToEndTime = t._scrollToSo = null;
                //cc.log('2222222222', t._adheringBarrier)
                if (overStress) {
                    // t.scrollToListId = listId;
                    let item = t.getItemByListId(listId);
                    if (item) {
                        tween(item).to(0.1, { scale: 1.05 }).to(0.1, { scale: 1 }).start();
                    }
                }
            }, timeInSecond + 0.1);

            if (timeInSecond <= 0) {
                t._onScrolling();
            }
        }
        return runScroll
    }

    /**
 * 计算滚动视窗中最近的可见项
 */
    _calcNearestItem() {
        const self = this;
        self.nearestListId = null;

        // 准备基础数据
        const itemChecker = this._createItemChecker();

        // 主检测逻辑
        this._scanItems((itemData, index) => {
            const center = this._calculateItemCenter(itemData);
            const foundId = itemChecker.checkMainItem(itemData, center);
            if (foundId !== null) {
                self.nearestListId = foundId;
                return true; // 中断扫描
            }
            return false;
        });

        // 边界检测（处理最后一个元素）
        this._checkLastItem(itemChecker);
    }

    //----------- 工具方法 -----------
    /** 获取视窗边界 */
    private _getViewBounds() {
        this._calcViewPos();
        return {
            viewTop: this.viewTop,
            viewRight: this.viewRight,
            viewBottom: this.viewBottom,
            viewLeft: this.viewLeft
        };
    }

    /** 创建项检测策略 */
    private _createItemChecker() {
        const bounds = this._getViewBounds();
        return {
            // 主项检测
            checkMainItem: (itemData: any, center: number) => {
                const handlers = {
                    1: () => itemData.right >= bounds.viewLeft && bounds.viewLeft > center,
                    2: () => itemData.left <= bounds.viewRight && bounds.viewRight < center,
                    3: () => itemData.bottom <= bounds.viewTop && bounds.viewTop < center,
                    4: () => itemData.top >= bounds.viewBottom && bounds.viewBottom > center
                };
                return handlers[this._alignCalcType]?.() ? itemData.id + this._colLineNum : itemData.id;
            },

            // 末项检测
            checkLastItem: (itemData: any, center: number) => {
                const handlers = {
                    1: () => bounds.viewRight > center,
                    2: () => bounds.viewLeft < center,
                    3: () => bounds.viewBottom < center,
                    4: () => bounds.viewTop > center
                };
                return handlers[this._alignCalcType]?.() ? itemData.id : null;
            }
        };
    }

    /** 遍历项进行检测 */
    private _scanItems(callback: (itemData: any, index: number) => boolean) {
        const itemCount = this.displayItemNum;
        for (let i = 0; i < itemCount; i += this._colLineNum) {
            const itemData = this.displayData[i];
            if (!itemData) continue;
            if (callback(itemData, i)) break;
        }
    }

    /** 计算项中心点 */
    private _calculateItemCenter(itemData: any) {
        return this._sizeType
            ? (itemData.top + itemData.bottom) / 2
            : (itemData.left + itemData.right) / 2;
    }

    /** 检测最后一个项 */
    private _checkLastItem(checker: any) {
        const lastIndex = this.displayItemNum - 1;
        const lastItem = this.displayData[lastIndex]

        if (lastItem?.id === this._numItems - 1) {
            const center = this._calculateItemCenter(lastItem);
            const foundId = checker.checkLastItem(lastItem, center);
            if (foundId !== null) this.nearestListId = foundId;
        }
    }
}
