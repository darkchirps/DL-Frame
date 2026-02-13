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
        let txt = '';
        if (!G.config.language) {
            console.warn('languageMap is null');
            return txt;
        }
        //@ts-ignore
        let conf: languageConfig = G.config.language.get(id);
        if (!conf) {
            console.error('lan no id: ' + id);
            return txt;
        }
        switch (C.languageId) {
            case LanguageType.Chinese: txt = conf.zh; break;
            case LanguageType.English: txt = conf.en; break;
            case LanguageType.German: txt = conf.de; break;
            case LanguageType.Japan: txt = conf.jp; break;
            case LanguageType.Korean: txt = conf.kr; break;
            case LanguageType.French: txt = conf.fr; break;
            case LanguageType.Russian: txt = conf.ru; break;
        }
        if (!txt) {
            return '';
        }
        txt = txt.replace(/\\n/g, '\n');
        return cc.js.formatStr(txt, ...subst);
    }
}
