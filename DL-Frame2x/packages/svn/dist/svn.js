"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInstallSvn = checkInstallSvn;
exports.isSvnWorkingCopy = isSvnWorkingCopy;
exports.svnUpdate = svnUpdate;
exports.svnCommit = svnCommit;
exports.svnLog = svnLog;
exports.svnRevert = svnRevert;
exports.svnCleanup = svnCleanup;
exports.svnAdd = svnAdd;
const child_process_1 = require("child_process");
/**是否安装了svn */
function checkInstallSvn() {
    return new Promise(res => {
        (0, child_process_1.exec)('svn --version --quiet', (error, stdout, stderr) => {
            if (stdout) {
                res(true);
            }
            else {
                res(false);
            }
        });
    });
}
/**是否是svn工作副本 */
function isSvnWorkingCopy() {
    return new Promise(res => {
        (0, child_process_1.exec)('svn info ' + Editor.Project.path, (error, stdout, stderr) => {
            if (stdout) {
                res(true);
            }
            else {
                res(false);
            }
        });
    });
}
async function checkSvnEnvironment(succCall) {
    let cond1 = await checkInstallSvn();
    let cond2 = await isSvnWorkingCopy();
    if (!cond1) {
        return Editor.error('未安装svn或svn未添加环境变量');
    }
    if (!cond2) {
        return Editor.error('当前项目不是svn工作副本');
    }
    cond1 && cond2 && succCall();
}
function svnUpdate(path = '') {
    Editor.log('svn更新路径：', path);
    checkSvnEnvironment(() => {
        (0, child_process_1.exec)('TortoiseProc.exe /command:update /path:' + path);
    });
}
function svnCommit(path = '') {
    Editor.log('svn提交路径：', path);
    checkSvnEnvironment(() => {
        (0, child_process_1.exec)('TortoiseProc.exe /command:commit /path:' + path);
    });
}
function svnLog(path = '') {
    Editor.log('svn日志路径：', path);
    checkSvnEnvironment(() => {
        (0, child_process_1.exec)('TortoiseProc.exe /command:log /path:' + path);
    });
}
function svnRevert(path = '') {
    Editor.log('svn还原路径：', path);
    checkSvnEnvironment(() => {
        (0, child_process_1.exec)('TortoiseProc.exe /command:revert /path:' + path);
    });
}
function svnCleanup(path = '') {
    Editor.log('svn清理路径：', path);
    checkSvnEnvironment(() => {
        (0, child_process_1.exec)('TortoiseProc.exe /command:cleanup /path:' + path);
    });
}
function svnAdd(path = '') {
    Editor.log('svn清理路径：', path);
    checkSvnEnvironment(() => {
        (0, child_process_1.exec)('TortoiseProc.exe /command:add /path:' + path);
    });
}
