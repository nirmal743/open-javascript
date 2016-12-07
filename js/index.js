//import 'babel-polyfill';
import "core-js/fn/object/assign";
import "core-js/fn/promise";
import "core-js/fn/string/includes";
import {makeNetBankingPayment, makeSavedNBPayment, makeBlazeNBPayment} from "./apis/net-banking";
import {getPaymentDetails, getPaymentDetailsForMCP} from "./apis/payment-details";
import {getmerchantCardSchemes, makeMotoCardPayment, makeSavedCardPayment} from "./apis/cards";
import {makeExtWalletsPayment} from "./apis/external-wallets";
import {validateExpiryDate, validateScheme, validateCreditCard} from "./validation/custom-validations";
import {init, handlersMap, setConfig, getConfig} from "./config";
import {getCardCurrencyInfo} from "./apis/mcp";
import {schemeFromNumber,setAppData} from "./utils";
import {applyDynamicPricing, makeDPCardPayment} from "./apis/card-dp";
import {applyNbDynamicPricing} from "./apis/net-banking-dp";
import {makePayment} from "./apis/payment";
import {listener} from "./apis/hosted-field-payment";
import {singleHopDropInFunction} from "./apis/singleHop";
import {applyWallletDynamicPricing} from "./apis/wallet-dp";
import {create} from "./hosted-field-setup";
//import {makeWallletPayment} from './apis/wallet';
//import * as tests from './tests/simple-tests';


init(); //initializes custom validators

window.citrus = window.citrus || {};

if (window.addEventListener) {
    addEventListener("message", listener, false)
} else {
    attachEvent("onmessage", listener)
}

Object.assign(window.citrus, {
    setConfig,
    getConfig,
    validators: {
        validateExpiryDate,
        validateScheme,
        validateCreditCard
    },
    utils: {
        schemeFromNumber
    },
    registerHandlers: (key, handler) => {
        handlersMap[key] = handler;
    },
    gateways: {
        getPaymentDetails
    },
    netbanking: {
        makeNetBankingPayment,
        makeSavedNBPayment,
        makeBlazeNBPayment,
        applyNbDynamicPricing
    },
    cards: {
        getmerchantCardSchemes,
        makeMotoCardPayment,
        //makeBlazeCardPayment,
        makeSavedCardPayment,
        //makeMCPCardPayment,
        getCardCurrencyInfo,
        getPaymentDetailsForMCP,
        getPaymentDetails,
        applyDynamicPricing,
        makeDPCardPayment
    },
    hostedFields: {
        create
    },
    wallet: {
        //makeWallletPayment
        makeExtWalletsPayment
    },
    features: {
        applyDynamicPricing,
        singleHopDropInFunction,
        applyWallletDynamicPricing
        //makeWallletPayment
    },
    payment: {
        makePayment
    }
});
