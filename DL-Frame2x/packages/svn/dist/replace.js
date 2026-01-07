"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loopDirFun = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
function loopDirFun(dirPath) {
    let loopDir = (dir, name = "") => {
        let files = (0, fs_1.readdirSync)(dir);
        files.forEach((element) => {
            if (element.indexOf(".meta") > -1)
                return;
            let newDir = (0, path_1.join)(dir, element);
            let result = (0, fs_1.statSync)(newDir).isDirectory();
            if (result) {
                loopDir(newDir, element);
            }
            else {
                if (element.indexOf(".prefab") > -1) {
                    readFileContent(newDir);
                    Editor.log(element + " 字体替换成功");
                }
            }
        });
    };
    loopDir(dirPath);
}
exports.loopDirFun = loopDirFun;
function readFileContent(fileDir) {
    let content = (0, fs_1.readFileSync)(fileDir, "utf8");
    let arrayContent = JSON.parse(content);
    arrayContent.map((item) => {
        return changeFontPrefab(item);
    });
    (0, fs_1.writeFileSync)(fileDir, JSON.stringify(arrayContent, null, 2));
}
function changeFontPrefab(item) {
    if ((item.__type__ == "cc.Label" || item.__type__ == "31f3byG1tFGdJCvhfzkPY4A") && (item._N$file == null || item._isSystemFontUsed)) {
        item._isSystemFontUsed = false;
        item._N$file = {
            __uuid__: "57902f08-6087-4bfc-9585-e121793781cd",
        };
    }
    else if ((item.__type__ == "cc.RichText" || item.__type__ == "90d71amSwhD5bzZcP7hfwgH") && item._N$font == null && item._isSystemFontUsed) {
        item._isSystemFontUsed = false;
        item._N$font = {
            __uuid__: "57902f08-6087-4bfc-9585-e121793781cd",
        };
    }
    return item;
}
