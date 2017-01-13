import {handlersMap} from "../config";
import {setAppData, isPciRequest} from "./../utils";
import {makeNetBankingPayment, makeSavedNBPayment} from "./net-banking";
import {makeCardPaymentWrapper, makeSavedCardPayment} from "./cards";
import {makeHostedFieldPayment} from "./hosted-field-payment";


const makePayment = (paymentObj) => {
    //console.log(paymentObj,'inside make payment');
    if(!paymentObj.paymentDetails)
        throw new Error('Missing paymentDetails object');
    if(!paymentObj.paymentDetails.paymentMode)
        throw new Error('Missing paymentMode property inside paymentDetails object');
    switch (paymentObj.paymentDetails.paymentMode) {
        //todo : needs to be checked for PCI compliant merchants
        case "card" :
            if(isPciRequest())
            {
                //setAppData('paymentObj', paymentObj);
                makeCardPaymentWrapper(paymentObj);
                //makeMotoCardPayment(paymentObj);
            }
            else
                makeHostedFieldPayment(paymentObj);
            break;
        case "netBanking" :
            setAppData('paymentObj', paymentObj);
            makeNetBankingPayment(paymentObj);
            break;
         //this will become endPoint for non-hosted cvv saved card integration point later   
        case "savedCard":
            makeSavedCardPayment(paymentObj);
            break;
        case "savedNetBanking":
            makeSavedNBPayment(paymentObj);
            break;
        //todo: message needs to be structured
        default :
            handlersMap['errorHandler']("Invalid payment mode");
            return;
    }
};

export {
    makePayment
};