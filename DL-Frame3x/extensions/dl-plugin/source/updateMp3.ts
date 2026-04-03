const fs = require("fs");
const path = require("path");
const mp3Dirs: string[] = require("../config.json").mp3Name;

const AUDIO_EXTS = [".mp3", ".ogg", ".wav", ".m4a", ".aac"];

/**
 * 扫描音频目录，生成 type_mp3.d.ts
 * 让 G.mp3.xxx 有完整的代码提示
 */
export function updateMp3() {
    const audioNames: string[] = [];

    mp3Dirs.forEach((mp3Dir: string) => {
        const dirPath = path.join(Editor.Project.path, mp3Dir);
        if (!fs.existsSync(dirPath)) {
            console.warn(`音频目录不存在，已跳过: ${dirPath}`);
            return;
        }

        collectAudioNames(dirPath, audioNames);
    });

    if (audioNames.length === 0) {
        console.warn("未找到任何音频文件，type_mp3.d.ts 未生成");
        return;
    }

    // 去重
    const unique = [...new Set(audioNames)];

    const lines: string[] = [];
    lines.push("// 自动生成的音频类型定义，请勿手动修改\n");
    lines.push("interface AudioItem {");
    lines.push("    /** 播放背景音乐（循环） */");
    lines.push("    playMusic(loop?: boolean): void;");
    lines.push("    /** 播放音效（单次） */");
    lines.push("    playEffect(loop?: boolean): void;");
    lines.push("}\n");
    lines.push("interface mp3Type {");
    unique.forEach(name => {
        lines.push(`    /** 音频: ${name} */`);
        lines.push(`    ${name}?: AudioItem;`);
    });
    lines.push("}");

    const outPath = path.join(Editor.Project.path, "type_mp3.d.ts");
    fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
    console.log(`已生成: type_mp3.d.ts，共 ${unique.length} 个音频`);
}

/** 递归收集目录下所有音频文件名（不含扩展名） */
function collectAudioNames(dirPath: string, result: string[]) {
    const items: string[] = fs.readdirSync(dirPath);
    items.forEach((item: string) => {
        if (item.endsWith(".meta")) return;
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            collectAudioNames(fullPath, result);
        } else {
            const ext = path.extname(item).toLowerCase();
            if (AUDIO_EXTS.includes(ext)) {
                result.push(path.basename(item, ext));
            }
        }
    });
}
