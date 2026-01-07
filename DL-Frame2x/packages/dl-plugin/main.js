exports.unload = exports.load = exports.methods = void 0;
module.exports = {
  messages: {
    'update_spr'(event) {
      Editor.log('开始更新脚本提示');
      const spr = require('./updateSpr');
      try {
        spr.updateSpr();
        Editor.log('---------------------------更新脚本提示完成---------------------------');
      } catch (error) {
        Editor.log('---------------------------更新脚本提示失败---------------------------');
      }
    },
    'update_pre'(event) {
      const pre = require("./updatePre");
      Editor.log('开始更新节点提示');
      try {
        pre.updatePre()
        Editor.log('---------------------------更新节点提示完成---------------------------');
      } catch (error) {
        Editor.log('---------------------------更新节点提示失败---------------------------');
      }
    },
    'update_conf'(event) {
      const conf = require("./updateConf");
      Editor.log('开始更新配置提示');
      try {
        conf.updateConf()
        Editor.log('---------------------------更新配置提示完成---------------------------');
      } catch (error) {
        Editor.log('---------------------------更新配置提示失败---------------------------');
      }
    },
    'update_mp3'(event) {
      const mp3 = require("./updateMp3");
      Editor.log('开始更新音频提示');
      try {
        mp3.updateMp3()
        Editor.log('---------------------------更新音频提示完成---------------------------');
      } catch (error) {
        Editor.log('---------------------------更新音频提示失败---------------------------');
      }
    }
  },
};