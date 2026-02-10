import { LanguageType } from "../../appDL/System/GlobalEventEnum";
import { AdsType, CallBackStatus, GoodsInfo } from "../../scripts/project/mySystemEnum";
import { BillingType, SubType } from "./myGameEnum";

export enum PayState {
    /**未知 */
    None,
    /**成功 */
    Succeed,
    /**失败 */
    Lose,
}

export enum PayType {
    /**普通 */
    Normal = 1,
    /**订阅 */
    Sku,
    /**非消耗品 */
    NonConsumable,
}

export enum AdScene {
    CP_001 = "cp_001",
    // CP_002 = "cp_002",
    SP_001 = "sp_001",
    // SP_002 = "sp_002",
    BA_001 = "ba_001",
    // BA_002 = "ba_002",
    // BA_003 = "ba_003",
    // BA_004 = "ba_004",
}

/**事件类型 */
export enum EventType {
    /**事件(不带参数) */
    NullParams,
    /**事件(带参数) */
    Params,
    /**公共事件 */
    Public,
    /**用户属性事件user_set */
    UserSet,
    /**用户属性事件user_add */
    UserAdd,
    /**用户属性事件user_setOnce */
    UserSetOnce,
    /**fb事件 */
    FB = 100,
}
const CLASS_NAME = "com/hotness/screw/puzzle/sort/nuts/jam/service/JniService";
const IOS_CLASS_NAME = "JniService";

export default class platformMgr {
    /**广告成功回调 */
    private static adCallBack = null;
    /**内购支付回调 */
    private static _payCallbacks = null;
    /**视频下载结果回调 */
    private static _videoSave: Function = null;

    /**通知android，cocos程序已启动 */
    public static notifyLaunched() {
        if (cc.sys.isBrowser) return;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android appLaunched');
            jsb.reflection.callStaticMethod(CLASS_NAME, "appLaunched", "()V");
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios appLaunched');
            // @ts-ignore
            jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "appLaunched");
        }
    }

    /**检测广告
     * @param type 广告类型
     * @param placeId 广告id
     */
    public static checkAd(type: AdsType, placeId: string) {
        let loaded = false;
        if (!cc.sys.isNative) return true;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android checkAd');
            loaded = jsb.reflection.callStaticMethod(CLASS_NAME, "checkAd", "(ILjava/lang/String;)Z", type, placeId);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios checkAd');
            // @ts-ignore
            loaded = jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "checkAd:and:", type, placeId);
        }
        if (!loaded) {
            if (type == AdsType.AT_RewardVideo) {
                let tips = X.getI18n(56);
                Tip.show(tips);
            }
        }
        return loaded;
    }

    /**展示广告
     * @param type 广告类型
     * @param placeId 广告id
     * @param adCb 广告回调
     * @param nextAd 是否是点击下一关的插屏广告
     * 
     */
    public static showAd(type: AdsType, placeId: string, adCb?: Function, nextAd: boolean = false) {
        if (type == AdsType.AT_Banner_Bottom) {
            // if (myC.removeAds > 1) {
            //     console.warn(myC.removeAds > 1 ? '已购买去广告, 不播放插屏、底部banner' : '订阅生效中');
            //     return;
            // }
        }
        if (!placeId) placeId = '';
        // console.log("showAd========>" + type, placeId);
        this.adCallBack = adCb ?? null;
        if (!cc.sys.isNative) {
            if ((type == AdsType.AT_Interstitial || type === AdsType.AT_RewardVideo) && adCb) return adCb(CallBackStatus.CALL_SUCCESS);
        }
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android showAd');
            jsb.reflection.callStaticMethod(CLASS_NAME, "showAd", "(ILjava/lang/String;)V", type, placeId);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            if (type == AdsType.AT_Interstitial || type === AdsType.AT_RewardVideo) {
                if (adCb) adCb(CallBackStatus.CALL_SUCCESS);
            }
            return;
            console.warn('call ios showAd');
            // @ts-ignore
            jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "showAd:and:", type, placeId);
        }
    }

    public static OnVideoAdReward(adInfo: any) {
        console.log('ad callback: ' + adInfo);
        let mAdInfo = JSON.parse(adInfo);
        let state = mAdInfo.mStatus;
        if (this.adCallBack && state === CallBackStatus.CALL_SUCCESS) {
            this.adCallBack(state);
            // console.log('播放完毕，执行回调方法');
            this.adCallBack = null;
        } else if (state === CallBackStatus.CALL_FALIED) {
            if (mAdInfo.mType == AdsType.AT_RewardVideo) {
                Tip.show(X.getI18n(56));
                if (this.adCallBack) {
                    this.adCallBack(state);
                    this.adCallBack = null;
                }
            }
        }
        if (mAdInfo.mType === AdsType.AT_RewardVideo) {
            platformMgr.onStatis("", { "total_rewad_count": 1 }, EventType.UserAdd);
        }
    }

    /**关闭广告 */
    public static closeAD(type: AdsType) {
        if (!cc.sys.isNative) return;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android closeAd');
            jsb.reflection.callStaticMethod(CLASS_NAME, "closeAd", "(I)V", type);
            console.log('去广告');
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios closeAd');
            // @ts-ignore
            jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "closeAd:", type);
        }
    }

    /**
     * 打点接口
     * @param evtId 打点字段
     * @param params 参数
     * @param type 事件类型EventType
     * @returns 
     */
    public static onStatis(evtId: string = "", params?: any, type: number = EventType.FB) {
        let paramJson: any = '';
        if (params) paramJson = JSON.stringify(params);
        console.warn(`统计事件名：${evtId}, 参数：${paramJson}, 类型：${type}`);
        if (!cc.sys.isNative) return;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android onStatistics');
            jsb.reflection.callStaticMethod(CLASS_NAME, "onStatistics", "(Ljava/lang/String;Ljava/lang/String;I)V", evtId, paramJson, type);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios onStatistics');
            jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "onStatistics:and:and:", evtId, paramJson, type);
        }
    }

    public static getCountryCode() {
        let country = '';
        if (!cc.sys.isNative) return country;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android getCountryCode');
            country = jsb.reflection.callStaticMethod(CLASS_NAME, "getCountryCode", "()Ljava/lang/String;");
            console.log('国家：' + country);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios getCountryCode');
            // @ts-ignore
            country = jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "getCountryCode");
        }
        return country;
    }

    public static getVersion(): string {
        let version = "1.0.0";
        if (!cc.sys.isNative) return version;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android getVersion');
            version = jsb.reflection.callStaticMethod(CLASS_NAME, "getVersion", "()Ljava/lang/String;",);
            console.log('app version:' + version);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios getVersion');
            // @ts-ignore
            version = jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "getVersion");
        }
        return version;
    }

    /**获取当前通知权限是否打开 */
    public static getNotification() {
        if (!cc.sys.isNative) return false;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android getNotificationEnabled');
            return jsb.reflection.callStaticMethod(CLASS_NAME, "getNotificationEnabled", "()Z",);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios getNotificationEnabled');
            // @ts-ignore
            return jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "getNotificationEnabled");
        }
        return false;
    }

    /**动态获取通知权限 */
    public static verifyNotification() {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android verifyNotificationPermissions');
            jsb.reflection.callStaticMethod(CLASS_NAME, "verifyNotificationPermissions", "()V",);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios verifyNotificationPermissions');
            // @ts-ignore
            jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "verifyNotificationPermissions");
        }
    }

    /**好评 */
    public static giveScore() {
        if (!cc.sys.isNative) return;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android customMethod');
            jsb.reflection.callStaticMethod('com/mah/jni/mahJniService', "customMethod", "(Ljava/lang/String;Ljava/lang/String;)V", "GotoReview", "5");
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios customMethod');
            jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "customMethod:and:", "GotoReview", "5");
        }
    }

    /**支付 */
    public static toPay(payId: number, payType: PayType = PayType.Normal, cb: Function) {
        this._payCallbacks = cb;
        if (myG.openPay) return this.paySuccess('');
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android toPay');
            jsb.reflection.callStaticMethod(CLASS_NAME, "toPay", "(II)V", payId, payType);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios toPay');
            // @ts-ignore
            jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "toPay:", payId);
        } else {
            this.paySuccess('');
        }
    }
    
    /**订单消息 */
    public static sendSkuDetails(msg: string) {
        console.log('支付信息: ' + msg);
        if (!msg || msg.length <= 0) return;
        let payList = JSON.parse(msg);

        let info = {};
        for (let i = 0; i < payList.length; i++) {
            const pay = payList[i];
            let gInfo: GoodsInfo = {
                payId: pay.mPayId,
                price: pay.mPrice,
                status: pay.mStatus,
                currencyCode: pay.mPriceCurrencyCode,
                priceAmount: pay.mPriceAmountMicros,
                pType: pay.mPayType,
                subTime: pay.mPurchaseTime
            }
            if (Number(gInfo.pType) === BillingType.SUBS && gInfo.subTime > 0 && gInfo.status === CallBackStatus.CALL_SUCCESS) {
                myG.subData = {
                    subType: gInfo.payId,
                    buyTime: gInfo.subTime
                }
            }
            if (gInfo.payId === SubType.LifeSub && gInfo.status === CallBackStatus.CALL_SUCCESS) {// 恢复终身订阅
                this.closeAD(AdsType.AT_Banner_Bottom);
            }
            if (gInfo.status === CallBackStatus.CALL_SUCCESS) {// 恢复去广告
                this.closeAD(AdsType.AT_Banner_Bottom);
            }

            info[gInfo.payId] = gInfo;
            console.log(`payId:${gInfo.payId}, price:${gInfo.price}, status:${gInfo.status}, currencyCode:${gInfo.currencyCode}, priceAmount:${gInfo.priceAmount}, pType:${gInfo.pType}, subTime:${gInfo.subTime}`);
        }
        myG.goodsInfos = info;
    }

    /**支付成功 */
    public static paySuccess(msg: string) {
        if (this._payCallbacks) {
            Tip.show(X.getI18n(18));
            this._payCallbacks(PayState.Succeed, msg);
        }
    }

    /**支付失败 */
    public static payFail(msg: string) {
        Tip.show(X.getI18n(17));
        if (this._payCallbacks) this._payCallbacks(PayState.Lose);
    }

    /**ios pay return */
    public static payReturnStatus(msg: string) {

    }

    /**保存图片回调 */
    private static _saveImgCB: Function = null;
    /**保存图片到本地
     * @param imagePath 图片路径
     * @param saveCB 结果回调
     */
    public static saveTextureToLocal(imagePath: string, saveCB: Function) {
        this._saveImgCB = saveCB;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android saveTextureToLocal');
            jsb.reflection.callStaticMethod(CLASS_NAME, "saveTextureToLocal", "(Ljava/lang/String;)V", imagePath);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios saveTextureToLocal');
            jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "saveTextureToLocal:", imagePath);
        }
    }

    /**接收保存图片回调方法 */
    public static sendSaveResult(msg: string) {
        if (!this._saveImgCB) return;
        let msgNum = Number(msg);
        if (isNaN(msgNum)) return;
        this._saveImgCB(msgNum);
    }

    /**保存视频回调 */
    private static _saveVideoCB: Function = null;
    /**保存视频到本地
     * @param videoPath 视频路径
     * @param saveCB 结果回调
     */
    public static saveVideoToLocal(videoPath: string, saveCB: Function) {
        this._saveVideoCB = saveCB;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android saveTextureToLocal');
            jsb.reflection.callStaticMethod(CLASS_NAME, "downloadVideo", "(Ljava/lang/String;)V", videoPath);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios saveTextureToLocal');
        }
    }

    /**接收保存视频回调方法 */
    public static sendSaveVideoResult(msg: string) {
        if (!this._saveVideoCB) return;
        let msgNum = Number(msg);
        if (isNaN(msgNum)) return;
        this._saveVideoCB(msg);
    }

    /**
     * 展示邮件
     * @param mailSource 邮件来源
     * @param levelType 关卡类型
     * @param levelId 关卡Id
     */
    public static showMail() {
        let version = platformMgr.getVersion();
        let country = platformMgr.getCountryCode();
        let userLanguage = C.languageId;
        let language = `${userLanguage};${userLanguage}`;
        let content =
            `MAILTYPE:feedback\n` +
            `VERSION:${version}\n` +
            `COUNTRY:${country}\n` +
            `LANGUAGE:${language}\n` +
            `PACKAGE:${G.config.sundry.get().package}\n`;
        console.log(content);
        platformMgr.sendEmail(content);
    }

    /**发送邮件 */
    public static sendEmail(content: string) {
        if (!cc.sys.isNative) {
            console.warn('请在原生环境中发送邮件');
            return false;
        }
        console.log("js sendEmail!!");
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android startEmailActivity');
            return jsb.reflection.callStaticMethod(CLASS_NAME, "startEmailActivity", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", G.config.sundry.get().feedback, G.config.sundry.get().mailTitle, content,);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios startEmailActivity');
            // jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "startEmailActivity:and:and:", D.mahjong_sundryGlobal.feedback, D.mahjong_sundryGlobal.mailTitle, content);
        }
        return false;
    }

    /**接收当前手机语言 */
    public static reciveLanguage(lan: string) {
        if (lan) {
            console.log('语言id: ' + lan);
            if (lan === 'cn-SP') {
                lan = LanguageType.TraditionalChinese;
            } else if (lan === 'zh-Hans-CN') {
                lan = LanguageType.Chinese;
            }
            myG.languageId = lan;
        }
    }

    /**本地推送 */
    public static localNotify(title: string, content: string, time: number, btnTitle: string) {
        if (!cc.sys.isNative) return;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android localNotify');
            jsb.reflection.callStaticMethod(CLASS_NAME, "localNotify", "(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;)V", title, content, time, btnTitle);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios localNotify');
            jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "localNotify:", "");
        }
    }

    /**获取支付信息 */
    public static getSkuDetails() {
        let billingInfo: string = null;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android getBilling');
            billingInfo = jsb.reflection.callStaticMethod(CLASS_NAME, "getBilling", "()Ljava/lang/String;");
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios getBilling');
            // @ts-ignore
            billingInfo = jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "getBilling");
        }
        if (!billingInfo) return;
        this.sendSkuDetails(billingInfo);
    }

    /**接收通知消息 */
    public static getNotifyMsg() {
        let notifyMsg: string = null;
        if (!cc.sys.isNative) return notifyMsg;
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android getNotifyMsg');
            notifyMsg = jsb.reflection.callStaticMethod(CLASS_NAME, "getNotifyMsg", "()Ljava/lang/String;");
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            console.warn('call ios getNotifyMsg');
            // @ts-ignore
            notifyMsg = jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "getNotifyMsg");
        }
        return notifyMsg;
    }

    /**接收通知消息 */
    public static setNotifyMsg() {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android setNotifyMsg');
            jsb.reflection.callStaticMethod(CLASS_NAME, "setNotifyMsg", "()V");
        } else {
            // @ts-ignore
            jsb.reflection.callStaticMethod(IOS_CLASS_NAME, "setNotifyMsg");
        }
        return null;
    }

    /**恢复购买 */
    public static recovePurchase() {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            console.warn('call android checkSubs');
            jsb.reflection.callStaticMethod('com/mah/jni/mahJniService', "customMethod", "(Ljava/lang/String;Ljava/lang/String;)V", "checkSubs", "0");
        }
    }

    /**复制文本 */
    public static copyTxt(copyStr: string) {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(CLASS_NAME, "onCopy", "(Ljava/lang/String;)V", copyStr);
        }
    }

    static _videoName: string = null;
    public static downloadVideo(filePath: string, saveVideo: Function) {
        this._videoSave = saveVideo;
        if (cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(CLASS_NAME, "downloadVideo", "(Ljava/lang/String;)V", filePath);
        }
    }

    public static videoDownloadResult(s: string) {
        if (this._videoSave) this._videoSave(s);
    }

    static mChooseFunc: Function = null;
    public static selectImageFromGallery(chooseCB: Function) {
        this.mChooseFunc = chooseCB;
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(CLASS_NAME, "selectImageFromGallery", "()V");
        }
    }

    /**接收android 图片 */
    public static reciveImgFromAndroid(data: string) {
        myG.picData = data;
        if (this.mChooseFunc) {
            this.mChooseFunc(data);
        }
    }
}

globalThis["platformMgr"] = platformMgr;