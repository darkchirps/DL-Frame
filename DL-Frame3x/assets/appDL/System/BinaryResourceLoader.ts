/*******************************************************************************
 * 描述:    二进制解析
*******************************************************************************/
import { Asset, resources, BufferAsset, error, Texture2D, SpriteFrame } from 'cc';

export enum ResourceType {
    CONFIG = 'config',
    IMAGE = 'image',
}

export class BinaryResourceLoader {
    /**
     * 智能解析二进制资源
     * @param buffer 二进制数据
     * @param resourceType 资源类型
     * @returns 解析后的资源
     */
    static parseBinaryResource(buffer: ArrayBuffer, resourceType: ResourceType) {
        switch (resourceType) {
            case ResourceType.CONFIG:
                return this.parseConfig(buffer);
            case ResourceType.IMAGE:
                return this.parseImage(buffer, resourceType);
            default:
                return buffer; // 返回原始二进制数据
        }
    }

    /**
     * 解析配置数据
     */
    private static parseConfig(buffer: ArrayBuffer): any {
        try {
            const jsonString = new TextDecoder('utf-8').decode(new Uint8Array(buffer));
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('解析配置数据失败:', error);
            return null;
        }
    }

    /**
     * 解析图片数据
     */
    private static async parseImage(buffer: ArrayBuffer, mimeType: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const blob = new Blob([buffer], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const img = new Image();

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };

            img.onerror = (error) => {
                URL.revokeObjectURL(url);
                reject(new Error('图片加载失败'));
            };

            img.src = url;
        });
    }
}

/** 配置管理器 */
export default class Bin extends BinaryResourceLoader { }
declare global { var Bin: typeof BinaryResourceLoader }
globalThis["Bin"] = Bin;