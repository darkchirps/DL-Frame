/*******************************************************************************
 * 描述:    框架全局方法管理器 数组相关
*******************************************************************************/
export default class GeneralArray {
    /**打乱数组，使其所有不在原先位置的元素随机排列*/
    public derangement<T>(arr: T[]): T[] {
        const n = arr.length;
        const shuffled = [...arr];
        // Fisher-Yates变体，强制错位
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * i); // 仅选择比当前位置小的索引
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // 二次验证确保完全错位
        const hasOriginalPosition = shuffled.some((val, idx) => val === arr[idx]);
        return hasOriginalPosition ? this.derangement(arr) : shuffled;
    }
    /**找到数组中指定key值相同的一组返回
     * @param arr arr数据
     * @param key arr中的key
    */
    public findArrayGroup<T>(arr: T[], key: string): T[] {
        // 创建一个映射来存储每个元素的索引
        const indexMap: Map<string, T> = new Map();
        for (let i = 0; i < arr.length; i++) {
            let sign = arr[i][key];
            if (indexMap.get(sign)) {
                return [indexMap.get(sign), arr[i]]
            } else {
                indexMap.set(sign, arr[i]);
            }
        }
        // 如果没有找到重复的元素，返回 undefined
        return [];
    }
    /**找到数组相同的一组返回*/
    public findDuplicateIndices(arr: number[]): [number, number] | [] {
        // 创建一个映射来存储每个元素的索引
        const indexMap: Map<number, number> = new Map();
        for (let i = 0; i < arr.length; i++) {
            const num = arr[i];
            if (indexMap.has(num)) {
                // 如果元素已在映射中，返回之前和现在的索引
                return [indexMap.get(num)!, i];
            } else {
                // 否则将元素及其索引添加到映射中
                indexMap.set(num, i);
            }
        }
        // 如果没有找到重复的元素，返回 undefined
        return [];
    }
    /**返回数组相对对数*/
    public countElementPairs(arr: number[]): number {
        // 创建一个字典来存储每个元素的出现次数
        const frequencyMap: { [key: number]: number } = {};
        // 遍历数组并计算频率
        for (const num of arr) {
            if (frequencyMap[num] !== undefined) {
                frequencyMap[num]++;
            } else {
                frequencyMap[num] = 1;
            }
        }
        // 计算所有元素的对数
        let totalPairs = 0;
        for (const count of Object.values(frequencyMap)) {
            if (count > 1) {
                totalPairs += Math.floor(count / 2);
            }
        }
        return totalPairs;
    }
    /**返回只单个的数组元素位*/
    public filterSpecific(arr: number[]): number[] {
        const countMap: { [key: number]: number } = {};
        const output: number[] = [];
        // 统计每个数字的出现次数
        for (const num of arr) {
            countMap[num] = (countMap[num] || 0) + 1;
        }
        // 遍历数组
        for (let i = 0; i < arr.length; i++) {
            const num = arr[i];
            // 如果出现次数为单数，则输出索引
            if (countMap[num] % 2 !== 0) {
                output.push(i);
            }
        }
        return output;
    }
    /** 返回数组中每个元素的对数以及对的索引位置 */
    public countElementPairsTo(arr: number[]): { totalPairs: number, pairs: [number, number][] } {
        // 创建一个字典来存储每个元素的出现次数和索引列表
        const frequencyMap: { [key: number]: { count: number, indices: number[] } } = {};
        // 遍历数组并计算频率和记录索引
        for (let i = 0; i < arr.length; i++) {
            const num = arr[i];
            if (frequencyMap[num]) {
                frequencyMap[num].count++;
                frequencyMap[num].indices.push(i);
            } else {
                frequencyMap[num] = { count: 1, indices: [i] };
            }
        }
        // 计算所有元素的对数和对的索引位置
        let totalPairs = 0;
        const pairs: [number, number][] = [];
        for (const key in frequencyMap) {
            const { count, indices } = frequencyMap[key];
            if (count > 1) {
                // 计算对数
                totalPairs += Math.floor(count / 2);
                // 添加对的索引位置
                for (let i = 0; i < indices.length; i += 2) {
                    if (indices[i + 1] !== undefined) {
                        pairs.push([indices[i], indices[i + 1]]);
                    }
                }
            }
        }
        return { totalPairs, pairs };
    }
    /**遍历坐标数组 取出相同的*/
    public findDuplicateCoordinates(coords: Array<cc.Vec3>) {
        // 创建一个 Map 来跟踪每个坐标出现的次数
        const coordCount = new Map();
        const duplicates = [];
        // 遍历坐标数组
        coords.forEach(coord => {
            // 将坐标转换为字符串，以便作为 Map 的键
            const key = `${coord.x},${coord.y}`;
            // 更新坐标出现的次数
            if (coordCount.has(key)) {
                coordCount.set(key, coordCount.get(key) + 1);
            } else {
                coordCount.set(key, 1);
            }
        });
        // 遍历坐标出现次数的 Map，提取出现超过一次的坐标
        coordCount.forEach((count, key) => {
            if (count > 1) {
                // 将键转换回坐标对象
                const [x, y] = key.split(',').map(Number);
                duplicates.push(cc.v3(x, y));
            }
        });
        return duplicates;
    }
    /**拆分数组*/
    public splitArrayByLengths<T>(array: T[], lengths: number[]): T[][] {
        const result: T[][] = [];
        let index = 0;
        for (const length of lengths) {
            // 如果当前索引超出了数组的长度，则停止处理
            if (index >= array.length) {
                break;
            }
            // 从当前索引开始，取长度为 length 的子数组
            const chunk = array.slice(index, index + length);
            result.push(chunk);
            index += length;
        }
        return result;
    }
    /**随机打乱数组*/
    public shuffleArray(array) {
        // 遍历数组，从最后一个元素开始，到第二个元素
        for (let i = array.length - 1; i > 0; i--) {
            // 生成一个从 0 到 i 的随机整数
            const j = Math.floor(Math.random() * (i + 1));
            // 交换位置
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    /**对一个数组的元素对象排序，根据对象里的值，如果值相同，根据另一值
     * @注意 [{a:2,b:100},{a:2,b:120},{a:3,b:50}]
     * @list 数组数据
     * @type1 排序选择1
     * @type2 排序1相同时，排序根据排序2来
     * @back1 双方相同情况下默认返回数据从高到低
     * @back2 双方不相同情况默认返回数据从高到低
     */
    public arrayListSort(list: any, type1: string, type2: string, back1: boolean = false, back2: boolean = false) {
        let sorted = list.sort(function (a, b) {
            if (parseInt(a[type1]) == parseInt(b[type1])) {
                if (back1) {
                    return parseInt(a[type2]) - parseInt(b[type2]);
                } else {
                    return parseInt(b[type2]) - parseInt(a[type2]);
                }
            } else {
                if (back2) {
                    return parseInt(a[type1]) - parseInt(b[type1]);
                } else {
                    return parseInt(b[type1]) - parseInt(a[type1]);
                }
            }
        });
        return sorted;
    }
}