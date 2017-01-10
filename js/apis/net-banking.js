import {validateAndCallbackify, getMerchantAccessKey, getAppData, setAppData, isV3Request, isUrl} from "./../utils";
import {baseSchema} from "./../validation/validation-schema";
import cloneDeep from "lodash/cloneDeep";
import {getConfig, setConfig} from "../config";
import {TRACKING_IDS} from "../constants";
import {handlePayment} from "./payment-handler";

const NBAPIFunc = (confObj, apiUrl) => {
    if(getAppData('net_banking')) confObj.offerToken = getAppData('net_banking')['offerToken'];
    const reqConf = Object.assign({}, confObj, {
        amount: {
            currency: 'INR',
            value: confObj.amount
        },
        paymentToken: {
            type: 'paymentOptionToken',
            paymentMode: {
                type: 'netbanking',
                code: confObj.paymentDetails.bankCode
            }
        },
        merchantAccessKey: getMerchantAccessKey(confObj),
        requestOrigin: confObj.requestOrigin || TRACKING_IDS.CitrusGuest
    });
    delete reqConf.bankCode;
    delete reqConf.currency;
    delete reqConf.paymentDetails;
    const mode = (reqConf.mode) ? reqConf.mode.toLowerCase() : "";
    delete reqConf.mode;
    return handlePayment(reqConf,mode,apiUrl);
};

const netBankingValidationSchema = Object.assign(cloneDeep(baseSchema), {
    paymentDetails: {
        presence: true,
        keysCheck: ['paymentMode', 'bankCode']
    },
    "paymentDetails.bankCode": {presence: true}
});

netBankingValidationSchema.mainObjectCheck.keysCheck.push('paymentDetails');


const makeNetBankingPayment = validateAndCallbackify(netBankingValidationSchema, (confObj) => {
    return NBAPIFunc(confObj);
});


//------------------- makeBlazeNBPayment ----------------//

const makeBlazeNBPayment = validateAndCallbackify(netBankingValidationSchema, (confObj) => {
    const apiUrl = `${getConfig().motoApiUrl}/moto/authorize/struct/${getConfig().vanityUrl}`;
    return NBAPIFunc(confObj, apiUrl);
});

//------------------- makeSavedNBPayment ----------------//

const savedNBValidationSchema = Object.assign(cloneDeep(baseSchema), {
    token: {presence: true}
});

savedNBValidationSchema.mainObjectCheck.keysCheck.push('token');

const savedAPIFunc = (confObj, url) => {
    setAppData('paymentObj',confObj);
    if(getAppData('citrus_wallet')) confObj.offerToken = getAppData('citrus_wallet')['offerToken'];
    const reqConf = Object.assign({}, confObj, {
        amount: {
            currency: confObj.currency,
            value: confObj.amount
        },
        paymentToken: {
            type: 'paymentOptionIdToken',
            id: confObj.token
        },
        merchantAccessKey: getMerchantAccessKey(confObj),
        requestOrigin: confObj.requestOrigin || TRACKING_IDS.CitrusWallet
    });

    confObj.CVV && (reqConf.paymentToken.cvv = confObj.CVV);

    delete reqConf.currency;
    delete reqConf.token;
    delete reqConf.CVV;
    const mode = (reqConf.mode) ? reqConf.mode.toLowerCase() : "";
    delete reqConf.mode;
    return handlePayment(reqConf,mode);
};

const makeSavedNBPayment = (paymentObj)=>{
    let paymentData = cloneDeep(paymentObj);
    if(paymentObj.paymentDetails){
        if(!paymentObj.token && paymentObj.paymentDetails.token)
            paymentData.token = paymentObj.paymentDetails.token;
        delete paymentData.paymentDetails;
    }
    let makeSavedNBPaymentInternal = validateAndCallbackify(savedNBValidationSchema, (confObj)=> {
    const apiUrl = `${getConfig().motoApiUrl}/${getConfig().vanityUrl}`;
    return savedAPIFunc(confObj, apiUrl);
    });
    return makeSavedNBPaymentInternal(paymentData);
};

export {
    makeNetBankingPayment,
    makeSavedNBPayment,
    makeBlazeNBPayment,
    savedAPIFunc,
    savedNBValidationSchema
}