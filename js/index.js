//import 'babel-polyfill';
import 'core-js/fn/object/assign';
import 'core-js/fn/promise';
import 'core-js/fn/string/includes';

import {makeNetBankingPayment, makeSavedNBPayment, makeBlazeNBPayment} from './apis/net-banking';
import {getPaymentDetails, getPaymentDetailsForMCP} from './apis/payment-details';
import {makeBlazeCardPayment, getmerchantCardSchemes, makeMotoCardPayment, makeSavedCardPayment} from './apis/cards';
//import {makeWallletPayment} from './apis/wallet';
import {validateExpiryDate, validateScheme, validateCreditCard} from './validation/custom-validations';
import {init, handlersMap, setConfig, getConfig} from './config';
import {makeMCPCardPayment, getCardCurrencyInfo} from './apis/mcp';
//import * as tests from './tests/simple-tests';
import {schemeFromNumber} from './utils';
import {applyDynamicPricing,makeDPCardPayment} from './apis/card-dp';
import {applyNbDynamicPricing} from './apis/net-banking-dp';
import {makePayment} from './apis/payment';
import {isIE} from './utils';


init(); //initializes custom validators

window.citrus = window.citrus || {};

window.responseHandler = function(response){
    if(isIE) {
        const responded = true;
        setConfig({responded});
    }
    handlersMap['transactionHandler'](response);
};

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
    geteways: {
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
        makeBlazeCardPayment,
        makeSavedCardPayment,
        makeMCPCardPayment,
        getCardCurrencyInfo,
        getPaymentDetailsForMCP,
        getPaymentDetails,
        applyDynamicPricing,
        makeDPCardPayment
    },
    wallet: {
        //makeWallletPayment
    },
    features: {
        applyDynamicPricing,
        //makeWallletPayment
    },
    payment:{
        makePayment
    }
});