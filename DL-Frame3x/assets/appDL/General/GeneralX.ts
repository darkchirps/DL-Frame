/*******************************************************************************
 * 描述:    框架全局方法
*******************************************************************************/
import { Graphics, sys, SpriteFrame, v3, Tween, tween, Node, Vec3, Texture2D, ImageAsset, Sprite, js } from "cc";

class GeneralX {
    /**保存图片数据到本地 */
    // public static saveImageToLocal(picName: string): Promise<string> {
    //     let imgUrl = G.imgUrl + picName + ".txt";
    //     console.log("图片地址", imgUrl);
    //     // 兼容原生和浏览器环境。使用 fetch（若可用），在原生环境 fallback 为 XMLHttpRequest
    //     const isNative = !!sys.isNative;
    //     const timeout = 5000;
    //     if (isNative) {
    //         return new Promise((resolve, reject) => {
    //             const xhr = new XMLHttpRequest();
    //             xhr.responseType = 'text';
    //             xhr.open('GET', imgUrl, true);
    //             let timer: any = setTimeout(() => {
    //                 xhr.abort();
    //                 reject(new Error('请求超时'));
    //             }, timeout);
    //             xhr.onreadystatechange = () => {
    //                 if (xhr.readyState !== 4) return;
    //                 clearTimeout(timer);
    //                 if (xhr.status === 200) {
    //                     try {
    //                         sys.localStorage.setItem(picName, xhr.response);
    //                     } catch (e) { /* ignore storage error */ }
    //                     resolve(xhr.response);
    //                 } else {
    //                     reject(new Error(`HTTP错误: ${xhr.status}`));
    //                 }
    //             };
    //             xhr.onerror = () => { clearTimeout(timer); reject(new Error('网络请求失败')); };
    //             xhr.send();
    //         });
    //     } else {
    //         // 浏览器环境：使用 fetch
    //         return new Promise(async (resolve, reject) => {
    //             try {
    //                 const controller = ('AbortController' in window) ? new AbortController() : null;
    //                 if (controller) setTimeout(() => controller.abort(), timeout);
    //                 const resp = await fetch(imgUrl, { signal: controller ? controller.signal : undefined });
    //                 if (!resp.ok) return reject(new Error(`HTTP错误: ${resp.status}`));
    //                 const txt = await resp.text();
    //                 try { window.localStorage.setItem(picName, txt); } catch (e) { /* ignore */ }
    //                 resolve(txt);
    //             } catch (e) {
    //                 reject(e);
    //             }
    //         });
    //     }
    // }
    /**判断一点是否在矩形框内*/
    public static isPointInBox(point: Vec3, boxNode: Node): boolean {
        const hw = boxNode.uiTransform.width  / 2;
        const hh = boxNode.uiTransform.height / 2;
        // Cocos Y 轴向上：minY = center.y - hh，maxY = center.y + hh
        return point.x >= boxNode.x - hw && point.x <= boxNode.x + hw
            && point.y >= boxNode.y - hh && point.y <= boxNode.y + hh;
    }
    /** 判断两个矩形（由 Node + UITransform 定义的中心坐标和宽高）是否相交 */
    public static isBoxIntersect(boxA: Node, boxB: Node): boolean {
        if (!boxA || !boxB) return false;
        const aLeft = boxA.x - boxA.uiTransform.width / 2;
        const aRight = boxA.x + boxA.uiTransform.width / 2;
        const aTop = boxA.y - boxA.uiTransform.height / 2;
        const aBottom = boxA.y + boxA.uiTransform.height / 2;

        const bLeft = boxB.x - boxB.uiTransform.width / 2;
        const bRight = boxB.x + boxB.uiTransform.width / 2;
        const bTop = boxB.y - boxB.uiTransform.height / 2;
        const bBottom = boxB.y + boxB.uiTransform.height / 2;

        // 两个矩形不相交的情况：A 在 B 左侧、A 在 B 右侧、A 在 B 上方、A 在 B 下方
        const separated = aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom;
        return !separated;
    }
}
/** 全局公共方法管理器 */
export default class X extends GeneralX { }
declare global { var X: typeof GeneralX }
globalThis["X"] = X;