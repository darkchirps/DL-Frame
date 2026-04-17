import { js } from "cc";
import { LanguageType } from "../System/GlobalEventEnum";

/*******************************************************************************
 * 描述:    框架全局方法管理器
*******************************************************************************/
export default class GeneralI18n {

    /**获取多语言 根据id获取文本
    * @param id 文本表id
    * @param replace 替换的字符
    */
    public getI18n(id: number, ...subst: any[]): string {
        if (!G.config.language) {
            console.warn('languageMap is null');
            return '';
        }
        //@ts-ignore
        const conf: languageConfig = G.config.language.get(id);
        if (!conf) {
            console.error('lan no id: ' + id);
            return '';
        }
        // 直接用语言 key 索引，避免 switch 每次全量匹配
        // 注意：映射值需与配置表中的字段名保持一致
        const langKey: Record<string, string> = {
            [LanguageType.Chinese]: 'zh',
            [LanguageType.English]: 'en',
            [LanguageType.German]:  'de',
            [LanguageType.Japan]:   'ja',   // 修复：LanguageType.Japan = "ja"，配置表字段应为 'ja'
            [LanguageType.Korean]:  'kr',
            [LanguageType.French]:  'fr',
            [LanguageType.Russian]: 'ru',
        };
        const field = langKey[C.languageId] ?? 'zh';
        const txt = (conf[field] ?? '').replace(/\\n/g, '\n');
        if (!txt) return '';
        return js.formatStr(txt, ...subst);
    }
}
