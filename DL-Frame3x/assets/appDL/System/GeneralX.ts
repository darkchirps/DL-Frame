/*******************************************************************************
 * 描述:    框架全局方法
*******************************************************************************/
import { Graphics, sys, SpriteFrame, v3, Tween, tween, Node, Vec3, Texture2D, ImageAsset, Sprite, js } from "cc";
import { LanguageType } from "./GlobalEventEnum";

class GeneralX {

    /** 根据 key 获取文本
     * @param key 文本表 id
     * @param subst 替换的字符数组
     */
    public static getI18n(key: number, subst?: any[]): string {
        let txt = '';
        const cfgSource: any = G.config.language;
        // 支持 Map-like get(id) 或直接索引的对象
        let conf: any = cfgSource.get(key);
        if (!conf) {
            console.warn('language id not found:', key);
            return txt;
        }
        switch (C.languageId) {
            case LanguageType.Chinese: txt = conf.zh; break;
            case LanguageType.English: txt = conf.en; break;
        }
        if (!txt) {
            console.warn('language not found:', '');
            return '';
        }
        txt = txt.replace(/\\n/g, '\n');
        return js.formatStr(txt, ...subst);
    }
    /**
     * 将一个>0的秒数转换为"y-m-d h:mm:s 格式
     * @param time 秒
     * @param fmtStr 时间格式
     */
    public static timetostr(time: number, fmtStr = "y-m-d h:mm:s") {
        let h: any, mm: any, s: any, y: any, m: any, d: any;
        // 接受秒或毫秒时间戳：如果值看起来像秒（< 1e12），按秒处理
        const ts = time && time < 1e12 ? time * 1000 : time;
        var t = new Date(ts);
        y = t.getFullYear();
        m = t.getMonth() + 1;
        d = t.getDate();
        h = t.getHours();
        mm = t.getMinutes();
        s = t.getSeconds();
        if (mm < 10) mm = "0" + mm;
        if (s < 10) s = "0" + s;

        fmtStr = fmtStr.replace(/y/gi, y);
        fmtStr = fmtStr.replace(/mm/gi, mm);
        fmtStr = fmtStr.replace(/m/gi, m);
        fmtStr = fmtStr.replace(/d/gi, d);
        fmtStr = fmtStr.replace(/h/gi, h);
        fmtStr = fmtStr.replace(/s/gi, s);
        return fmtStr;
    }
    /**时间戳是否跨天
     * @param t1 时间戳
     * @param t2 时间戳
     */
    public static acrossDay(t1: number, t2: number) {
        // 支持秒或毫秒输入
        const n1 = t1 && t1 < 1e12 ? t1 * 1000 : t1;
        const n2 = t2 && t2 < 1e12 ? t2 * 1000 : t2;
        let d1 = new Date(n1);
        let d2 = new Date(n2);
        return d1.getFullYear() !== d2.getFullYear() ||
            d1.getMonth() !== d2.getMonth() ||
            d1.getDate() !== d2.getDate();
    }
    /**下载文件从浏览器
     * @param info 下载信息
     * @param name 文件名
     * @param type 文件类型 如：txt,json,zip等
    */
    public static downloadFile(info: any, name: string, type: string) {
        var jsonString = this.resolveJsonObjectCRLF(info);
        this.saveForBrowser(jsonString, name + '.' + type);
    }
    /**解析*/
    public static resolveJsonObjectCRLF(jsonString) {
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
    public static saveForBrowser(textToWrite, fileNameToSaveAs) {
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
            // 清理
            setTimeout(() => {
                document.body.removeChild(link);
                (window.URL || (window as any).webkitURL).revokeObjectURL(url);
            }, 100);
        } catch (e) {
            console.warn('saveForBrowser error', e);
        }
    }
    /**数值格式化*/
    public static formatValue(n: number) {
        //策划要求保留一位小数，直接向下取(到千万开始用M)
        let str = "";
        if (n < 100000) {
            str = n.toString();
        } else if (n < 10000000) {
            str = (Math.floor(n / 100) / 10).toString() + "K";
        } else if (n < 1000000000) {
            str = (Math.floor(n / 100000) / 10).toString() + "M";
        } else {
            str = (Math.floor(n / 100000000) / 10).toString() + "B";
        }
        return str;
    }
    /**浏览器保存图片到本地*/
    public static saveSpriteFrameToFile(sprite: Sprite) {
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
    /**画线 循环流动
     * @param graphics 画布
     * @param startPos 开始坐标
     * @param endPos 结束坐标
     * @param dashLength 虚线长度
     * @param gapLength 虚线间隔
     * @param offset 起点偏移量
    */
    public static drawDashedLine(graphics: Graphics, startPos: Vec3, endPos: Vec3, dashLength: number, gapLength: number, offset: number) {
        if (!graphics) return;
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const totalDashGapLength = dashLength + gapLength;
        let currentX = startPos.x + (dx / length) * offset;
        let currentY = startPos.y + (dy / length) * offset;
        for (let dist = offset; dist < length; dist += totalDashGapLength) {
            graphics.moveTo(currentX, currentY);
            // 计算虚线结束点
            const nextX = currentX + (dx / length) * dashLength;
            const nextY = currentY + (dy / length) * dashLength;
            // 如果虚线超出终点，则截断
            if (dist + dashLength > length) {
                graphics.lineTo(endPos.x, endPos.y);
                break;
            }
            graphics.lineTo(nextX, nextY);
            // 更新起点为间隔结束
            currentX = nextX + (dx / length) * gapLength;
            currentY = nextY + (dy / length) * gapLength;
        }
    }
    /**打乱数组，使其所有不在原先位置的元素随机排列*/
    public static derangement<T>(arr: T[]): T[] {
        const n = arr.length;
        if (n <= 1) return [...arr];

        // 如果有重复元素导致无法满足严格的错位要求，退化为安全的旋转
        const maxAttempts = 100;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const shuffled = GeneralX.shuffleArray([...arr]);
            let ok = true;
            for (let i = 0; i < n; i++) {
                if (shuffled[i] === arr[i]) { ok = false; break; }
            }
            if (ok) return shuffled;
        }
        // 退化：循环右移一位（对任意 n>1 都能保证索引错位，注意如果数组内容全部相同则仍会相等）
        return [...arr.slice(1), arr[0]];
    }
    /**base64转spriteFrame*/
    public static Base64SpriteFrame(base64Data: string, sprite?: Sprite) {
        return new Promise<SpriteFrame>((resolve, reject) => {
            try {
                const iconData = base64Data.startsWith('data:') ? base64Data : `data:image/jpg;base64,${base64Data}`;
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
    /**找到数组相同的一组返回*/
    public static findDuplicateIndices(arr: number[]): [number, number] | [] {
        // 创建一个映射来存储每个元素的索引
        const indexMap: Map<number, number> = new Map();
        for (let i = 0; i < arr.length; i++) {
            const num = arr[i];
            if (indexMap.has(num)) {
                // 如果元素已在映射中，返回之前和现在的索引
                return [indexMap.get(num)!, i];
            } else {
                // 否则将元素及其索引添加到映射中
                indexMap.set(num, i);
            }
        }
        // 如果没有找到重复的元素，返回 undefined
        return [];
    }
    /**返回大于等于i1 小于等于i2的随机整数*/
    public static randomInt(i1: number, i2: number): number {
        if (i1 == i2) {
            return i1;
        }
        var range = Math.abs(i1 - i2) + 1;
        return Math.floor(Math.random() * range + Math.min(i1, i2));
    }
    /**随机num个数,指定范围和个数 min取不到*/
    public static randomRange(min: number, max: number, num: number) {
        if (num > max - min) {
            return [];
        }
        var range = max - min,
            minV = min + 1, //实际上可以取的最小值
            arr = [];

        function GenerateANum(i) {
            for (i; i < num; i++) {
                var rand = Math.random(); //  rand >=0  && rand < 1
                let tmp = Math.floor(rand * range + minV);

                if (arr.indexOf(tmp) == -1) {
                    arr.push(tmp);
                } else {
                    GenerateANum(i);
                    break;
                }
            }
        }
        GenerateANum(0);
        return arr;
    }
    /**返回数组相对对数*/
    public static countElementPairs(arr: number[]): number {
        // 创建一个字典来存储每个元素的出现次数
        const frequencyMap: { [key: number]: number } = {};

        // 遍历数组并计算频率
        for (const num of arr) {
            if (frequencyMap[num] !== undefined) {
                frequencyMap[num]++;
            } else {
                frequencyMap[num] = 1;
            }
        }
        // 计算所有元素的对数
        let totalPairs = 0;
        for (const count of Object.values(frequencyMap)) {
            if (count > 1) {
                totalPairs += Math.floor(count / 2);
            }
        }
        return totalPairs;
    }
    /**返回只单个的数组元素位*/
    public static filterSpecific(arr: number[]): number[] {
        const countMap: { [key: number]: number } = {};
        const output: number[] = [];
        // 统计每个数字的出现次数
        for (const num of arr) {
            countMap[num] = (countMap[num] || 0) + 1;
        }
        // 遍历数组
        for (let i = 0; i < arr.length; i++) {
            const num = arr[i];

            // 如果出现次数为单数，则输出索引
            if (countMap[num] % 2 !== 0) {
                output.push(i);
            }
        }
        return output;
    }
    /** 返回数组中每个元素的对数以及对的索引位置 */
    public static countElementPairsTo(arr: number[]): { totalPairs: number, pairs: [number, number][] } {
        // 创建一个字典来存储每个元素的出现次数和索引列表
        const frequencyMap: { [key: number]: { count: number, indices: number[] } } = {};

        // 遍历数组并计算频率和记录索引
        for (let i = 0; i < arr.length; i++) {
            const num = arr[i];
            if (frequencyMap[num]) {
                frequencyMap[num].count++;
                frequencyMap[num].indices.push(i);
            } else {
                frequencyMap[num] = { count: 1, indices: [i] };
            }
        }

        // 计算所有元素的对数和对的索引位置
        let totalPairs = 0;
        const pairs: [number, number][] = [];
        for (const key in frequencyMap) {
            const { count, indices } = frequencyMap[key];
            if (count > 1) {
                // 计算对数
                totalPairs += Math.floor(count / 2);

                // 添加对的索引位置
                for (let i = 0; i < indices.length; i += 2) {
                    if (indices[i + 1] !== undefined) {
                        pairs.push([indices[i], indices[i + 1]]);
                    }
                }
            }
        }
        return { totalPairs, pairs };
    }
    /**遍历坐标数组 取出相同的*/
    public static findDuplicateCoordinates(coords: Array<Vec3>) {
        // 创建一个 Map 来跟踪每个坐标出现的次数
        const coordCount = new Map();
        const duplicates = [];

        // 遍历坐标数组
        coords.forEach(coord => {
            // 将坐标转换为字符串，以便作为 Map 的键
            const key = `${coord.x},${coord.y}`;
            // 更新坐标出现的次数
            if (coordCount.has(key)) {
                coordCount.set(key, coordCount.get(key) + 1);
            } else {
                coordCount.set(key, 1);
            }
        });

        // 遍历坐标出现次数的 Map，提取出现超过一次的坐标
        coordCount.forEach((count, key) => {
            if (count > 1) {
                // 将键转换回坐标对象
                const [x, y] = key.split(',').map(Number);
                duplicates.push(v3(x, y));
            }
        });
        return duplicates;
    }
    /**拆分数组*/
    public static splitArrayByLengths<T>(array: T[], lengths: number[]): T[][] {
        const result: T[][] = [];
        let index = 0;

        for (const length of lengths) {
            // 如果当前索引超出了数组的长度，则停止处理
            if (index >= array.length) {
                break;
            }

            // 从当前索引开始，取长度为 length 的子数组
            const chunk = array.slice(index, index + length);
            result.push(chunk);
            index += length;
        }
        return result;
    }
    /**随机打乱数组*/
    public static shuffleArray(array) {
        // 遍历数组，从最后一个元素开始，到第二个元素
        for (let i = array.length - 1; i > 0; i--) {
            // 生成一个从 0 到 i 的随机整数
            const j = Math.floor(Math.random() * (i + 1));

            // 交换位置
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    /**
     * 贝塞尔tween动画
     * @param target 对象
     * @param startPos 开始坐标
     * @param time 动画时间
     * @param controlPos 控制点
     * @param endPos 结束坐标
     * @returns
     */
    public static bezierTween(target: any, time: number, startPos: Vec3, controlPos: Vec3, endPos: Vec3, sc?: number): Tween<Node> {
        let quadraticCurve = (t: number, p1: Vec3, cp: Vec3, p2: Vec3, out: Vec3) => {
            out.x = (1 - t) * (1 - t) * p1.x + 2 * t * (1 - t) * cp.x + t * t * p2.x;
            out.y = (1 - t) * (1 - t) * p1.y + 2 * t * (1 - t) * cp.y + t * t * p2.y;
            out.z = (1 - t) * (1 - t) * p1.z + 2 * t * (1 - t) * cp.z + t * t * p2.z;
        };
        let tempVec3 = v3();
        let curTween = tween(target).to(
            time,
            { position: endPos, scale: sc ? sc : target.scale },
            {
                onUpdate: (tar, ratio) => {
                    quadraticCurve(ratio, startPos, controlPos, endPos, tempVec3);
                    target.setPosition(tempVec3);
                },
            },
        );
        return curTween;
    }
    /**判断一点是否在矩形框内*/
    public static isPointInBox(point: Vec3, boxNode: Node): boolean {
        let boxLeft = boxNode.x - boxNode.uiTransform.width / 2;
        let boxRight = boxNode.x + boxNode.uiTransform.width / 2;
        let boxTop = boxNode.y - boxNode.uiTransform.height / 2;
        let boxBottom = boxNode.y + boxNode.uiTransform.height / 2;
        return point.x >= boxLeft && point.x <= boxRight && point.y <= boxBottom && point.y >= boxTop;
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