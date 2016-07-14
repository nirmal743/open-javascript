import {validateAndCallbackify, getMerchantAccessKey} from "./../utils";
import {baseSchema} from "./../validation/validation-schema";
import cloneDeep from "lodash/cloneDeep";
import {handlersMap, getConfig} from "../config";
import {custFetch} from "../interceptor";
import {getCancelResponse, refineMotoResponse} from "./response";
let cancelApiResp;

const NBAPIFunc = (confObj, apiUrl) => {
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
        requestOrigin: "CJSG"
    });
    reqConf.offerToken = getConfig().dpOfferToken;
    delete reqConf.bankCode;
    delete reqConf.currency;
    delete reqConf.paymentDetails;
    const mode = (reqConf.mode) ? reqConf.mode.toLowerCase() : "";
    delete reqConf.mode;
    cancelApiResp = getCancelResponse(reqConf);
    if (mode === 'dropout' || getConfig().page === 'ICP') {
    } else {
        reqConf.returnUrl = 'https://stgjs.citruspay.com/blade/returnUrl';//window.location.protocol + '//' + window.location.host + '/blade/returnUrl';
        winRef = openPopupWindow("");
        winRef.document.write('<html><head><meta name="viewport" content="width=device-width" /><meta http-equiv="Cache-control" content="public" /><title>Redirecting to Bank</title></head><style>body {background:#fafafa;}#wrapper {position: fixed;position: absolute;top: 20%;left: 0;right:0;margin: 0 auto;font-family: Tahoma, Geneva, sans-serif; color:#000;text-align:center;font-size: 14px;padding: 20px;max-width: 500px;width:70%;}.maintext {font-family: Roboto, Tahoma, Geneva, sans-serif;color:#f6931e;margin-bottom: 0;text-align:center;font-size: 21pt;font-weight: 400;}.textRedirect {color:#675f58;}.subtext{margin : 15px 0 15px;font-family: Roboto, Tahoma, Geneva, sans-serif;color:#929292;text-align:center;font-size: 14pt;}.subtextOne{margin : 35px 0 15px;font-family: Roboto, Tahoma, Geneva, sans-serif;color:#929292;text-align:center;font-size: 14pt;}@media screen and (max-width: 480px) {#wrapper {max-width:100%!important;}}</style><body><div id="wrapper"><div id = "imgtext" style=" margin-left:1%; margin-bottom: 5px;"><img src="https://www.citruspay.com/resources/pg/images/logo_citrus.png"/></div><p class="maintext">Quick <span class="textRedirect">Redirection</span></p><p class="subtext"><span>We are processing your payment..</span></p><p class="subtextOne"><span>IT MIGHT TAKE A WHILE</span></p></div></body></html>');
    }
    if (getConfig().page === 'ICP') {

        return custFetch(apiUrl, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reqConf)
        });

    }
    else {
        return custFetch(apiUrl, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reqConf)
        }).then(function (resp) {
            if (resp.data.redirectUrl) {
                if (mode === "dropout") {
                    window.location = resp.data.redirectUrl;
                }
                else {
                    winRef = openPopupWindow("");
                    setTimeout(function () {
                        winRef.location.replace(resp.data.redirectUrl);
                        if (!isIE()) {
                            workFlowForModernBrowsers(winRef)
                        } else {
                            workFlowForIE(winRef);
                        }
                    }, 1000);
                }
            } else {
                winRef.close();
                const response = refineMotoResponse(resp.data);
                handlersMap['serverErrorHandler'](response);
            }
        });
    }
};

let winRef = null;
let transactionCompleted = false;

const openPopupWindow = (url) => {

    if (winRef == null || winRef.closed) {

        const w = 680;
        const h = 550;
        const dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
        const dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

        const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

        const left = ((width / 2) - (w / 2)) + dualScreenLeft;
        const top = ((height / 2) - (h / 2)) + dualScreenTop;
        winRef = window.open(url, 'PromoteFirefoxWindowName', 'scrollbars=yes, resizable=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
    } else {
        winRef.focus();
    }
    return winRef;
};

const isIE = () => {
    const ua = window.navigator.userAgent;
    const ie10orless = ua.indexOf('MSIE ');
    const ie11 = ua.indexOf('Trident/');
    const edge = ua.indexOf('Edge/');
    return !!(ie10orless > -1 || ie11 > -1 || edge > -1);
};

const workFlowForModernBrowsers = (winRef) => {

    var intervalId = setInterval(function () {
        if (transactionCompleted) {
            return clearInterval(intervalId);
        }
        if (winRef) {
            if (winRef.closed === true) {
                clearInterval(intervalId);
                if (getConfig().responded === true) {
                } else {
                    window.responseHandler(cancelApiResp);
                }
            }
        } else {
            clearInterval(intervalId);
        }
    }, 500);

};

const workFlowForIE = (winRef) => {
    const intervalId = setInterval(function () {
        if (transactionCompleted) {
            return clearInterval(intervalId);
        }
        if (winRef) {
            if (winRef.closed) {
                clearInterval(intervalId);
                if (getConfig().responded === true) {
                } else {
                    window.responseHandler(cancelApiResp);
                }
            }
        }
    }, 500);
};

window.notifyTransactionToGoodBrowsers = function (data) {
    transactionCompleted = true;
    data = JSON.parse(data);
    handlersMap['transactionHandler'](data);

    setTimeout(function () {
        parent.postMessage('closeWallet', '*');
    }, 6000);
};

window.responseHandler = function (response) {
    handlersMap['transactionHandler'](response);
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
    const apiUrl = `${getConfig().motoApiUrl}/moto/authorize/struct/${getConfig().vanityUrl}`;
    return NBAPIFunc(confObj, apiUrl);
});
//wrapper function call
const netbanking = validateAndCallbackify(netBankingValidationSchema, (confObj) => {
    const apiUrl = `${getConfig().motoApiUrl}/moto/authorize/struct/${getConfig().vanityUrl}`;
    return NBAPIFunc(confObj, apiUrl);
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
        requestOrigin: "CJSW"
    });

    confObj.CVV && (reqConf.paymentToken.cvv = confObj.CVV);

    delete reqConf.currency;
    delete reqConf.token;
    delete reqConf.CVV; //will delete if present
    return custFetch(url, { //for Blazenet use `${getConfig().blazeNetApiUrl}/netbank/chksumtrans`
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        //mode: 'cors',
        body: JSON.stringify(reqConf)
    })
};

const makeSavedNBPayment = validateAndCallbackify(savedNBValidationSchema, (confObj)=> {
    const apiUrl = `${getConfig().motoApiUrl}/moto/authorize/struct/${getConfig().vanityUrl}`;
    return savedAPIFunc(confObj, apiUrl);
});

export {makeNetBankingPayment, makeSavedNBPayment, makeBlazeNBPayment, savedAPIFunc, savedNBValidationSchema, netbanking}