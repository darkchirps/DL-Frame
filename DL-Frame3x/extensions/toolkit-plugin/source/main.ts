// @ts-ignore
const { dialog } = require('electron');
const fs = require("fs");
const path = require('path');
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     */
    open_jsonChange() {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then((result?: any) => {
            if (!result.canceled && result.filePaths.length > 0) {
                const pathTo = result.filePaths[0];
                const toJson = require("./xlsxToJson");
                console.log('开始表格转json');
                // 设置输出目录
                const outputDir = path.join(Editor.Project.path, 'assets/resources/json');
                // 执行转换
                toJson.xlsxToJson(pathTo, outputDir);
                //转换成功，通知引擎刷新资源
                const floats = fs.readdirSync(outputDir);
                floats.forEach((float: string) => {
                    if (float.endsWith('.meta')) {
                        const fullPath = path.join(`${outputDir}`, `${float}`);
                        const fileContent = fs.readFileSync(fullPath, 'utf8');
                        // @ts-ignore
                        Editor.Message.request('asset-db', 'refresh-asset', fileContent["uuid"]);
                    }
                });
                console.log('---------------------------表格转json完成---------------------------');
            }
        }).catch((err?: any) => {
            console.log('表格转json选择文件夹失败');
        });
    },
    open_binChange() {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then((result?: any) => {
            if (!result.canceled && result.filePaths.length > 0) {
                const pathTo = result.filePaths[0];
                const toBin = require("./xlsxToBin");
                console.log('开始表格转bin');
                // 设置输出目录
                const outputDir = path.join(Editor.Project.path, 'assets/resources/bin');
                // 执行转换
                toBin.xlsxToBinary(pathTo, outputDir);
                //转换成功，通知引擎刷新资源
                const floats = fs.readdirSync(outputDir);
                floats.forEach((float: string) => {
                    if (float.endsWith('.meta')) {
                        const fullPath = path.join(outputDir, `${float}`);
                        const fileContent = fs.readFileSync(fullPath, 'utf8');
                        // @ts-ignore
                        Editor.Message.request('asset-db', 'refresh-asset', fileContent["uuid"]);
                    }
                });
                console.log('---------------------------表格转bin完成---------------------------');
            }
        }).catch((err?: any) => {
            console.log('表格转bin选择文件夹失败');
        });
    },
    open_pic_txtChange() {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then((result?: any) => {
            if (!result.canceled && result.filePaths.length > 0) {
                const pathTo = result.filePaths[0];
                const convert = require("./picToTxt");
                console.log('开始图片转txt');
                convert.changeTxtFunc(pathTo)
                console.log('---------------------------图片转txt完成---------------------------');
            }
        }).catch((err?: any) => {
            console.log('图片转txt选择文件夹失败');
        });
    },
    open_pic_binChange() {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then((result?: any) => {
            if (!result.canceled && result.filePaths.length > 0) {
                const pathTo = result.filePaths[0];
                const convert = require("./picToBin");
                console.log('开始图片转bin');
                convert.imagesToBinarySimple(pathTo)
                console.log('---------------------------图片转bin完成---------------------------');
            }
        }).catch((err?: any) => {
            console.log('图片转bin选择文件夹失败');
        });
    },
    open_videoFrame() {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then((result?: any) => {
            if (!result.canceled && result.filePaths.length > 0) {
                const pathTo = result.filePaths[0];
                const video = require("./videoFrame");
                console.log('开始提取视频首帧');
                video.videoToFrame(pathTo)
            }
        }).catch((err?: any) => {
            console.log('视频首帧选择文件夹失败');
        });
    }
};

/**
 * @en Method Triggered on Extension Startup
 * @zh 扩展启动时触发的方法
 */
export function load() { }

/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展时触发的方法
 */
export function unload() { }
