const path = require('path');
const { dialog } = require('electron');

exports.unload = exports.load = exports.methods = void 0;

module.exports = {
  messages: {
    'open_jsonChange'(event) {
      dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then((result) => {
        if (!result.canceled && result.filePaths.length > 0) {
          const pathTo = result.filePaths[0];
          const toJson = require("./xlsxToJson");
          console.log('开始表格转json');
          // 设置输出目录
          const outputDir = path.join(Editor.Project.path, 'assets/resources/json');
          // 执行转换
          toJson.xlsxToJson(pathTo, outputDir);
          //转换成功，通知引擎刷新资源
          Editor.assetdb.refresh("db://assets/resources/json");
          console.log('---------------------------表格转json完成---------------------------');
        }
      }).catch((err) => {
        console.log('表格转json选择文件夹失败');
      });
    },
    'open_binChange'(event) {
      dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then((result) => {
        if (!result.canceled && result.filePaths.length > 0) {
          const pathTo = result.filePaths[0];
          const toBin = require("./xlsxToBin");
          console.log('开始表格转bin');
          // 设置输出目录
          const outputDir = path.join(Editor.Project.path, 'assets/resources/bin');
          // 执行转换
          toBin.xlsxToBinary(pathTo, outputDir);
          //转换成功，通知引擎刷新资源
          Editor.assetdb.refresh("db://assets/resources/bin");
          console.log('---------------------------表格转bin完成---------------------------');
        }
      }).catch((err) => {
        console.log('表格转bin选择文件夹失败');
      });
    },
    'picToTxt'(event, data) {
      dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
          const pathTo = result.filePaths[0];
          const convert = require("./picToTxt");
          Editor.log('开始图片转换bin');
          convert.picToTxtFunc(pathTo)
        }
      }).catch(err => {
        Editor.log('转换失败');
      });
    },
    'picToBin'(event, data) {
      dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
          const pathTo = result.filePaths[0];
          const convert = require("./picToBin");
          Editor.log('开始图片转换bin');
          convert.imagesToBinarySimple(pathTo)
        }
      }).catch(err => {
        Editor.log('转换失败');
      });
    }
  },
};