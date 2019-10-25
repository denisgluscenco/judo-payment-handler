
import {
  JudoBillingDetails,
  JudoButtonType,
  JudoPayConfiguration,
  JudoPaymentCurrencyAmount,
  JudoPaymentDetails,
  JudoPaymentItem,
  JudoPaymentOptions,
  JudoPaymentResponse,
  JudoPaymentShippingOption,
  JudoShippingDetails
} from './models/JudoPayTypes'

import {
  ApplePayButtonStyle,
  ApplePayButtonType,
  ApplePayConfiguration,
  ApplePayMerchantCapability,
  ApplePaySupportedNetwork,
} from './models/ApplePayTypes'

import {
  GooglePayButtonStyle,
  GooglePayButtonType,
  GooglePayConfiguration,
  GooglePayEnvironment,
  GooglePayMerchantCapability,
  GooglePaySupportedNetwork,
} from './models/GooglePayTypes';

import ApplePayButton from "./components/ApplePayButton";
import {handlePayment} from 'judo-payment-request-api'
import GooglePayButton from "./components/GooglePayButton";

export {
  ApplePayButtonStyle,
  ApplePayButtonType,
  ApplePayMerchantCapability,
  ApplePaySupportedNetwork
}

export {
  GooglePayEnvironment,
  GooglePayMerchantCapability,
  GooglePayButtonType,
  GooglePayButtonStyle,
  GooglePaySupportedNetwork
}

export {
  JudoPaymentResponse,
  JudoPaymentDetails,
  JudoPaymentItem,
  JudoPaymentOptions,
  JudoPaymentShippingOption,
  JudoPaymentCurrencyAmount,
  JudoBillingDetails,
  JudoShippingDetails
}

export default class JudoWebPayments {

  private _defaultAppleNetworks: ApplePaySupportedNetwork[] = [
    ApplePaySupportedNetwork.VISA,
    ApplePaySupportedNetwork.MASTERCARD,
    ApplePaySupportedNetwork.AMEX
  ];

  private _defaultGoogleNetworks: GooglePaySupportedNetwork[] = [
    GooglePaySupportedNetwork.AMEX,
    GooglePaySupportedNetwork.MASTERCARD,
    GooglePaySupportedNetwork.VISA
  ];

  private _apConfiguration: ApplePayConfiguration = {
    merchantIdentifier: '',
    merchantCapabilities: [ApplePayMerchantCapability.SUPPORTS_3DS],
    supportedNetworks: this._defaultAppleNetworks,
    certificate: '',
    key: '',
    style: ApplePayButtonStyle.BLACK,
    type: ApplePayButtonType.PLAIN
  };

  private _gpConfiguration: GooglePayConfiguration = {
    environment: GooglePayEnvironment.TEST,
    merchantIdentifier: '',
    merchantCapabilities: [GooglePayMerchantCapability.PAN_ONLY],
    supportedNetworks: this._defaultGoogleNetworks,
    allowedCountryCodes: undefined,
    type: GooglePayButtonType.SHORT,
    style: GooglePayButtonStyle.BLACK
  };

  private _paymentDetails: JudoPaymentDetails = {
    total: {
      label: 'Total',
      amount: { value: '0.0', currency: 'GBP' }
    }
  };

  private _paymentOptions: JudoPaymentOptions = {
    requestPayerEmail: true,
    requestPayerName: true,
    requestPayerPhone: true,
    requestShipping: false,
    shippingType: undefined
  };

  private _configuration: JudoPayConfiguration = {
    displayName: '',
    domainName: '',
    countryCode: '',
    applePayConfiguration: this._apConfiguration,
    googlePayConfiguration: this._gpConfiguration,
    paymentDetails: this._paymentDetails,
    paymentOptions: this._paymentOptions
  };

  responseHandler: ((paymentResponse: JudoPaymentResponse | null, error: Error | null) => any);

  setApplePayConfiguration(
    merchantIdentifier: string,
    merchantCapabilities: ApplePayMerchantCapability[],
    supportedNetworks: ApplePaySupportedNetwork[] = this._defaultAppleNetworks,
    certificate: string,
    key: string,
    style: ApplePayButtonStyle = ApplePayButtonStyle.BLACK,
    type: ApplePayButtonType = ApplePayButtonType.PLAIN) {

    this._apConfiguration.merchantIdentifier = merchantIdentifier;
    this._apConfiguration.merchantCapabilities = merchantCapabilities;
    this._apConfiguration.supportedNetworks = supportedNetworks;
    this._apConfiguration.certificate = certificate;
    this._apConfiguration.key = key;
    this._apConfiguration.style = style;
    this._apConfiguration.type = type;
  }

  setGooglePayConfiguration(
    environment: GooglePayEnvironment,
    merchantIdentifier: string,
    merchantCapabilities: GooglePayMerchantCapability[],
    supportedNetworks: GooglePaySupportedNetwork[] = this._defaultGoogleNetworks,
    type: GooglePayButtonType,
    style: GooglePayButtonStyle,
    allowedCountryCodes?: string[]
  ) {
    this._gpConfiguration.environment = environment;
    this._gpConfiguration.merchantCapabilities = merchantCapabilities;
    this._gpConfiguration.merchantIdentifier = merchantIdentifier;
    this._gpConfiguration.supportedNetworks = supportedNetworks;
    this._gpConfiguration.allowedCountryCodes = allowedCountryCodes;
    this._gpConfiguration.type = type;
    this._gpConfiguration.style = style;
  }

  setJudoPayConfiguration(
    displayName: string,
    domainName: string,
    countryCode: string) {

    this._configuration.displayName = displayName;
    this._configuration.domainName = domainName;
    this._configuration.countryCode = countryCode;
  }

  setPaymentDetails(items: JudoPaymentItem[]) {
    this._paymentDetails.displayItems = items;
    this.calculateTotal(items);
  }

  setShippingOptions(options: JudoPaymentShippingOption[]) {
    this._paymentDetails.shippingOptions = options;
  }

  setPaymentOptions(options: JudoPaymentOptions) {
    this._configuration.paymentOptions = options
  }

  getApplePayButton = (height: string, language: string) => {
    const clickHandler = () => this.executePaymentRequestAPI(JudoButtonType.APPLE_PAY);
    const configuration = this._configuration;
    return new ApplePayButton(configuration, height, language, clickHandler);
  };

  getGooglePayButton = (height: string) => {
    const googlePay = new GooglePayButton(this._configuration, height, this.responseHandler);
    return googlePay.getGooglePayButton();
  };

  private calculateTotal(displayItems: JudoPaymentItem[]) {

    if (displayItems.length === 0) {

      this._paymentDetails.total = {
        label: "Total",
        amount: { value: '0.0', currency: "GBP" }
      };

      return
    }

    const pendingItems = displayItems.filter((item) => item.pending === true);
    const isPending = pendingItems.length > 0;

    const prices = displayItems.map(item => Number(item.amount.value));

    const total = prices.reduce(function (previousValue, currentValue) {
      return previousValue + currentValue;
    });

    this._paymentDetails.total = {
      label: "Total",
      amount: { value: String(total), currency: displayItems[0].amount.currency },
      pending: isPending
    }
  }

  private executePaymentRequestAPI = (type: JudoButtonType) => {
    handlePayment(type, this._configuration, this.responseHandler)
  }
}
