import { assetManager } from "cc";
import { Sprite, SpriteFrame, Texture2D, ImageAsset, sys } from "cc";

/*******************************************************************************
 * 描述:    框架全局方法管理器 转换/下载相关
*******************************************************************************/
export default class GeneralShift {
    /**base64转spriteFrame*/
    public Base64SpriteFrame(base64Data: string, sprite?: Sprite) {
        return new Promise<SpriteFrame>((resolve, reject) => {
            try {
                // 修复：image/jpg 不是合法 MIME，统一改为 image/jpeg
                const iconData = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
                const image = new Image();
                const texture = new Texture2D();
                const frame = new SpriteFrame();
                image.crossOrigin = 'anonymous';
                image.onload = () => {
                    try {
                        texture.image = new ImageAsset(image);
                        frame.texture = texture;
                        resolve(frame);
                    } catch (e) {
                        reject(e);
                    }
                };
                image.onerror = (e) => reject(new Error('image load error'));
                image.src = iconData;
            } catch (e) {
                reject(e);
            }
        });
    }
    /**下载文件从浏览器
     * @param info 下载信息
     * @param name 文件名
     * @param type 文件类型 如：txt,json,zip等
    */
    public downloadFile(info: any, name: string, type: string) {
        var jsonString = this.resolveJsonObjectCRLF(info);
        this.saveForBrowser(jsonString, name + '.' + type);
    }
    /**解析*/
    public resolveJsonObjectCRLF(jsonString) {
        //如果有CRLF说明此关卡是已处理的数据再次加载
        if (!jsonString || typeof jsonString !== 'string') return jsonString;
        if (jsonString.indexOf("\r\n") !== -1) { return jsonString; }
        var newStr = "";
        var index_ele0_s = jsonString.indexOf("elements");
        var index_ele0_e = jsonString.indexOf("]]}", index_ele0_s);
        var index_ele1_s = jsonString.indexOf("elements1");
        var index_ele1_e = jsonString.indexOf("]]}", index_ele1_s);
        for (var i = 0; i < jsonString.length; i++) {
            var c = jsonString.charAt(i);
            newStr += c;
            if (c == "{") {
                newStr += "\r\n\t";
            }
            if (i < index_ele0_s) {//               
                if (c == ',') {
                    newStr += '\r\n\t';
                }
            } else if (i >= index_ele0_s && i <= index_ele0_e) {
                if (c == '[' && jsonString.charAt(i + 1) == '[') {
                    newStr += '\r\n\t\t';
                } else if (c == ']' && jsonString.charAt(i + 1) == ',') {
                    i++;
                    newStr += ",";
                    newStr += '\r\n\t\t';
                } else if (c == ']' && jsonString.charAt(i + 1) == ']') {
                    i++;
                    newStr += ']';
                    newStr += "\r\n";
                    if (jsonString.charAt(i + 1) != '}') {
                        newStr += "\t";
                    }
                }
            } else if (index_ele1_s != -1 && i >= index_ele1_s && i <= index_ele1_e) {
                if (c == '[' && jsonString.charAt(i + 1) == '[') {
                    newStr += '\r\n\t\t';
                } else if (c == ']' && jsonString.charAt(i + 1) == ',') {
                    i++;
                    newStr += ",";
                    newStr += '\r\n\t\t';
                } else if (c == ']' && jsonString.charAt(i + 1) == ']') {
                    i++;
                    newStr += ']';
                    newStr += "\r\n";
                    if (jsonString.charAt(i + 1) != '}') {
                        newStr += "\t";
                    }
                }
            } else { };
        }
        return newStr;
    }
    /**浏览器保存文件*/
    public saveForBrowser(textToWrite, fileNameToSaveAs) {
        if (!sys.isBrowser) return;
        try {
            const blob = new Blob([textToWrite], { type: 'application/octet-stream' });
            const url = (window.URL || (window as any).webkitURL).createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = fileNameToSaveAs;
            document.body.appendChild(link);
            link.click();
            // 延长清理时间，确保浏览器有足够时间触发下载后再撤销 URL
            setTimeout(() => {
                document.body.removeChild(link);
                (window.URL || (window as any).webkitURL).revokeObjectURL(url);
            }, 1000);
        } catch (e) {
            console.warn('saveForBrowser error', e);
        }
    }
    /**浏览器保存图片到本地*/
    public saveSpriteFrameToFile(sprite: Sprite) {
        if (!sprite || !sprite.spriteFrame) return;
        try {
            // 在不同版本 Cocos Creator 上 texture 的字段可能不同，尽量稳健获取
            // @ts-ignore
            const tex: any = sprite.spriteFrame.texture || sprite.spriteFrame.getTexture && sprite.spriteFrame.getTexture();
            let url: string | undefined;
            if (tex) {
                url = tex.nativeUrl || (tex._generatedMipmaps && tex._generatedMipmaps[0] && tex._generatedMipmaps[0].nativeUrl);
            }
            if (!url) {
                console.warn('saveSpriteFrameToFile: 无法获取 texture URL');
                return;
            }
            const link = document.createElement('a');
            link.href = url;
            link.download = 'image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.warn('saveSpriteFrameToFile error', e);
        }
    }
}