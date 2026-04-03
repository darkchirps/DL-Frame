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
    update_spr() {
        console.log('开始更新脚本提示');
        const spr = require('./updateSpr');
        try {
            spr.updateSpr();
            console.log('---------------------------更新脚本提示完成---------------------------');
        } catch (error) {
            console.log('---------------------------更新脚本提示失败---------------------------');
        }
    },
    update_pre() {
        console.log('开始更新节点提示');
        const pre = require('./updatePre');
        try {
            pre.updatePre();
            console.log('---------------------------更新节点提示完成---------------------------');
        } catch (error) {
            console.log('---------------------------更新节点提示失败---------------------------');
        }
    },
    update_conf() {
        console.log('开始更新配置提示');
        const conf = require('./updateConf');
        try {
            conf.updateConf();
            console.log('---------------------------更新配置提示完成---------------------------');
        } catch (error) {
            console.log('---------------------------更新配置提示失败---------------------------', error);
        }
    },
    update_mp3() {
        console.log('开始更新音频提示');
        const mp3 = require('./updateMp3');
        try {
            mp3.updateMp3();
            console.log('---------------------------更新音频提示完成---------------------------');
        } catch (error) {
            console.log('---------------------------更新音频提示失败---------------------------', error);
        }
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
