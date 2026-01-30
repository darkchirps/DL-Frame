/*******************************************************************************
 * 描述:    自定义多边形区域，支持合批（无编辑器节点）
*******************************************************************************/

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu('常用组件/多边形图')
export default class customPolygon extends cc.RenderComponent {
    @property({ type: cc.SpriteAtlas, visible: false, serializable: false, readonly: true, displayName: CC_DEV && 'Atlas' })
    private atlas: cc.SpriteAtlas = null;

    @property
    private _spriteFrame: cc.SpriteFrame = null;
    @property({ type: cc.SpriteFrame, displayName: CC_DEV && 'Sprite Frame' })
    get spriteFrame() { return this._spriteFrame; }
    set spriteFrame(value: cc.SpriteFrame) {
        this._spriteFrame = value;
        this.updateSpriteFrame();
        this.updateSizeMode();
    }

    @property
    private _sizeMode: cc.Sprite.SizeMode = cc.Sprite.SizeMode.TRIMMED;
    @property({ type: cc.Sprite.SizeMode, displayName: CC_DEV && 'Size Mode' })
    get sizeMode() { return this._sizeMode; }
    set sizeMode(value: cc.Sprite.SizeMode) {
        this._sizeMode = value;
        this.updateSpriteFrame();
        this.updateSizeMode();
    }

    // 使用PolygonCollider组件的points作为顶点信息
    private _polygonCollider: cc.PolygonCollider = null;
    private _oldPointsDesc: PropertyDescriptor = null;

    // 在编辑器中显示轮廓
    @property({ visible: false, displayName: CC_DEV && '显示轮廓' })
    showOutline = false;

    // 轮廓颜色
    @property({ displayName: CC_DEV && '轮廓颜色', visible: function () { return this.showOutline; } })
    outlineColor = cc.Color.WHITE;

    // 轮廓宽度
    @property({ displayName: CC_DEV && '轮廓宽度', visible: function () { return this.showOutline; } })
    outlineWidth = 2;

    private renderData = null;
    private xyOffset: number = 1e8;
    private uvOffset: number = 1e8;
    private colorOffset: number = 1e8;
    private step: number = 0;
    private local: number[] = [];
    private vertexCount: number = 0; // 顶点数量
    private triangleCount: number = 0; // 三角形数量

    protected _resetAssembler() {
        let assembler = this['_assembler'] = new cc['Assembler']();
        assembler.updateRenderData = this.updateVData.bind(this);
        assembler.updateColor = this.updateColor.bind(this);
        assembler.init(this);
        this.renderData = new cc['RenderData']();
        this.renderData.init(assembler);
        let vfmt = assembler.getVfmt();
        let fmtElement = vfmt._elements;
        for (let i = fmtElement.length - 1; i > -1; this.step += fmtElement[i--].bytes >> 2);
        let fmtAttr = vfmt._attr2el;
        this.xyOffset = fmtAttr.a_position.offset >> 2;
        this.uvOffset = fmtAttr.a_uv0.offset >> 2;
        this.colorOffset = fmtAttr.a_color.offset >> 2;
    }
    protected onLoad() {
        // 获取或添加PolygonCollider组件
        this._polygonCollider = this.getComponent(cc.PolygonCollider);
        if (!this._polygonCollider) {
            this._polygonCollider = this.addComponent(cc.PolygonCollider);
        }

        // 在onLoad中添加
        if (CC_EDITOR) {
            let oldValue = this._polygonCollider['points'];
            this._oldPointsDesc = Object.getOwnPropertyDescriptor(this._polygonCollider, 'points');
            Object.defineProperty(this._polygonCollider, 'points', {
                get: () => oldValue,
                set: (newValue) => {
                    oldValue = newValue;
                    this.enabled = false;
                    this.enabled = true;
                }
            });
        }

        // 如果points为空，设置默认五边形
        if (!this._polygonCollider.points || this._polygonCollider.points.length === 0) {
            this.resetPoints();
        }

        this.updateSpriteFrame();
        this.updateSizeMode();
        this.updateBufferSize();
        this.updateIndice();
        this.node.on(cc.Node.EventType.ANCHOR_CHANGED, this.onAnchorChanged, this);
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    protected onDestroy() {
        super.onDestroy();

        if (this._oldPointsDesc) {
            Object.defineProperty(this._polygonCollider, 'points', this._oldPointsDesc);
            this._oldPointsDesc = null;
        }

        this.node.off(cc.Node.EventType.ANCHOR_CHANGED, this.onAnchorChanged, this);
        this.node.off(cc.Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    // 当顶点变化时更新
    private onPointsChanged() {
        this.updateBufferSize(); // 顶点数量可能变化
        if (CC_EDITOR) {
            // 在编辑器中立即刷新
            this.enabled = false;
            this.enabled = true;
        } else {
            // 在运行时标记顶点数据需要更新
            this['setVertsDirty']();
        }
    }

    // 根据顶点数量更新缓冲区大小
    private updateBufferSize() {
        const points = this._polygonCollider.points;
        if (!points || points.length < 3) {
            this.vertexCount = 0;
            this.triangleCount = 0;
            return;
        }

        this.vertexCount = points.length;
        this.triangleCount = this.vertexCount - 2; // 三角剖分后三角形数量

        // 创建顶点和索引缓冲区
        let vertices = new Float32Array(this.vertexCount * this.step);
        let indices = new Uint16Array(this.triangleCount * 3); // 每个三角形3个索引

        if (this.renderData) {
            this.renderData.updateMesh(0, vertices, indices);
        }
    }

    //Web平台渲染函数
    private fillBuffers(comp: cc.RenderComponent, renderer: any) {
        let vData = this.renderData.vDatas[0];
        let iData = this.renderData.iDatas[0];
        renderer.worldMatDirty && this.fitXY(vData);
        let buffer = renderer._meshBuffer;
        let offsetInfo = buffer.request(vData.length, iData.length);
        let vertexOffset = offsetInfo.byteOffset >> 2;
        let vbuf = buffer._vData;
        if (vData.length + vertexOffset > vbuf.length) {
            vbuf.set(vData.subarray(0, vbuf.length - vertexOffset), vertexOffset);
        } else {
            vbuf.set(vData, vertexOffset);
        }
        let ibuf = buffer._iData;
        let indiceOffset = offsetInfo.indiceOffset;
        let vertexId = offsetInfo.vertexOffset;
        for (let i = 0, len = iData.length; i < len; ibuf[indiceOffset++] = vertexId + iData[i++]);
    }

    //更新纹理
    updateSpriteFrame() {
        let frame = this._spriteFrame;
        this['_assembler'].fillBuffers = frame ? this.fillBuffers.bind(this) : () => { };
        let material = this.getMaterial(0) || cc.Material.getBuiltinMaterial('2d-sprite');
        material.define("USE_TEXTURE", true);
        material.setProperty("texture", frame ? frame.getTexture() : null);
        if (CC_EDITOR) {
            if (frame && frame.isValid && frame['_atlasUuid']) {
                cc.assetManager.loadAny(frame['_atlasUuid'], (err, asset: cc.SpriteAtlas) => {
                    this.atlas = asset;
                });
            } else {
                this.atlas = null;
            }
        }
    }

    //根据尺寸模式修改节点尺寸
    updateSizeMode() {
        if (!this._spriteFrame) return;
        // switch (this._sizeMode) {
        //     case cc.Sprite.SizeMode.TRIMMED:
        //         this.node.setContentSize(this._spriteFrame['_rect'].size);
        //         break;
        // }
    }

    //计算顶点数据
    updateVData() {
        const points = this._polygonCollider.points;
        if (!points || points.length < 3) {
            return; // 至少需要3个顶点
        }

        let vData = this.renderData.vDatas[0];
        let local = cc.sys.isNative ? vData : this.local;
        let node = this.node;
        let cw = node.width, ch = node.height;
        let anchorOffsetX = cw * node.anchorX;
        let anchorOffsetY = ch * node.anchorY;

        // 填充顶点位置数据
        for (let i = 0; i < points.length; i++) {
            const idx = i * this.step;
            local[idx] = points[i].x;
            local[idx + 1] = points[i].y;
        }

        if (!cc.sys.isNative) {
            this.fitXY(vData);
        }

        // 计算UV坐标（基于节点尺寸）
        for (let i = 0; i < points.length; i++) {
            const idx = i * this.step;
            // 将顶点坐标转换为0-1范围的UV
            vData[idx + this.uvOffset] = (local[idx] + anchorOffsetX) / cw;
            vData[idx + this.uvOffset + 1] = 1 - (local[idx + 1] + anchorOffsetY) / ch;
        }

        this.fitUV(vData);
    }

    //本地坐标转世界坐标
    private fitXY(vData: Float32Array) {
        let m = this.node['_worldMatrix'].m;
        let m0 = m[0], m1 = m[1], m4 = m[4], m5 = m[5], m12 = m[12], m13 = m[13];
        for (let i = this.xyOffset, len = vData.length, step = this.step, local = this.local; i < len; i += step) {
            let x = local[i], y = local[i + 1];
            vData[i] = x * m0 + y * m4 + m12;
            vData[i + 1] = x * m1 + y * m5 + m13;
        }
    }

    //更新纹理UV
    private fitUV(vData: Float32Array) {
        let frame = this._spriteFrame;
        if (frame === null) return;
        let atlasW = frame['_texture'].width, atlasH = frame['_texture'].height;
        let frameRect = frame['_rect'];
        if (frame['_rotated']) {
            for (let i = this.uvOffset, id = 0, len = vData.length, step = this.step; i < len; i += step, ++id) {
                let tmp = vData[i];
                vData[i] = ((1 - vData[i + 1]) * frameRect.height + frameRect.x) / atlasW;
                vData[i + 1] = (tmp * frameRect.width + frameRect.y) / atlasH;
            }
        } else {
            for (let i = this.uvOffset, id = 0, len = vData.length, step = this.step; i < len; i += step, ++id) {
                vData[i] = (vData[i] * frameRect.width + frameRect.x) / atlasW;
                vData[i + 1] = (vData[i + 1] * frameRect.height + frameRect.y) / atlasH;
            }
        }
    }

    //更新顶点颜色
    private updateColor() {
        let uintVData = this.renderData.uintVDatas[0];
        let color = this.node.color['_val'];
        for (let i = this.colorOffset, len = uintVData.length, step = this.step; i < len; uintVData[i] = color, i += step);
    }

    // 计算顶点索引（使用三角剖分算法）
    private updateIndice() {
        const points = this._polygonCollider.points;
        if (!points || points.length < 3) return;

        let iData = this.renderData.iDatas[0];
        const n = points.length;

        // 使用三角扇剖分凸多边形（快速高效）
        // 从第一个顶点出发连接其他顶点形成三角形
        for (let i = 0; i < n - 2; i++) {
            const base = i * 3;
            iData[base] = 0;           // 第一个顶点
            iData[base + 1] = i + 1;   // 当前顶点
            iData[base + 2] = i + 2;   // 下一个顶点
        }
    }

    //锚点改变时更新
    private onAnchorChanged() {
        this['setVertsDirty']();
    }

    //尺寸改变时更新
    private onSizeChanged() {
        this['setVertsDirty']();
        if (this._spriteFrame) {
            switch (this._sizeMode) {
                case cc.Sprite.SizeMode.TRIMMED:
                    let rect = this._spriteFrame['_rect'].size;
                    if (this.node.width === rect.width && this.node.height === rect.height) return;
                    break;
            }
        }
        this._sizeMode = cc.Sprite.SizeMode.CUSTOM;
    }

    // 在编辑器中绘制多边形轮廓
    protected _onDrawGizmos() {
        if (!CC_EDITOR || !this.showOutline) return;

        const ctx = cc['gizmos'].getContext('2d');
        if (!ctx) return;

        ctx.lineWidth = this.outlineWidth;
        ctx.strokeStyle = this.outlineColor.toHEX('#rrggbb');

        // 获取PolygonCollider的点
        const points = this._polygonCollider.points;
        if (!points || points.length < 3) return;

        // 获取世界坐标
        const worldPoints = points.map(p => {
            return this.node.convertToWorldSpaceAR(cc.v3(p.x, p.y, 0));
        });

        // 转换到画布坐标
        const canvasPoints = worldPoints.map(p => {
            const pos = cc.Canvas.instance.node.convertToNodeSpaceAR(p);
            return { x: pos.x, y: -pos.y };
        });

        // 绘制多边形轮廓
        ctx.beginPath();
        ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
        for (let i = 1; i < canvasPoints.length; i++) {
            ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // 绘制顶点标记
        const markerSize = 5;
        canvasPoints.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, markerSize, 0, Math.PI * 2);
            ctx.fillStyle = this.outlineColor.toHEX('#rrggbb');
            ctx.fill();
        });
    }

    // 重置为默认五边形
    public resetPoints() {
        if (!this._polygonCollider) return;

        // 创建正五边形顶点
        const radius = 50;
        const points: cc.Vec2[] = [];
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i / 4) - Math.PI / 2; // 从顶部开始
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            points.push(cc.v2(x, y));
        }

        this._polygonCollider.points = points;
        this.onPointsChanged();
    }

    // 设置多边形顶点
    public setPoints(points: cc.Vec2[]) {
        if (!this._polygonCollider) return;
        if (points.length < 3) {
            cc.warn('Points array must contain at least 3 points');
            return;
        }
        this._polygonCollider.points = points;
        this.onPointsChanged();
    }

    // 添加顶点
    public addPoint(point: cc.Vec2) {
        if (!this._polygonCollider) return;
        const points = [...this._polygonCollider.points, point];
        this.setPoints(points);
    }

    // 移除顶点
    public removePoint(index: number) {
        if (!this._polygonCollider) return;
        if (index < 0 || index >= this._polygonCollider.points.length) return;

        const points = [...this._polygonCollider.points];
        points.splice(index, 1);

        if (points.length >= 3) {
            this.setPoints(points);
        }
    }

    // 更新顶点
    public updatePoint(index: number, point: cc.Vec2) {
        if (!this._polygonCollider) return;
        if (index < 0 || index >= this._polygonCollider.points.length) return;

        const points = [...this._polygonCollider.points];
        points[index] = point;
        this.setPoints(points);
    }
}