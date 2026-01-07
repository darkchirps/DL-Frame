/*******************************************************************************
 * 描述:    多边形遮罩 打断合批
*******************************************************************************/
import { _decorator, Component, PolygonCollider2D, Mask, UITransform, Vec3, v3, Node, Vec2, __private, Intersection2D, v2, CCInteger, CCBoolean, CCFloat } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode, requireComponent } = _decorator;

/** 遮罩编辑 */
@ccclass('maskplus')
@executeInEditMode
@requireComponent(PolygonCollider2D)
export class maskplus extends Component {
    @property(CCInteger) _rotateN: number = 0;
    @property({ displayName: '旋转', tooltip: "默认0不旋转,1旋转90度,2旋转180度,3旋转270度", type: CCInteger })
    get rotateN(): number {
        return this._rotateN;
    }
    set rotateN(value: number) {
        this._rotateN = value;
        if (this._rotateN == 1 || this._rotateN == 3) {
            this.getComponent(PolygonCollider2D)['_points'] = this.rotatePolygon(this.startPos, this._rotateN == 1 ? true : false);
        } else if (this._rotateN == 0 || this._rotateN == 2) {
            let arr = [];
            this.startPos.forEach(v => arr.push(v2(v.x, v.y * (this._rotateN == 0 ? 1 : -1))));
            this.getComponent(PolygonCollider2D)['_points'] = arr;
        }
    }
    @property(CCFloat) _scalePoint: number = 1;
    @property({ displayName: '放大坐标', type: CCFloat })
    get scalePoint(): number {
        return this._scalePoint;
    }
    set scalePoint(value: number) {
        this._scalePoint = value;
        let arr = [];
        this.startPos.forEach(v => arr.push(v2(v.x * this.scalePoint, v.y * this.scalePoint)));
        this.getComponent(PolygonCollider2D)['_points'] = arr;
    }
    @property(CCBoolean) _changeOrigin: boolean = false;
    @property({ displayName: '替换初始坐标' })
    get changeOrigin(): boolean {
        return this._changeOrigin;
    }
    set changeOrigin(value: boolean) {
        this._changeOrigin = value;
        let points = this.getComponent(PolygonCollider2D).points;
        let arr = [];
        points.forEach(v => arr.push(v2(v.x, v.y)));
        this.startPos = arr;
    }

    startPos: Vec2[] = [];
    onEnable(): void {
        let points = this.getComponent(PolygonCollider2D).points;
        let arr = [];
        points.forEach(v => arr.push(v2(v.x, v.y)));
        this.startPos = arr;
        this.scalePoint = 1;
    }

    /**旋转一个坐标数组所有坐标
     * @param clockwise true 顺时针旋转 false 逆时针旋转
    */
    rotatePolygon(points: Vec2[], clockwise: boolean): Vec2[] {
        const center = this.calculateCentroid(points);
        const rotatedPoints: Vec2[] = [];
        for (const point of points) {
            const rotatedPoint = this.rotatePoint(point, center, clockwise);
            rotatedPoints.push(rotatedPoint);
        }
        return rotatedPoints;
    }
    rotatePoint(point: Vec2, center: Vec2, clockwise: boolean): Vec2 {
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        let newX = 0;
        let newY = 0;
        if (clockwise) {
            newX = center.x + dy;
            newY = center.y - dx;
        } else {
            newX = center.x - dy;
            newY = center.y + dx;
        }
        return new Vec2(newX, newY);
    }
    calculateCentroid(points: Vec2[]): Vec2 {
        let sumX = 0;
        let sumY = 0;
        const count = points.length;
        for (const point of points) {
            sumX += point.x;
            sumY += point.y;
        }
        return new Vec2(sumX / count, sumY / count);
    }

    private _oldDesc: PropertyDescriptor;
    private _oldIsHitF: Function;
    private _maskComp: Mask;
    private _polygonComp: PolygonCollider2D;
    private _uiTransformComp: UITransform;
    /* ***************属性*************** */
    /** 镂空点击穿透 */
    @property({ displayName: '镂空点击穿透', visible: false })
    clickThroughB = false;

    /** 跟踪节点 */
    @property(Node)
    _followNode: Node = null;
    /** 跟踪节点 */
    @property({ displayName: '跟踪节点', type: Node })
    get followNode(): Node {
        return this._followNode;
    }
    set followNode(value_: Node) {
        this._setFollowNode(value_);
    }

    /** 原点坐标 */
    @property({ displayName: '原点坐标', visible: false })
    originV3: Vec3 = v3();
    /* -------------------------------segmentation------------------------------- */

    onLoad() {
        this._maskComp = this.getComponent(Mask);
        this._maskComp.type = Mask.Type.GRAPHICS_STENCIL;
        this._polygonComp = this.getComponent(PolygonCollider2D);

        this._uiTransformComp = this.getComponent(UITransform);

        // 不是 GRAPHICS_STENCIL 类型直接退出
        if (this._maskComp.type !== Mask.Type.GRAPHICS_STENCIL) {
            return;
        }

        // 监听 point 修改
        if (EDITOR) {
            let oldValue = this._polygonComp['_points'];
            this._oldDesc = Object.getOwnPropertyDescriptor(this._polygonComp, '_points');
            Object.defineProperty(this._polygonComp, '_points', {
                get: () => oldValue,
                set: (newValue) => {
                    oldValue = newValue;
                    // 更新遮罩
                    this.updateMask();
                }
            });
        }

        // 点击穿透
        {
            let tempV3 = v3();
            this._oldIsHitF = this._uiTransformComp.isHit;
            this._uiTransformComp.isHit = (
                point: Vec2
            ) => {
                tempV3.x = point.x;
                tempV3.y = point.y;
                this._uiTransformComp.convertToNodeSpaceAR(tempV3, tempV3);
                point.x = tempV3.x;
                point.y = tempV3.y;

                if (this.clickThroughB) {
                    return (
                        this._maskComp.inverted && !Intersection2D.pointInPolygon(point, this._polygonComp.points)
                    );
                } else {
                    return this._oldIsHitF.call(this._uiTransformComp, ...arguments);
                }
            };
        }
    }
    start() {
        this.updateMask();
    }
    onDestroy() {
        // 还原 isHit
        if (this._oldIsHitF) {
            this._uiTransformComp.isHit = this._oldIsHitF as any;
        }
    }
    /* ***************get/set*************** */
    private _setFollowNode(value_: Node) {
        this._followNode = value_;
        // 偏移坐标
        let offsetV3 = this.followNode ? v3(this.followNode.position.clone().subtract(this.originV3)) : v3();
        this._polygonComp.points.forEach((v) => {
            v.add2f(offsetV3.x, offsetV3.y);
        });
        this.updateMask();
    }
    /* ***************功能函数*************** */
    /** 更新遮罩 */
    updateMask(): void {
        //@ts-ignore
        if (!this.isValid || !this._maskComp.graphics || this._maskComp.type !== Mask.Type.GRAPHICS_STENCIL) {
            return;
        }
        // 绘制遮罩
        //@ts-ignore
        this._maskComp.graphics.clear();
        //@ts-ignore
        this._maskComp.graphics.moveTo(
            this._polygonComp.points[0].x + this._polygonComp.offset.x,
            this._polygonComp.points[0].y + this._polygonComp.offset.y
        );
        for (let kN = 1; kN < this._polygonComp.points.length; ++kN) {
            //@ts-ignore
            this._maskComp.graphics.lineTo(
                this._polygonComp.points[kN].x + this._polygonComp.offset.x,
                this._polygonComp.points[kN].y + this._polygonComp.offset.y
            );
        }
        //@ts-ignore
        this._maskComp.graphics.close();
        //@ts-ignore
        this._maskComp.graphics.stroke();
        //@ts-ignore
        this._maskComp.graphics.fill();
    }
}
