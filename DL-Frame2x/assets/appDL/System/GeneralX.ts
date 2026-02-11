import { LanguageType } from "./GlobalEventEnum";

/*******************************************************************************
 * 描述:    框架全局方法管理器
*******************************************************************************/
class GeneralX {

    /**获取多语言 根据id获取文本
    * @param id 文本表id
    * @param replace 替换的字符
    */
    public static getI18n(id: number, ...subst: any[]): string {
        let txt = '';
        if (!G.config.language) {
            console.warn('languageMap is null');
            return txt;
        }
        //@ts-ignore
        let conf: languageConfig = G.config.language.get(id);
        if (!conf) {
            console.error('lan no id: ' + id);
            return txt;
        }
        switch (C.languageId) {
            case LanguageType.Chinese: txt = conf.zh; break;
            case LanguageType.English: txt = conf.en; break;
            case LanguageType.Spain: txt = conf.es; break;
            case LanguageType.Portugal: txt = conf.pt; break;
            case LanguageType.German: txt = conf.de; break;
            case LanguageType.Indonesia: txt = conf.id; break;
            case LanguageType.Japan: txt = conf.jp; break;
            case LanguageType.Korean: txt = conf.kr; break;
            case LanguageType.French: txt = conf.fr; break;
            case LanguageType.Italy: txt = conf.it; break;
            case LanguageType.Russian: txt = conf.ru; break;
            case LanguageType.TraditionalChinese: txt = conf.cn_SP; break;
        }
        if (!txt) {
            return '';
        }
        txt = txt.replace(/\\n/g, '\n');
        return cc.js.formatStr(txt, ...subst);
    }
    /**
     * 将一个>0的秒数（时长）转换为指定格式的字符串
     * 支持的格式占位符：y(年)、m(月)、d(天)、h(小时)、mm(分钟)、s(秒)
     * 特殊处理：天数会自动拼接字母"d"，如7天展示为"7d"
     * @param time 秒数（时长，>0）
     * @param fmtStr 时间格式，默认 "y-m-d h:mm:s"
     */
    public static timetostr(time: number, fmtStr = "y-m-d h:mm:s") {
        // 校验输入，确保秒数大于0
        if (time <= 0) {
            return "0d 00:00:00"; // 输入不合法时返回默认空时长（保持格式统一）
        }

        let remaining = time;
        // 定义各时间单位的秒数换算
        const YEAR_SEC = 365 * 24 * 60 * 60;
        const MONTH_SEC = 30 * 24 * 60 * 60; // 简化为每月30天
        const DAY_SEC = 24 * 60 * 60;
        const HOUR_SEC = 60 * 60;
        const MIN_SEC = 60;

        // 计算各时间单位的数值
        const y = Math.floor(remaining / YEAR_SEC).toString();
        remaining = remaining % YEAR_SEC;

        const m = Math.floor(remaining / MONTH_SEC).toString();
        remaining = remaining % MONTH_SEC;

        // 天数计算后拼接字母"d"
        const dNum = Math.floor(remaining / DAY_SEC);
        const d = `${dNum}d`; // 核心调整：天数后加"d"
        remaining = remaining % DAY_SEC;

        const h = Math.floor(remaining / HOUR_SEC).toString();
        remaining = remaining % HOUR_SEC;

        const mmNum = Math.floor(remaining / MIN_SEC);
        const sNum = Math.floor(remaining % MIN_SEC);

        // 补零处理：强制转为字符串，确保类型统一为string
        const padMM: string = mmNum < 10 ? `0${mmNum}` : mmNum.toString();
        const padS: string = sNum < 10 ? `0${sNum}` : sNum.toString();

        // 替换格式字符串中的占位符（所有替换值都是string类型）
        let result = fmtStr
            .replace(/y/gi, y)
            .replace(/mm/gi, padMM) // 先替换分钟（mm）
            .replace(/m/gi, m)      // 再替换月份（m）
            .replace(/d/gi, d)      // 替换为带"d"的天数（如7d）
            .replace(/h/gi, h)
            .replace(/s/gi, padS);

        return result;
    }
    /**数值格式化*/
    public static formatValue(n: number) {
        //策划要求保留一位小数，直接向下取(到千万开始用M)
        let str = "";
        if (n < 10000) {
            str = n.toString();
        } else if (n < 10000000) {
            str = ((n / 1000).toFixed(1)).toString() + "K";
        } else if (n < 10000000000) {
            str = ((n / 1000000).toFixed(1)).toString() + "M";
        } else {
            str = ((n / 1000000000).toFixed(1)).toString() + "B";
        }
        return str;
    }
    /**时间戳是否跨天
     * @param t1 时间戳
     * @param t2 时间戳
     */
    public static acrossDay(t1: number, t2: number) {
        let d1 = new Date(t1);
        let d2 = new Date(t2);
        return d1.getFullYear() !== d2.getFullYear() ||
            d1.getMonth() !== d2.getMonth() ||
            d1.getDate() !== d2.getDate();
    }
    /**打乱数组，使其所有不在原先位置的元素随机排列*/
    public static derangement<T>(arr: T[]): T[] {
        const n = arr.length;
        const shuffled = [...arr];
        // Fisher-Yates变体，强制错位
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * i); // 仅选择比当前位置小的索引
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // 二次验证确保完全错位
        const hasOriginalPosition = shuffled.some((val, idx) => val === arr[idx]);
        return hasOriginalPosition ? X.derangement(arr) : shuffled;
    }
    /**base64转spriteFrame*/
    public static Base64SpriteFrame(base64Data: string) {
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
    public static BufferSpriteFrame(arrayBuffer: ArrayBuffer) {
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
    /**找到数组中指定key值相同的一组返回
     * @param arr arr数据
     * @param key arr中的key
    */
    public static findArrayGroup(arr: any[], key: string): [any, any] | [] {
        // 创建一个映射来存储每个元素的索引
        const indexMap: Map<string, any> = new Map();
        for (let i = 0; i < arr.length; i++) {
            let sign = arr[i][key];
            if (indexMap.get(sign)) {
                return [indexMap.get(sign), arr[i]]
            } else {
                indexMap.set(sign, arr[i]);
            }
        }
        // 如果没有找到重复的元素，返回 undefined
        return [];
    }
    /**找到map中指定key值相同的一组返回
     * @param map map数据
     * @param key map中的key
    */
    public static findMapGroup(map: Map<string, any>, key: string): [any, any] | [] {
        // 创建一个映射来存储每个元素的索引
        const indexMap: Map<string, any> = new Map();
        for (let k in map) {
            let sign = map[k][key];
            if (indexMap.get(sign)) {
                return [indexMap.get(sign), map[k]]
            } else {
                indexMap.set(sign, map[k]);
            }
        }
        // 如果没有找到重复的元素，返回 undefined
        return [];
    }
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
    /**呼吸效果*/
    public static breatheEffect(node: cc.Node) {
        return cc.tween(node)
            .by(0.5, { scale: -0.1 })
            .by(0.5, { scale: 0.1 })
            .union()
            .repeatForever()
            .start();
    }
    /**
     * 获取一定范围的随机数 不包含最大数
     * @param min 最小数
     * @param max 最大数
     */
    public static Random(max: number = 1, min: number = 0) {
        if (max == 1 && min == 0) {
            return Math.random();
        } else {
            return (min + Math.random() * (max - min));
        }
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
    public static findDuplicateCoordinates(coords: Array<cc.Vec3>) {
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
                duplicates.push(cc.v3(x, y));
            }
        });
        return duplicates;
    }
    /** 判断两个矩形（由 Node + UITransform 定义的中心坐标和宽高）是否相交 */
    public static isBoxIntersect(boxA: cc.Node, boxB: cc.Node): boolean {
        if (!boxA || !boxB) return false;
        const aLeft = boxA.x - boxA.width / 2;
        const aRight = boxA.x + boxA.width / 2;
        const aTop = boxA.y - boxA.height / 2;
        const aBottom = boxA.y + boxA.height / 2;

        const bLeft = boxB.x - boxB.width / 2;
        const bRight = boxB.x + boxB.width / 2;
        const bTop = boxB.y - boxB.height / 2;
        const bBottom = boxB.y + boxB.height / 2;
        // 两个矩形不相交的情况：A 在 B 左侧、A 在 B 右侧、A 在 B 上方、A 在 B 下方
        const separated = aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom;
        return !separated;
    }
    /**判断一点是否在矩形框内
     * @param touchPoint 坐标
     * @param box 比较的节点
     * @param uiPos true 该节点的世界坐标
    */
    public static isPointInBox(touchPoint: cc.Vec3 | cc.Vec2, box: cc.Node, uiPos?: boolean) {
        // 计算出矩形框左上角和右下角的坐标
        let nodePos = uiPos ? box.uiPosition : box.position;
        let boxLeft = nodePos.x - box.width / 2;
        let boxRight = nodePos.x + box.width / 2;
        let boxTop = nodePos.y - box.height / 2;
        let boxBottom = nodePos.y + box.height / 2;
        // 判断点是否在矩形框内
        return touchPoint.x >= boxLeft &&
            touchPoint.y >= boxTop &&
            touchPoint.x <= boxRight &&
            touchPoint.y <= boxBottom;
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
     * @param time 动画时间
     * @param startPos 开始坐标
     * @param controlPos 控制点
     * @param endPos 结束坐标
     * @param sc 缩放
     * @returns
     */
    public static bezierTween(target: any, time: number, startPos: cc.Vec3, controlPos: cc.Vec3, endPos: cc.Vec3, sc?: number): cc.Tween<cc.Node> {
        let quadraticCurve = (t: number, p1: cc.Vec3, cp: cc.Vec3, p2: cc.Vec3, out: cc.Vec3) => {
            out.x = (1 - t) * (1 - t) * p1.x + 2 * t * (1 - t) * cp.x + t * t * p2.x;
            out.y = (1 - t) * (1 - t) * p1.y + 2 * t * (1 - t) * cp.y + t * t * p2.y;
        };
        let tempVec3: cc.Vec3 = cc.v3();
        let curTween = cc.tween(target).to(
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
    /**
     * 返回大于等于i1 小于等于i2的随机整数
     * @param i1 
     * @param i2 
     */
    public static randomInt(i1: number, i2: number): number {
        if (i1 == i2) {
            return i1;
        }
        var range = Math.abs(i1 - i2) + 1;
        return Math.floor(Math.random() * range + Math.min(i1, i2));
    }
    /**对一个数组的元素对象排序，根据对象里的值，如果值相同，根据另一值
     * @注意 [{a:2,b:100},{a:2,b:120},{a:3,b:50}]
     * @list 数组数据
     * @type1 排序选择1
     * @type2 排序1相同时，排序根据排序2来
     * @back1 双方相同情况下默认返回数据从高到低
     * @back2 双方不相同情况默认返回数据从高到低
     */
    public static arrayListSort(list: any, type1: string, type2: string, back1: boolean = false, back2: boolean = false) {
        let sorted = list.sort(function (a, b) {
            if (parseInt(a[type1]) == parseInt(b[type1])) {
                if (back1) {
                    return parseInt(a[type2]) - parseInt(b[type2]);
                } else {
                    return parseInt(b[type2]) - parseInt(a[type2]);
                }
            } else {
                if (back2) {
                    return parseInt(a[type1]) - parseInt(b[type1]);
                } else {
                    return parseInt(b[type1]) - parseInt(a[type1]);
                }
            }
        });
        return sorted;
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
        if (-1 != jsonString.indexOf("\r\n")) { return; }
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
        if (cc.sys.isBrowser) {
            let textFileAsBlob = new Blob([textToWrite], { type: 'application/txt' });
            let downloadLink = document.createElement("a");
            downloadLink.download = fileNameToSaveAs;
            downloadLink.innerHTML = "Download File";
            if (window.webkitURL != null) {
                downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
            } else {
                downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                //@ts-ignore
                downloadLink.onclick = destroyClickedElement;
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
            }
            downloadLink.click();
        }
    }
}
export default class X extends GeneralX { }
declare global { var X: typeof GeneralX }
globalThis["X"] = X;