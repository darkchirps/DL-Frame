/*******************************************************************************
 * 描述:    框架全局方法管理器 转换相关
*******************************************************************************/
export default class GeneralShift {
    /**base64转spriteFrame*/
    public base64SpriteFrame(base64Data: string) {
        let iconData = "data:image/jpg;base64," + base64Data;
        var playerImage = new Image();
        playerImage.crossOrigin = 'anonymous';
        playerImage.src = iconData;
        let texture = new cc.Texture2D();
        texture.initWithElement(playerImage);
        let spriteFarme = new cc.SpriteFrame();
        spriteFarme.setTexture(texture);
        return spriteFarme;
    }
    /**
     * 将二进制中ArrayBuffer转换为图片并显示到Sprite
     * * @param arrayBuffer 图片的二进制数据（支持jpg/png/webp等格式）
     */
    public bufferSpriteFrame(arrayBuffer: ArrayBuffer) {
        if (!arrayBuffer || arrayBuffer.byteLength === 0) return;
        // 1. 将ArrayBuffer转为Blob对象
        const blob = new Blob([arrayBuffer], { type: 'image/jpg' });
        // 2. 创建Blob的URL（或转Base64，二选一即可）
        const blobUrl = URL.createObjectURL(blob);
        // 3. 加载图片并转为Cocos纹理
        const img = new Image();
        img.crossOrigin = 'anonymous'; // 解决跨域问题
        img.src = blobUrl;

        const texture = new cc.Texture2D();
        texture.initWithElement(img); // 核心：用Image对象初始化纹理
        texture.handleLoadedTexture(); // 处理纹理加载
        const spriteFrame = new cc.SpriteFrame(texture);
        return spriteFrame;
    }
}