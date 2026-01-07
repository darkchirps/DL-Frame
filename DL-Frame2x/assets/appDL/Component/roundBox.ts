/*******************************************************************************
 * 描述:    圆角矩形，支持合批
*******************************************************************************/
const CENTER_IDATA = [0, 9, 11, 0, 11, 1, 2, 8, 10, 2, 4, 8, 3, 5, 7, 3, 7, 6];
export enum SizeMode { 'CUSTOM: 自定义尺寸', 'TRIMMED: 原始尺寸裁剪透明像素', 'RAW: 图片原始尺寸' }
const { ccclass, property, menu } = cc._decorator;
@ccclass('Corner')
class Corner {
    @property({ displayName: CC_DEV && '↙ 左下' })
    leftBottom: boolean = true;
    @property({ displayName: CC_DEV && '↘ 右下' })
    rightBottom: boolean = true;
    @property({ displayName: CC_DEV && '↗ 右上' })
    rightTop: boolean = true;
    @property({ displayName: CC_DEV && '↖ 左上' })
    leftTop: boolean = true;
    visible: boolean[] = null;
}
@ccclass
@menu('常用组件/roundBox')
export default class RoundBox extends cc.RenderComponent {
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
    private _radius: number = 100;
    @property({ displayName: CC_DEV && '圆角半径' })
    get radius() { return this._radius; }
    set radius(value: number) {
        this._radius = Math.max(value, 0);
        this['setVertsDirty']();
    }
    @property
    private _segment: number = 5;
    @property({ type: cc.Integer, displayName: CC_DEV && '线段数量' })
    get segment() { return this._segment; }
    set segment(value: number) {
        this._segment = Math.max(value, 1);
        this.createBuffer();
        this.updateIndice();
        this['setVertsDirty']();
        this.node['_renderFlag'] |= cc['RenderFlow'].FLAG_OPACITY_COLOR;
    }
    @property
    private _corner: Corner = new Corner();
    @property({ displayName: CC_DEV && '圆角可见性' })
    get corner() { return this._corner; }
    set corner(value: Corner) {
        this._corner = value;
        this.updateCorner();
        this.createBuffer();
        this.updateIndice();
        this['setVertsDirty']();
        this.node['_renderFlag'] |= cc['RenderFlow'].FLAG_OPACITY_COLOR;
    }
    private renderData = null;                      //提交给GPU的渲染数据，包括vDatas、uintVDatas、iDatas
    private xyOffset: number = 1e8;                 //顶点坐标数据，在顶点数组中的偏移
    private uvOffset: number = 1e8;                 //顶点uv数据，在顶点数组中的偏移
    private colorOffset: number = 1e8;              //顶点颜色数据，在顶点数组中的偏移
    private step: number = 0;                       //单个顶点数据的长度，例如：顶点格式“x,y,u,v,color” step = 5
    private local: number[] = [];                   //顶点本地坐标

    protected _resetAssembler() {
        //定制Assembler
        let assembler = this['_assembler'] = new cc['Assembler']();
        assembler.updateRenderData = this.updateVData.bind(this);
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
        this.updateCorner();
        this.createBuffer();
        this.updateIndice();
        this.node.on(cc.Node.EventType.ANCHOR_CHANGED, this.onAnchorChanged, this);
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    protected onDestroy() {
        super.onDestroy();
        this.node.off(cc.Node.EventType.ANCHOR_CHANGED, this.onAnchorChanged, this);
        this.node.off(cc.Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }
    //更新圆角数据
    private updateCorner() {
        let corner = this._corner;
        corner.visible = [corner.leftBottom, corner.rightBottom, corner.rightTop, corner.leftTop];
    }
    //设置顶点个数和三角形个数
    private createBuffer() {
        let cornerCnt = 0;
        for (let i = 0, visible = this._corner.visible; i < 4; visible[i++] && ++cornerCnt);
        let vertices = new Float32Array(5 * (12 + cornerCnt * (this._segment - 1)));
        let indices = new Uint16Array(3 * (6 + cornerCnt * this._segment));
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
        // switch (this._sizeMode) {
        //     case SizeMode['TRIMMED: 原始尺寸裁剪透明像素']: this.node.setContentSize(this._spriteFrame['_rect'].size); break;
        //     case SizeMode['RAW: 图片原始尺寸']: this.node.setContentSize(this._spriteFrame['_originalSize']); break;
        // }
    }
    //计算VData数据，包括xy,uv,color
    private updateVData() {
        let vData = this.renderData.vDatas[0];
        let local = cc.sys.isNative ? vData : this.local;
        let node = this.node;
        let cw = node.width, ch = node.height;
        let l = -cw * node.anchorX;
        let b = -ch * node.anchorY;
        let r = cw * (1 - node.anchorX);
        let t = ch * (1 - node.anchorY);
        let radius = Math.min(this._radius, Math.min(cw, ch) / 2);
        let lo = l + radius;
        let bo = b + radius;
        let ro = r - radius;
        let to = t - radius;
        let corner = this._corner;
        local[0] = lo; local[1] = corner.leftBottom ? bo : b;
        local[5] = l; local[6] = local[1];
        local[10] = lo; local[11] = b;
        local[15] = ro; local[16] = corner.rightBottom ? bo : b;
        local[20] = ro; local[21] = b;
        local[25] = r; local[26] = local[16];
        local[30] = ro; local[31] = corner.rightTop ? to : t;
        local[35] = r; local[36] = local[31];
        local[40] = ro; local[41] = t;
        local[45] = lo; local[46] = corner.leftTop ? to : t;
        local[50] = lo; local[51] = t;
        local[55] = l; local[56] = local[46];
        let radian = Math.PI / (this._segment << 1);
        let cos = Math.cos(radian);
        let sin = Math.sin(radian);
        let visible = corner.visible;
        for (let i = 0, offset = 60, step = this.step; i < 4; ++i) {
            if (!visible[i]) continue;
            let id = 3 * i * step;
            let ox = local[id];
            let oy = local[id + 1];
            id += step;
            let deltX = local[id] - ox;
            let deltY = local[id + 1] - oy;
            for (let j = 0, len = this._segment - 1; j < len; ++j) {
                local[offset] = ox + deltX * cos - deltY * sin;
                local[offset + 1] = oy + deltY * cos + deltX * sin;
                deltX = local[offset] - ox;
                deltY = local[offset + 1] - oy;
                offset += step;
            }
        }
        !cc.sys.isNative && this.fitXY(vData);
        for (let i = 0, len = vData.length, step = this.step; i < len; i += step) {
            vData[i + 2] = (local[i] - l) / cw;
            vData[i + 3] = 1 - (local[i + 1] - b) / ch;
        }
        this.fitUV(vData);
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
        for (let i = CENTER_IDATA.length - 1; i > -1; iData[i] = CENTER_IDATA[i--]);
        let offset = CENTER_IDATA.length;
        let visible = this._corner.visible;
        let id = 36;
        for (let i = 0; i < 4; ++i) {
            if (!visible[i]) continue;
            let o = 3 * i;
            let a = o + 1;
            let b = id / 3;
            for (let j = 0, len = this._segment - 1; j < len; ++j) {
                iData[offset++] = o;
                iData[offset++] = a;
                iData[offset++] = b;
                a = b++;
                id += 3;
            }
            iData[offset++] = o;
            iData[offset++] = a;
            iData[offset++] = o + 2;
        }
    }
    //修改节点锚点后，更新顶点数据
    private onAnchorChanged() {
        this['setVertsDirty']();
    }
    //修改节点尺寸后，更新顶点数据，并根据sizeMode设置图片宽高
    private onSizeChanged() {
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