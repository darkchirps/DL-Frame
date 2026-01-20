/*******************************************************************************
 * 描述:    支持3D旋转的Sprite
 * 1、修改组件的angle属性，可以让SpriteFrame图片3D旋转
 *    旋转角度>0 逆时针，旋转角度<0 顺时针
 * 2、网格越多，图片越保真，但也会增加逻辑运算量。
 * 3、透视程度（取值范围[0,1]，0代表不透视，1代表极限透视）
 * 4、可以设置绕X轴旋转、绕Y轴旋转
*******************************************************************************/
export enum SizeMode { 'CUSTOM: 自定义尺寸', 'TRIMMED: 原始尺寸裁剪透明像素', 'RAW: 图片原始尺寸' }
export enum RotationAxis { 绕锚点X轴旋转, 绕锚点Y轴旋转 }
const { ccclass, property, menu } = cc._decorator;
@ccclass
@menu('常用组件/旋转图片')
export default class spriteFlipper extends cc.RenderComponent {
    @property({ type: cc.SpriteAtlas, serializable: false, readonly: true, displayName: CC_DEV && 'Atlas' })
    private atlas: cc.SpriteAtlas = null;
    @property
    private _spriteFrame: cc.SpriteFrame = null;
    @property({ type: cc.SpriteFrame, displayName: CC_DEV && 'Sprite Frame' })
    get spriteFrame() { return this._spriteFrame; }
    set spriteFrame(value: cc.SpriteFrame) {
        this._spriteFrame = value;
        this.updateSpriteFrame();
        this.updateSizeMode();
        this.updateUV();
    }
    @property
    private _sizeMode: SizeMode = SizeMode['TRIMMED: 原始尺寸裁剪透明像素'];
    @property({ type: cc.Enum(SizeMode), displayName: CC_DEV && 'Size Mode' })
    get sizeMode() { return this._sizeMode; }
    set sizeMode(value: SizeMode) {
        this._sizeMode = value;
        this.updateSizeMode();
    }
    @property
    private _rotationAxis: RotationAxis = RotationAxis.绕锚点Y轴旋转;
    @property({ type: cc.Enum(RotationAxis), displayName: CC_DEV && '旋转轴' })
    get rotationAxis() { return this._rotationAxis; }
    set rotationAxis(value: RotationAxis) {
        this._rotationAxis = value;
        this['setVertsDirty']();
    }
    @property
    private _grid: cc.Vec2 = cc.v2(3, 3);
    @property({ displayName: CC_DEV && '网格', tooltip: CC_DEV && '网格越多图像越保真，但性能消耗也越大' })
    get grid() { return this._grid; }
    set grid(value: cc.Vec2) {
        this._grid = cc.v2(Math.max(~~value.x, 1), Math.max(~~value.y, 1));
        this.createBuffer();
        this.updatePoints();
        this.updateUV();
        this.updateIndice();
        this['setVertsDirty']();
        this.node['_renderFlag'] |= cc['RenderFlow'].FLAG_OPACITY_COLOR;
    }
    @property
    private _angle: number = 0;
    @property({ displayName: CC_DEV && '旋转角度' })
    get angle() { return this._angle; }
    set angle(value: number) {
        this._angle = value;
        this['setVertsDirty']();
    }
    @property
    private _obDisRatio: number = 0.5;
    @property({ min: 0, max: 1, step: 0.1, slide: true, displayName: CC_DEV && '透视程度', tooltip: CC_DEV && '0代表不透视，1代表极限透视\n透视程度较大时会失真\n建议增加网格提升保真度' })
    get obDisRatio() { return this._obDisRatio; }
    set obDisRatio(value: number) {
        this._obDisRatio = value;
        this.updateObDis();
        this['setVertsDirty']();
    }
    private renderData = null;                      //提交给GPU的渲染数据，包括vDatas、uintVDatas、iDatas
    private xyOffset: number = 1e8;                 //顶点坐标数据，在顶点数组中的偏移
    private uvOffset: number = 1e8;                 //顶点uv数据，在顶点数组中的偏移
    private colorOffset: number = 1e8;              //顶点颜色数据，在顶点数组中的偏移
    private step: number = 0;                       //单个顶点数据的长度，例如：顶点格式“x,y,u,v,color” step = 5
    private obDis: number = 0;                      //观察者与图片的距离
    private points: cc.Vec2[] = [];                 //未翻转前的网格顶点坐标
    private local: number[] = [];                   //顶点本地坐标

    protected _resetAssembler() {
        //定制Assembler
        let assembler = this['_assembler'] = new cc['Assembler']();
        assembler.updateRenderData = this.updateXY.bind(this);
        assembler.updateColor = this.updateColor.bind(this);
        assembler.init(this);
        //定制RenderData
        this.renderData = new cc['RenderData']();
        this.renderData.init(assembler);
        //初始化顶点格式
        let vfmt = assembler.getVfmt();
        let fmtElement = vfmt._elements;
        for (let i = fmtElement.length - 1; i > -1; this.step += fmtElement[i--].bytes >> 2);
        let fmtAttr = vfmt._attr2el;
        this.xyOffset = fmtAttr.a_position.offset >> 2;
        this.uvOffset = fmtAttr.a_uv0.offset >> 2;
        this.colorOffset = fmtAttr.a_color.offset >> 2;
    }

    protected onLoad() {
        this.updateSpriteFrame();
        this.updateSizeMode();
        this.createBuffer();
        this.updateUV();
        this.updateIndice();
        this.updateObDis();
        this.updatePoints();
        this.node.on(cc.Node.EventType.ANCHOR_CHANGED, this.onAnchorChanged, this);
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    protected onDestroy() {
        super.onDestroy();
        this.node.off(cc.Node.EventType.ANCHOR_CHANGED, this.onAnchorChanged, this);
        this.node.off(cc.Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    //设置顶点个数和三角形个数
    private createBuffer() {
        let vertices = new Float32Array(this.step * (this._grid.x + 1) * (this._grid.y + 1));
        let indices = new Uint16Array(3 * this._grid.x * this._grid.y << 1);
        this.renderData.updateMesh(0, vertices, indices);
    }
    //Web平台，将renderData的数据提交给GPU渲染，vDatas使用世界坐标
    //原生平台并不会执行该函数，引擎另外实现了渲染函数，vDatas使用本地坐标
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
    //可以传入cc.SpriteFrame图集帧（支持合批，推荐），或单张图片cc.Texture2D
    private updateSpriteFrame() {
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
    //根据尺寸模式，修改节点尺寸
    private updateSizeMode() {
        if (!this._spriteFrame) return;
        switch (this._sizeMode) {
            case SizeMode['TRIMMED: 原始尺寸裁剪透明像素']: this.node.setContentSize(this._spriteFrame['_rect'].size); break;
            case SizeMode['RAW: 图片原始尺寸']: this.node.setContentSize(this._spriteFrame['_originalSize']); break;
        }
    }
    //根据透视程度，计算观察者与图片的距离
    private updateObDis() {
        if (this._rotationAxis === RotationAxis.绕锚点Y轴旋转) {
            let ax = this.node.anchorX;
            this.obDis = this.node.width * (ax > 0.5 ? ax : 1 - ax) * (this._obDisRatio === 0 ? 1e8 : Math.pow(2, 3 * (1 - this._obDisRatio)));
        } else {
            let ay = this.node.anchorY;
            this.obDis = this.node.height * (ay > 0.5 ? ay : 1 - ay) * (this._obDisRatio === 0 ? 1e8 : Math.pow(2, 3 * (1 - this._obDisRatio)));
        }
    }
    //计算网格顶点未旋转状态下的XY
    private updatePoints() {
        let node = this.node, cw = node.width, ch = node.height, ax = node.anchorX, ay = node.anchorY;
        let l = -cw * ax, r = cw * (1 - ax), b = -ch * ay, t = ch * (1 - ay);
        let col = this._grid.x, row = this._grid.y;
        let points = this.points;
        for (let i = 0, rowSize = row + 1; i < rowSize; ++i) {
            for (let j = 0, colSize = col + 1; j < colSize; ++j) {
                points[colSize * i + j] = cc.v2(l + (r - l) * j / col, b + (t - b) * i / row);
            }
        }
    }
    //计算顶点坐标
    private updateXY() {
        let vData = this.renderData.vDatas[0];
        let local = cc.sys.isNative ? vData : this.local;
        let points = this.points;
        let radian = this._angle * Math.PI / 180;
        let cos = Math.cos(radian), sin = Math.sin(radian);
        let obDis = this.obDis;
        //根据透视的相似三角形规则，计算顶点透视旋转radian弧度后的坐标
        if (this._rotationAxis === RotationAxis.绕锚点Y轴旋转) {
            for (let i = this.xyOffset, id = 0, step = this.step, len = vData.length; i < len; i += step, ++id) {
                let point = points[id], ratio = obDis / (obDis + point.x * sin);
                local[i] = point.x * cos * ratio;
                local[i + 1] = point.y * ratio;
            }
        } else {
            for (let i = this.xyOffset, id = 0, step = this.step, len = vData.length; i < len; i += step, ++id) {
                let point = points[id], ratio = obDis / (obDis - point.y * sin);
                local[i] = point.x * ratio;
                local[i + 1] = point.y * cos * ratio;
            }
        }
        !cc.sys.isNative && this.fitXY(vData);
    }
    //自动适配XY，修改顶点xy数据后需主动调用该函数
    private fitXY(vData: Float32Array) {
        let m = this.node['_worldMatrix'].m;
        let m0 = m[0], m1 = m[1], m4 = m[4], m5 = m[5], m12 = m[12], m13 = m[13];
        for (let i = this.xyOffset, len = vData.length, step = this.step, local = this.local; i < len; i += step) {
            let x = local[i], y = local[i + 1];
            vData[i] = x * m0 + y * m4 + m12;
            vData[i + 1] = x * m1 + y * m5 + m13;
        }
    }
    //计算UV坐标
    private updateUV() {
        let vData = this.renderData.vDatas[0];
        let size = this._grid.x + 1;
        let deltX = 1 / this._grid.x, deltY = 1 / this._grid.y;
        for (let i = this.uvOffset, id = 0, step = this.step, len = vData.length; i < len; i += step, ++id) {
            vData[i] = (id % size) * deltX;
            vData[i + 1] = 1 - ~~(id / size) * deltY;
        }
        this.fitUV(vData);
    }
    //自动适配UV，修改顶点uv数据后需主动调用该函数
    private fitUV(vData: Float32Array) {
        let frame = this._spriteFrame;
        if (frame === null) return;
        let atlasW = frame['_texture'].width, atlasH = frame['_texture'].height;
        let frameRect = frame['_rect'];
        //计算图集帧在大图中的UV坐标
        if (frame['_rotated']) {//如果图集帧发生旋转，计算UV时需回正
            for (let i = this.uvOffset, id = 0, len = vData.length, step = this.step; i < len; i += step, ++id) {
                let tmp = vData[i];
                vData[i] = ((1 - vData[i + 1]) * frameRect.height + frameRect.x) / atlasW;
                vData[i + 1] = (tmp * frameRect.width + frameRect.y) / atlasH;
            }
        } else {//如果图集帧未发生旋转，正常计算即可
            for (let i = this.uvOffset, id = 0, len = vData.length, step = this.step; i < len; i += step, ++id) {
                vData[i] = (vData[i] * frameRect.width + frameRect.x) / atlasW;
                vData[i + 1] = (vData[i + 1] * frameRect.height + frameRect.y) / atlasH;
            }
        }
    }
    //计算顶点颜色
    private updateColor() {
        let uintVData = this.renderData.uintVDatas[0];
        let color = this.node.color['_val'];
        for (let i = this.colorOffset, len = uintVData.length, step = this.step; i < len; uintVData[i] = color, i += step);
    }
    //计算顶点索引
    private updateIndice() {
        let iData = this.renderData.iDatas[0];
        let size = this._grid.x + 1;
        for (let i = 0, len = iData.length, id = 0; i < len; ++id) {
            (id + 1) % size === 0 && ++id;
            iData[i++] = id;
            iData[i++] = id + 1;
            iData[i++] = id + size;
            iData[i++] = id + size;
            iData[i++] = id + 1;
            iData[i++] = id + size + 1;
        }
    }
    //修改节点锚点后，更新观察者距离和顶点数据
    private onAnchorChanged() {
        this.updateObDis();
        this.updatePoints();
        this['setVertsDirty']();
    }
    //修改节点尺寸后，更新顶点数据，并根据sizeMode设置图片宽高
    private onSizeChanged() {
        this.updatePoints();
        this['setVertsDirty']();
        if (this._spriteFrame) {
            switch (this._sizeMode) {
                case SizeMode['TRIMMED: 原始尺寸裁剪透明像素']:
                    let rect = this._spriteFrame['_rect'].size;
                    if (this.node.width === rect.width && this.node.height === rect.height) return;
                    break;
                case SizeMode['RAW: 图片原始尺寸']:
                    let size = this._spriteFrame['_originalSize'];
                    if (this.node.width === size.width && this.node.height === size.height) return;
                    break;
            }
        }
        this._sizeMode = SizeMode['CUSTOM: 自定义尺寸'];
    }
}