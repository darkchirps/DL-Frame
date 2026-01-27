const { ccclass } = cc._decorator;

/**
 * 视频渲染装配器
 * 负责将组件的顶点数据填充到渲染 Buffer 中
 */
@ccclass
export default class CCMVideoAssembler extends (cc as any).Assembler {

    // @ts-ignore
    private renderData: cc.RenderData = new cc.RenderData();
    private local: number[] = [];

    // 定义顶点格式常量
    private readonly floatsPerVert = 5; // x, y, u, v, color
    private readonly verticesCount = 4;
    private readonly indicesCount = 6;
    private readonly uvOffset = 2;
    private readonly colorOffset = 4;

    public constructor() {
        super();
        // 默认 UV：左下起始 (0,1) -> 右上 (1,0) (OpenGL 坐标系通常翻转，视具体 shader 而定)
        // 这里原代码是: 0,1, 1,1, 0,0, 1,0 -> BL, BR, TL, TR
        this.uv = [0, 1, 1, 1, 0, 0, 1, 0];
        
        // @ts-ignore
        this.initData();
        this.initLocal();
    }

    private initData(): void {
        this.renderData.init(this);
        // 初始化 Quad 数据 (4个顶点, 6个索引)
        this.renderData.createQuadData(0, this.verticesCount * this.floatsPerVert, this.indicesCount);
    }

    private initLocal(): void {
        this.local.length = 4;
    }

    /**
     * 更新顶点颜色
     */
    public updateColor(comp: cc.Component, color?: number): void {
        const uintVerts = this.renderData.uintVDatas[0];
        if (!uintVerts) return;

        // @ts-ignore
        const nodeColor = color != null ? color : comp.node.color._val;
        
        const floatsPerVert = this.floatsPerVert;
        const colorOffset = this.colorOffset;
        
        for (let i = colorOffset, l = uintVerts.length; i < l; i += floatsPerVert) {
            uintVerts[i] = nodeColor;
        }
    }

    private getBuffer() {
        // @ts-ignore
        return cc.renderer._handle._meshBuffer;
    }

    /**
     * 计算世界坐标系的顶点位置
     */
    private updateWorldVerts(comp: cc.Component): void {
        const local = this.local;
        const verts = this.renderData.vDatas[0];

        const vl = local[0];
        const vb = local[1];
        const vr = local[2];
        const vt = local[3];

        if (CC_JSB) {
            // Native 环境下，WorldMatrix 计算通常由 C++ 层或更底层的 Assembler 处理
            // 但如果这里需要手动算，假设节点 world transform 已应用到 JSB 上下文
            // 或者直接使用本地坐标（视 Native Assembler 实现而定，通常自定义 Assembler 在 Native 需要 C++ 对应实现）
            // 如果此 Assembler 仅用于 JS 逻辑填充：
            
            // Left Bottom
            verts[0] = vl; verts[1] = vb;
            // Right Bottom
            verts[5] = vr; verts[6] = vb;
            // Left Top
            verts[10] = vl; verts[11] = vt;
            // Right Top
            verts[15] = vr; verts[16] = vt;
        } else {
            // Web 环境：应用节点的世界矩阵
            // @ts-ignore
            const matrix: cc.Mat4 = comp.node._worldMatrix;
            const m = matrix.m;
            
            const a = m[0], b = m[1], c = m[4], d = m[5], tx = m[12], ty = m[13];
            
            // 优化：检查是否仅平移 (Scale=1, Rotation=0)
            const justTranslate = a === 1 && b === 0 && c === 0 && d === 1;

            if (justTranslate) {
                // Left Bottom
                verts[0] = vl + tx;  verts[1] = vb + ty;
                // Right Bottom
                verts[5] = vr + tx;  verts[6] = vb + ty;
                // Left Top
                verts[10] = vl + tx; verts[11] = vt + ty;
                // Right Top
                verts[15] = vr + tx; verts[16] = vt + ty;
            } else {
                const al = a * vl, ar = a * vr;
                const bl = b * vl, br = b * vr;
                const cb = c * vb, ct = c * vt;
                const db = d * vb, dt = d * vt;

                // Left Bottom
                verts[0] = al + cb + tx;  verts[1] = bl + db + ty;
                // Right Bottom
                verts[5] = ar + cb + tx;  verts[6] = br + db + ty;
                // Left Top
                verts[10] = al + ct + tx; verts[11] = bl + dt + ty;
                // Right Top
                verts[15] = ar + ct + tx; verts[16] = br + dt + ty;
            }
        }
    }

    /**
     * 将 RenderData 填充到全局 MeshBuffer
     */
    public fillBuffers(comp: cc.Component, renderer: any): void {
        if (renderer.worldMatDirty) {
            this.updateWorldVerts(comp);
        }

        const renderData = this.renderData;
        const vData = renderData.vDatas[0];
        const iData = renderData.iDatas[0];

        const buffer = this.getBuffer();
        
        // 请求 Buffer 空间
        const offsetInfo = buffer.request(this.verticesCount, this.indicesCount);

        // 填充顶点数据
        const vertexOffset = offsetInfo.byteOffset >> 2;
        const vbuf = buffer._vData;

        // 安全检查：防止 Buffer 溢出
        if (vData.length + vertexOffset > vbuf.length) {
            vbuf.set(vData.subarray(0, vbuf.length - vertexOffset), vertexOffset);
        } else {
            vbuf.set(vData, vertexOffset);
        }

        // 填充索引数据
        const ibuf = buffer._iData;
        let indiceOffset = offsetInfo.indiceOffset;
        const vertexId = offsetInfo.vertexOffset;

        for (let i = 0, l = iData.length; i < l; i++) {
            ibuf[indiceOffset++] = vertexId + iData[i];
        }
    }

    /**
     * 更新渲染数据入口
     */
    public updateRenderData(comp: cc.Component): void {
        // @ts-ignore
        if (comp._vertsDirty) {
            this.updateUVs(comp);
            this.updateVerts(comp);
            // @ts-ignore
            comp._vertsDirty = false;
        }
    }

    private updateUVs(comp: cc.Component): void {
        const uv = this.uv;
        const uvOffset = this.uvOffset;
        const floatsPerVert = this.floatsPerVert;
        const verts = this.renderData.vDatas[0];

        for (let i = 0; i < 4; i++) {
            const srcOffset = i * 2;
            const dstOffset = floatsPerVert * i + uvOffset;
            verts[dstOffset] = uv[srcOffset];
            verts[dstOffset + 1] = uv[srcOffset + 1];
        }
    }

    private updateVerts(comp: cc.Component) {
        const node = comp.node;
        const cw = node.width;
        const ch = node.height;
        const appx = node.anchorX * cw;
        const appy = node.anchorY * ch;

        // 计算本地坐标 (Left, Bottom, Right, Top)
        const l = -appx;
        const b = -appy;
        const r = cw - appx;
        const t = ch - appy;

        const local = this.local;
        local[0] = l;
        local[1] = b;
        local[2] = r;
        local[3] = t;

        this.updateWorldVerts(comp);
    }
}
