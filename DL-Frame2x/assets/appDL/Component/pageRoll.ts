/*******************************************************************************
 * 描述:    节点上挂载 页面循环滚动
*******************************************************************************/
const { ccclass, property, menu, executionOrder } = cc._decorator;

@ccclass
@menu('常用组件/页面循环滚动')
@executionOrder(-100)
export default class PageRoll extends cc.Component {
    @property({ type: cc.Integer, displayName: "初始id" })
    chooseId: number = 0;

    @property({ type: cc.Float, displayName: "递减倍数", min: 0, max: 1, step: 0.01 })
    difScale: number = 0;

    @property({ type: cc.Float, displayName: "横间距" })
    difX: number = 0;

    @property({ type: cc.Float, displayName: "回弹时间" })
    bounceDuration: number = 0.1;

    private itemArr: Map<number, cc.Node> = new Map();
    private leftX: number = 0;
    private rightX: number = 0;

    // 新增变量来跟踪惯性滑动的速度
    private lastTouchTime: number = 0;
    private lastTouchPos: number = 0;
    private velocity: number = 0;  // 当前速度
    private friction: number = 0.5;  // 惯性摩擦系数，控制减速效果
    private isMoving: boolean = false;  // 是否移动了

    start() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        // this.init();
    }

    init(id?: number): void {
        this.node.children.forEach((node, index) => {
            this.itemArr.set(index, node);
        });
        if (this.itemArr.size === 0) return;
        this.leftX = this.itemArr.size * this.difX;
        this.rightX = this.difX;
        this.chooseId = id ?? this.chooseId;

        // 使用 Map 来遍历并初始化
        this.itemArr.forEach((item, index) => {
            const scale = this.getItemScale(index);
            item.scale = scale;
            item.x = Math.abs(this.difX) * (index + 1);
            item.zIndex = this.getItemZIndex(index);
        });

        this.node.x = (this.chooseId + 1) * this.difX;
    }

    getItemScale(index: number): number {
        return index === this.chooseId ? 1 : 1 - this.difScale * Math.abs(this.chooseId - index);
    }

    getItemZIndex(index: number): number {
        return index === this.chooseId ? this.itemArr.size + 1 : index - this.chooseId > 0 ? this.itemArr.size - index : index;
    }

    onTouchStart(event: cc.Event.EventTouch): void {
        this.node.stopAllActions();
        this.isMoving = false;
        this.lastTouchTime = Date.now(); // 记录触摸开始时间 (使用 Date.now() 获取时间戳)
        this.lastTouchPos = event.getLocationX(); // 记录触摸开始位置
        this.velocity = 0; // 重置速度
    }

    onTouchMove(event: cc.Event.EventTouch): void {
        this.isMoving = true;
        const deltaX = event.getDeltaX(); // 触摸移动的位移
        const newPosX = this.node.x + deltaX;
        this.node.emit('TouchStart', this);

        if (newPosX < this.rightX && newPosX > this.leftX) {
            this.node.x = newPosX;
            this.updateItemsScale();
        }

        // 计算当前的滑动速度 (单位: 像素/秒)
        const currentTime = Date.now();  // 使用 Date.now() 获取当前时间戳
        const timeDiff = currentTime - this.lastTouchTime;  // 计算时间差
        const distance = event.getLocationX() - this.lastTouchPos;  // 当前触摸位置与上次触摸位置的差值

        if (timeDiff > 0) {
            this.velocity = distance / timeDiff;  // 计算速度 (单位: 像素/秒)
        }

        this.lastTouchTime = currentTime;  // 更新触摸时间
        this.lastTouchPos = event.getLocationX();  // 更新触摸位置
    }

    onTouchEnd(event: cc.Event.EventTouch): void {
        // 启动惯性滑动效果
        if (!this.isMoving) {
            const localPos = this.node.convertToNodeSpaceAR(event.getLocation());
            let touchId: number = -1;
            for (let i = this.chooseId; i >= 0; i--) {
                let item = this.itemArr.get(i);
                let itemXL = item.x - item.width * item.scale / 2;
                let itemXR = item.x + item.width * item.scale / 2;
                if (localPos.x > itemXL && localPos.x < itemXR) {
                    touchId = i;
                    break;
                }
            }
            for (let i = this.chooseId; i < this.itemArr.size; i++) {
                let item = this.itemArr.get(i);
                let itemXL = item.x - item.width * item.scale / 2;
                let itemXR = item.x + item.width * item.scale / 2;
                if (localPos.x > itemXL && localPos.x < itemXR) {
                    touchId = i;
                    break;
                }
            }
            if (touchId != -1 && touchId != this.chooseId) {
                this.chooseId = touchId;
                this.snapToNearest();
                this.node.emit('TouchEnd', this);
            }
        } else {
            this.inertiaScroll();
        }
    }

    // 更新项的缩放和 zIndex
    updateItemsScale(): void {
        this.setChooseId();
        this.itemArr.forEach((item, index) => {
            item.scale = this.getItemScaleFromPos(item);;
            item.zIndex = this.getItemZIndex(index);
        });
    }

    // 基于位置动态计算缩放
    getItemScaleFromPos(item: cc.Node): number {
        return Math.max(1 - Math.abs((item.x + this.node.x) / this.difX) * this.difScale, 1 - (this.itemArr.size - 1) * this.difScale);
    }

    // 惯性滚动效果
    inertiaScroll(): void {
        // 更新节点位置
        this.node.x += this.velocity;  // 根据当前速度移动节点
        this.updateItemsScale();
        // 判断是否越界
        if (this.node.x < this.leftX) {
            this.node.x = this.leftX;  // 限制左边界
            this.velocity = 0;  // 停止滑动
        }
        if (this.node.x > this.rightX) {
            this.node.x = this.rightX;  // 限制右边界
            this.velocity = 0;  // 停止滑动
        }
        // 如果速度小于某个阈值，停止惯性滑动
        if (Math.abs(this.velocity) < 0.5) {
            this.snapToNearest();
            this.setChooseId();
            return;
        }
        // 更新速度，模拟衰减（摩擦力）
        this.velocity *= this.friction;
        // 递归调用，持续执行惯性滑动，模拟惯性
        setTimeout(() => {
            this.inertiaScroll();
        }, 16);  // 每16ms更新一次
    }

    setChooseId() {
        for (let i = 0; i < this.itemArr.size; i++) {
            let itemX = this.itemArr.get(i).x + this.node.x;
            if (Math.abs(itemX) < Math.abs(this.difX) / 2) {
                this.chooseId = i;
                return i;
            }
        }
    }

    private snapToNearest(): void {
        if (this.itemArr.size === 0) return;
        // 计算目标位置（让选中的项目居中）
        const targetX = -this.itemArr.get(this.chooseId).x;
        // 缓动到目标位置
        cc.tween(this.node)
            .to(this.bounceDuration, { x: targetX }, { easing: 'smooth' })
            .call(() => {
                this.node.emit('TouchEnd', this);
                this.updateItemsScale();
            })
            .start();
    }

    protected onDestroy(): void {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
}
