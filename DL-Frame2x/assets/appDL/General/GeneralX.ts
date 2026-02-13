/*******************************************************************************
 * 描述:    框架全局方法管理器
*******************************************************************************/
class GeneralX {

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