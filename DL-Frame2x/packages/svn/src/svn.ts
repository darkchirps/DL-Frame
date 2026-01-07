import { exec } from 'child_process';

/**是否安装了svn */
export function checkInstallSvn() {
	return new Promise<boolean>(res => {
		exec('svn --version --quiet', (error, stdout, stderr) => {
			if (stdout) {
				res(true);
			} else {
				res(false);
			}
		});
	});
}

/**是否是svn工作副本 */
export function isSvnWorkingCopy() {
	return new Promise<boolean>(res => {
		exec('svn info ' + Editor.Project.path, (error, stdout, stderr) => {
			if (stdout) {
				res(true);
			} else {
				res(false);
			}
		});
	});
}

async function checkSvnEnvironment(succCall: () => void) {
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

export function svnUpdate(path = '') {
	Editor.log('svn更新路径：', path);
	checkSvnEnvironment(() => {
		exec('TortoiseProc.exe /command:update /path:' + path);
	});
}

export function svnCommit(path = '') {
	Editor.log('svn提交路径：', path);
	checkSvnEnvironment(() => {
		exec('TortoiseProc.exe /command:commit /path:' + path);
	});
}

export function svnLog(path = '') {
	Editor.log('svn日志路径：', path);
	checkSvnEnvironment(() => {
		exec('TortoiseProc.exe /command:log /path:' + path);
	});
}

export function svnRevert(path = '') {
	Editor.log('svn还原路径：', path);
	checkSvnEnvironment(() => {
		exec('TortoiseProc.exe /command:revert /path:' + path);
	});
}

export function svnCleanup(path = '') {
	Editor.log('svn清理路径：', path);
	checkSvnEnvironment(() => {
		exec('TortoiseProc.exe /command:cleanup /path:' + path);
	});
}

export function svnAdd(path = '') {
   Editor.log('svn清理路径：', path);
   checkSvnEnvironment(() => {
	   exec('TortoiseProc.exe /command:add /path:' + path);
   });
}