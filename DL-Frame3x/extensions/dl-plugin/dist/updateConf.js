const fs = require('fs');
const path = require('path');

const confName = require("../config.json").confName;
const outputFile = path.join(Editor.Project.path, 'type_conf.d.ts');

// 首字母大写函数
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// 生成唯一接口名称
function generateUniqueInterfaceName(baseName, existingNames) {
    let counter = 1;
    let candidate = baseName;
    while (existingNames.has(candidate)) {
        candidate = `${baseName}_${counter++}`;
    }
    existingNames.add(candidate);
    return candidate;
}

// 核心：生成接口内容
function generateInterfaceContent(interfaceName, jsonObject) {
    const interfaces = [];
    const interfaceCache = new Map();
    const existingInterfaceNames = new Set([`${interfaceName}Config`]);

    const processValue = (value, parentInterface, propPath, isArrayElement = false) => {
        // 处理null/undefined
        if (value === null || value === undefined) {
            return 'any';
        }

        // 处理数组
        if (Array.isArray(value)) {
            if (value.length === 0) return 'any[]';
            
            const elementTypes = new Set();
            for (let i = 0; i < value.length; i++) {
                const type = processValue(
                    value[i], 
                    parentInterface, 
                    `${propPath}${isArrayElement ? '_item' : ''}_${i}`,
                    true
                );
                elementTypes.add(type);
            }
            
            const types = Array.from(elementTypes);
            return types.length === 1 ? `${types[0]}[]` : `Array<${types.join(' | ')}>`;
        }

        // 处理对象
        if (typeof value === 'object') {
            const cacheKey = JSON.stringify(value);
            if (interfaceCache.has(cacheKey)) {
                return interfaceCache.get(cacheKey);
            }

            // 生成唯一接口名称
            const newInterfaceName = generateUniqueInterfaceName(
                `${parentInterface}${propPath ? capitalize(propPath) : 'Item'}`,
                existingInterfaceNames
            );
            
            interfaceCache.set(cacheKey, newInterfaceName);
            
            let interfaceContent = `interface ${newInterfaceName} {\n`;
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    const propType = processValue(value[key], newInterfaceName, key);
                    interfaceContent += `    ${key}?: ${propType};\n`;
                }
            }
            interfaceContent += '}';
            interfaces.push(interfaceContent);
            
            return newInterfaceName;
        }

        // 处理基本类型
        switch (typeof value) {
            case 'number': return 'number';
            case 'string': return 'string';
            case 'boolean': return 'boolean';
            default: return 'any';
        }
    };

    // 处理根对象
    const rootInterfaceName = `${interfaceName}Config`;
    
    if (Array.isArray(jsonObject) && jsonObject.length > 0) {
        // 处理根数组 - 聚合所有元素的属性
        const allProps = new Map();
        
        jsonObject.forEach(item => {
            if (item && typeof item === 'object') {
                for (const key in item) {
                    if (!allProps.has(key)) {
                        allProps.set(key, new Set());
                    }
                    const type = processValue(item[key], rootInterfaceName, key);
                    allProps.get(key).add(type);
                }
            }
        });

        // 生成根接口
        let content = `interface ${rootInterfaceName} {\n`;
        allProps.forEach((types, key) => {
            const typeList = Array.from(types);
            content += `    ${key}?: ${typeList.length > 1 ? `(${typeList.join(' | ')})` : typeList[0]};\n`;
        });
        content += '}';
        interfaces.unshift(content);
    } else if (typeof jsonObject === 'object') {
        // 处理根对象
        let content = `interface ${rootInterfaceName} {\n`;
        for (const key in jsonObject) {
            if (Object.prototype.hasOwnProperty.call(jsonObject, key)) {
                const propType = processValue(jsonObject[key], rootInterfaceName, key);
                content += `    ${key}?: ${propType};\n`;
            }
        }
        content += '}';
        interfaces.unshift(content);
    } else {
        // 基本类型直接返回
        const type = typeof jsonObject === 'object' ? 'any' : typeof jsonObject;
        interfaces.push(`interface ${rootInterfaceName} {\n    value?: ${type};\n}`);
    }

    return interfaces.join('\n\n') + '\n\n';
}

async function updateConf() {
    try {
        // 生成通用配置接口
        let configTypeContent = `/** 通用配置查询接口 */
interface ConfigFunc<T> {
   /**
    * 查询方法：支持按任意键查找
    * @param value 要查找的值
    * @param key 要查找的键（默认'id'）
    */
   get(value?: any, key?: string): T;
   
   /** 返回全部配置数组 */
   getAll(): T[];
}

interface configType {\n`;
    
        let allInterfacesContent = "";
        const processedFiles = new Set();

        for (const confDirName of confName) {
            const confDir = path.join(Editor.Project.path, confDirName);
            
            if (!fs.existsSync(confDir)) {
                console.warn(`配置目录不存在: ${confDir}`);
                continue;
            }
            
            const files = await fs.promises.readdir(confDir);
            
            for (const file of files) {
                if (file.endsWith('.json') && !processedFiles.has(file)) {
                    processedFiles.add(file);
                    
                    try {
                        const interfaceName = file.replace('.json', '');
                        configTypeContent += `    ${interfaceName}?: ConfigFunc<${interfaceName}Config>;\n`;
                        
                        const jsonFilePath = path.join(confDir, file);
                        const jsonData = await fs.promises.readFile(jsonFilePath, 'utf-8');
                        const jsonObject = JSON.parse(jsonData);
                        
                        const interfaceContent = generateInterfaceContent(interfaceName, jsonObject);
                        allInterfacesContent += interfaceContent;
                    } catch (error) {
                        console.error(`处理文件 ${file} 时出错:`, error);
                    }
                }
            }
        }
        
        configTypeContent += "}\n\n";
        const finalContent = "// 自动生成的配置类型定义，请勿手动修改\n\n" + 
                            configTypeContent + 
                            allInterfacesContent;
        
        await fs.promises.writeFile(outputFile, finalContent);
        console.log(`配置类型定义已成功生成: ${outputFile}`);
    } catch (error) {
        console.error('生成配置类型时发生错误:', error);
    }
}

exports.updateConf = updateConf;