"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xlsxToBinary = xlsxToBinary;
// excel-to-binary-simplified.ts
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

function xlsxToBinary(excelPath, outputDir) {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const files = fs.readdirSync(excelPath);
    const generatedFiles = [];
    const typeInfos = [];

    // 类型转换函数
    const convertValue = (type, value) => {
        if (value === undefined || value === null || value === '') {
            // 根据类型返回默认值
            if (type === 'int[]' || type.startsWith('array1<'))
                return [];
            if (type === 'int[][]' || type.startsWith('array2<'))
                return [];
            if (type.startsWith('kv<'))
                return {};
            if (type === 'int')
                return 0;
            return '';
        }

        const typeLower = type.toLowerCase();
        const valueStr = value.toString().trim();

        // 处理 int[] 类型
        if (typeLower === 'int[]') {
            if (!valueStr) return [];
            const separator = valueStr.includes('|') ? '|' : ',';
            return valueStr.split(separator).map(v => {
                const trimmed = v.trim();
                const numVal = parseInt(trimmed, 10);
                return isNaN(numVal) ? 0 : numVal;
            });
        }

        // 处理 int[][] 类型
        if (typeLower === 'int[][]') {
            if (!valueStr) return [];
            // 判断分隔符
            if (valueStr.includes(';') || valueStr.includes('|')) {
                const sep = valueStr.includes(';') ? ';' : '|';
                return valueStr.split(sep).map(row =>
                    row.split(',').map(v => {
                        const trimmed = v.trim();
                        const numVal = parseInt(trimmed, 10);
                        return isNaN(numVal) ? 0 : numVal;
                    })
                );
            }
            if (valueStr.includes(',')) {
                return [valueStr.split(',').map(v => {
                    const trimmed = v.trim();
                    const numVal = parseInt(trimmed, 10);
                    return isNaN(numVal) ? 0 : numVal;
                })];
            }
            const numVal = parseInt(valueStr, 10);
            return [[isNaN(numVal) ? 0 : numVal]];
        }

        // 处理一维数组类型（泛型）
        if (typeLower.startsWith('array1<')) {
            const match = typeLower.match(/array1<([^>]+)>/);
            if (!match) return [];
            const inner = match[1];
            if (!valueStr) return [];

            // 判断分隔符：支持逗号和|作为分隔符
            const separator = valueStr.includes('|') ? '|' : ',';
            return valueStr.split(separator).map(v => convertValue(inner, v.trim()));
        }

        // 处理二维数组类型（泛型）
        if (typeLower.startsWith('array2<')) {
            const match = typeLower.match(/array2<([^>]+)>/);
            if (!match) return [];
            const inner = match[1];
            if (!valueStr) return [];
            if (valueStr.includes(';') || valueStr.includes('|')) {
                const sep = valueStr.includes(';') ? ';' : '|';
                return valueStr.split(sep).map(row =>
                    row.split(',').map(v => convertValue(inner, v.trim()))
                );
            }
            if (valueStr.includes(',')) {
                return [valueStr.split(',').map(v => convertValue(inner, v.trim()))];
            }
            return [[convertValue(inner, valueStr)]];
        }

        // 处理kv类型
        if (typeLower.startsWith('kv<')) {
            const match = typeLower.match(/kv<([^>]+)>/);
            if (!match) return {};
            const inner = match[1];
            const kvPairs = valueStr.split(',');
            const result = {};
            kvPairs.forEach(pair => {
                const [key, val] = pair.split(':').map(s => s.trim());
                if (key && val !== undefined) {
                    result[key] = convertValue(inner, val);
                }
            });
            return result;
        }

        // 基本类型处理
        switch (typeLower) {
            case 'int':
                return Number.isInteger(value) ? value : parseInt(valueStr, 10) || 0;
            case 'string':
                return valueStr;
            case 'array1': {
                if (!valueStr) return [];
                // 判断分隔符：支持逗号和|作为分隔符
                const separator = valueStr.includes('|') ? '|' : ',';
                return valueStr.split(separator).map(item => {
                    const trimmed = item.trim();
                    const numVal = parseFloat(trimmed);
                    return isNaN(numVal) ? trimmed : numVal;
                });
            }
            case 'array2': {
                if (!valueStr) return [];
                if (valueStr.includes(';') || valueStr.includes('|')) {
                    const sep = valueStr.includes(';') ? ';' : '|';
                    return valueStr.split(sep).map(row => row.split(',').map(v => {
                        const trimmed = v.trim();
                        const numVal = parseFloat(trimmed);
                        return isNaN(numVal) ? trimmed : numVal;
                    }));
                }
                if (valueStr.includes(',')) {
                    return [valueStr.split(',').map(v => {
                        const trimmed = v.trim();
                        const numVal = parseFloat(trimmed);
                        return isNaN(numVal) ? trimmed : numVal;
                    })];
                }
                return [[value]];
            }
            case 'kv': {
                const result = {};
                valueStr.split(',').forEach(pair => {
                    const [key, val] = pair.split(':').map(s => s.trim());
                    if (key && val !== undefined) {
                        const numVal = parseFloat(val);
                        result[key] = isNaN(numVal) ? val : numVal;
                    }
                });
                return result;
            }
            default:
                return value;
        }
    };

    // 转换为TypeScript类型
    const convertToTsType = (type) => {
        if (!type) return 'any';
        const typeLower = type.toLowerCase();

        if (typeLower === 'int') return 'number';
        if (typeLower === 'string') return 'string';
        if (typeLower === 'int[]') return 'number[]';
        if (typeLower === 'int[][]') return 'number[][]';
        if (typeLower.startsWith('array1')) return 'any[]';
        if (typeLower.startsWith('array2')) return 'any[][]';
        if (typeLower.startsWith('kv')) return '{ [key: string]: any }';

        return 'any';
    };

    // 处理每个Excel文件
    files.forEach(file => {
        if (!/\.(xlsx|xls)$/i.test(path.extname(file))) return;

        const filePath = path.join(`${excelPath}`, `${file}`);
        const workbook = xlsx.readFile(filePath);

        // @ts-ignore
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

            if (!rows || rows.length === 0) {
                Editor.warn(`工作表 ${sheetName} 没有数据，跳过处理`);
                return;
            }

            let jsonData = null;
            let keys = [];
            let types = [];
            let fieldComments = [];

            // 判断表格格式：竖式或横式
            if (rows[0][0] === 'id' || rows[0][0] === 'lid') {
                // 竖式表格
                if (rows.length < 4) {
                    Editor.warn(`工作表 ${sheetName} 数据不足，跳过处理`);
                    return;
                }
                keys = rows[0];
                types = rows[1].map((t) => t ? t.toString().toLowerCase() : 'string');
                fieldComments = rows[2].map((c) => c ? c.toString() : '');
                jsonData = [];
                for (let i = 3; i < rows.length; i++) {
                    const row = rows[i];
                    const obj = {};
                    if (row[0] !== undefined) {
                        for (let j = 0; j < keys.length; j++) {
                            obj[keys[j]] = convertValue(types[j], row[j]);
                        }
                        jsonData.push(obj);
                    }
                }
            } else {
                // 横式表格
                jsonData = {};
                keys = [];
                types = [];
                fieldComments = [];
                rows.forEach(row => {
                    if (row.length < 4) return;
                    const key = row[0];
                    const type = row[1] ? row[1].toString().toLowerCase() : 'string';
                    const comment = row[2] ? row[2].toString() : '';
                    keys.push(key);
                    types.push(type);
                    fieldComments.push(comment);
                    const data = row.slice(3);
                    if (data.length === 1) {
                        jsonData[key] = convertValue(type, data[0]);
                    } else {
                        jsonData[key] = data.map(v => convertValue(type, v));
                    }
                });
            }

            // 生成二进制文件（简化版，只包含数据）
            const binaryFileName = `${sheetName}.bin`;
            const binaryOutputFile = path.join(`${outputDir}`, binaryFileName);

            // 直接序列化数据为二进制
            generateSimpleBinaryFile(jsonData, binaryOutputFile);
            generatedFiles.push(binaryOutputFile);
            Editor.log(`转换成功: ${sheetName}.bin`);

            // 收集类型信息
            typeInfos.push({
                name: sheetName,
                fields: keys.map((key, index) => ({
                    key,
                    tsType: convertToTsType(types[index]),
                    comment: fieldComments[index] || ''
                }))
            });
        });
    });

    // 生成类型定义文件
    if (typeInfos.length > 0) {
        generateTypeDefinition(typeInfos);
    }
}

// 简化版：只存储序列化后的JSON数据
function generateSimpleBinaryFile(data, outputPath) {
    // 将数据序列化为JSON字符串
    const jsonString = JSON.stringify(data);
    // 转换为Buffer
    const buffer = Buffer.from(jsonString, 'utf8');
    // 写入文件
    fs.writeFileSync(outputPath, buffer);
}

// 生成TypeScript类型定义文件
function generateTypeDefinition(list) {
    const lines = [];
    lines.push("// 自动生成的配置类型定义，请勿手动修改\n");
    lines.push("/** 通用配置查询接口 */");
    lines.push("interface ConfigFunc<T> {");
    lines.push("   get(value?: any, key?: string): T;");
    lines.push("   getAll(): T[];");
    lines.push("}\n");
    lines.push("interface configType {");
    list.forEach(info => {
        // const key = info.name.charAt(0).toLowerCase() + info.name.slice(1);
        lines.push(`    ${info.name}?: ConfigFunc<${info.name}Config>;`);
    });
    lines.push("}\n");

    // 生成每个配置表的接口
    list.forEach(info => {
        lines.push(`interface ${info.name}Config {`);
        info.fields.forEach(field => {
            if (field.comment) {
                lines.push(`    /** ${field.comment} */`);
            }
            lines.push(`    ${field.key}?: ${field.tsType};`);
        });
        lines.push("}\n");
    });

    const outputFile = path.join(Editor.Project.path, "type_bin.d.ts");
    fs.writeFileSync(outputFile, lines.join("\n"));
    Editor.log("已生成类型定义文件: type_bin.d.ts");
}