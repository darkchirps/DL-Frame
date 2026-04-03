const fs = require("fs");
const path = require("path");
const confDirs: string[] = require("../config.json").confName;

/**
 * 扫描配置表目录，生成 type_conf.d.ts
 * 支持 .json 和 .bin 两种格式（bin 本质是 UTF-8 JSON Buffer）
 */
export function updateConf() {
    const typeInfos: { name: string; sample: any }[] = [];

    confDirs.forEach((confDir: string) => {
        const dirPath = path.join(Editor.Project.path, confDir);
        if (!fs.existsSync(dirPath)) {
            console.warn(`配置目录不存在，已跳过: ${dirPath}`);
            return;
        }

        const files: string[] = fs.readdirSync(dirPath);
        files.forEach((file: string) => {
            if (file.endsWith(".meta")) return;

            const ext = path.extname(file).toLowerCase();
            if (ext !== ".json" && ext !== ".bin") return;

            const filePath = path.join(dirPath, file);
            const name = path.basename(file, ext);

            try {
                let raw: string;
                if (ext === ".bin") {
                    // bin 文件是 UTF-8 JSON Buffer
                    const buf = fs.readFileSync(filePath);
                    raw = new TextDecoder("utf-8").decode(buf);
                } else {
                    raw = fs.readFileSync(filePath, "utf-8");
                }
                const data = JSON.parse(raw);
                typeInfos.push({ name, sample: data });
                console.log(`解析配置成功: ${file}`);
            } catch (e) {
                console.error(`解析配置失败: ${file}`, e);
            }
        });
    });

    if (typeInfos.length === 0) {
        console.warn("未找到任何配置文件，type_conf.d.ts 未生成");
        return;
    }

    const lines: string[] = [];
    lines.push("// 自动生成的配置类型定义，请勿手动修改\n");
    lines.push("/** 通用配置查询接口 */");
    lines.push("interface ConfigFunc<T> {");
    lines.push("    get(value?: any, key?: string): T | null;");
    lines.push("    getAll(): T[];");
    lines.push("}\n");

    lines.push("interface configType {");
    typeInfos.forEach(({ name }) => {
        const key = name.charAt(0).toLowerCase() + name.slice(1);
        lines.push(`    ${key}?: ConfigFunc<${name}Config>;`);
    });
    lines.push("}\n");

    typeInfos.forEach(({ name, sample }) => {
        lines.push(`interface ${name}Config {`);
        const fields = inferFields(sample);
        fields.forEach(({ key, tsType }) => {
            lines.push(`    ${key}?: ${tsType};`);
        });
        lines.push("}\n");
    });

    const outPath = path.join(Editor.Project.path, "type_conf.d.ts");
    fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
    console.log("已生成: type_conf.d.ts");
}

/** 从数据样本推断字段类型 */
function inferFields(sample: any): { key: string; tsType: string }[] {
    // 数组型配置：取第一条推断字段
    const item = Array.isArray(sample) ? sample[0] : sample;
    if (!item || typeof item !== "object") return [];

    return Object.keys(item).map(key => ({
        key,
        tsType: inferType(item[key]),
    }));
}

function inferType(val: any): string {
    if (val === null || val === undefined) return "any";
    if (typeof val === "number") return "number";
    if (typeof val === "string") return "string";
    if (typeof val === "boolean") return "boolean";
    if (Array.isArray(val)) {
        if (val.length === 0) return "any[]";
        if (Array.isArray(val[0])) return "any[][]";
        return `${inferType(val[0])}[]`;
    }
    if (typeof val === "object") return "Record<string, any>";
    return "any";
}
