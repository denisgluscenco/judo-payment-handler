import {
  JudoBillingDetails,
  JudoPayConfiguration,
  JudoPaymentDetails,
  JudoPaymentResponse,
  JudoPaymentShippingOption,
  JudoShippingDetails
} from '../../models/JudoPayTypes';

import {GooglePayCallbackIntent} from '../../models/GooglePayTypes';

interface GooglePay {
  configuration: JudoPayConfiguration,
  height: string,
  responseHandler: ((paymentResponse: JudoPaymentResponse | null, error: Error | null) => any)
}

export default class GooglePayImpl implements GooglePay {

  configuration: JudoPayConfiguration;
  height: string;
  responseHandler: ((paymentResponse: JudoPaymentResponse | null, error: Error | null) => any);

  paymentsClient: google.payments.api.PaymentsClient;
  paymentMethod: google.payments.api.PaymentMethod;

  constructor(
    configuration: JudoPayConfiguration,
    height: string,
    responseHandler: ((paymentResponse: JudoPaymentResponse | null, error: Error | null) => any)
  ) {
    this.configuration = configuration;
    this.height = height;
    this.responseHandler = responseHandler;
  }

  getGooglePayButton = (): Promise<HTMLElement> => {
    return new Promise<HTMLElement>((resolve) => {
      this.loadGoogleScript()
        .then((didLoad) => {
          if (didLoad) {
            this.setPaymentsClient();
            this.setGooglePayConfigs();
            this.shouldRenderGooglePayButton()
              .then((shouldRender) => {
                if (shouldRender) {
                  const googlePayButton = this.createGooglePayButton();
                  resolve(googlePayButton);
                }
              });
          }
        })
    })
  };

  private loadGoogleScript = (): Promise<Boolean> => {
    return new Promise<Boolean>((resolve) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://pay.google.com/gp/p/js/pay.js';
      script.onload = () => resolve(true);
      script.async = true;
      document.body.appendChild(script);
    })
  };

  private setPaymentsClient = () => {
    const paymentOptions: google.payments.api.PaymentOptions = {
      environment: this.configuration.googlePayConfiguration.environment,
      merchantInfo: {
        merchantName: this.configuration.displayName,
        merchantId: this.configuration.googlePayConfiguration.merchantIdentifier
      },
      paymentDataCallbacks: {
        onPaymentAuthorized: this.onPaymentAuthorized,
        onPaymentDataChanged: this.shouldRequestShippingOptions()
          ? this.onPaymentDataChanged
          : null
      }
    };
    this.paymentsClient = new google.payments.api.PaymentsClient(paymentOptions);
  };

  private onPaymentAuthorized = (paymentData: any) => {
    return new Promise((resolve) => {
      console.log(paymentData);
      resolve({transactionState: 'SUCCESS'});
    })
  };

  private onPaymentDataChanged = (paymentData: any) => {
    return new Promise((resolve) => {
      if (paymentData.callbackTrigger == 'SHIPPING_OPTION') {
        const newPaymentData = this.calculateNewPaymentDetails(paymentData);
        resolve(newPaymentData);
        return;
      }
      resolve({});
    })
  };

  private calculateNewPaymentDetails = (paymentData: any) => {
    const paymentDetails = this.configuration.paymentDetails;
    if (!paymentDetails.shippingOptions) {
      return undefined
    }
    const selectedShippingOption = paymentDetails.shippingOptions.filter((option) => {
      return option.id === paymentData.shippingOptionData.id;
    }).shift();
    if (!selectedShippingOption) {
      return undefined
    }
    const total = Number(paymentDetails.total.amount.value) + Number(selectedShippingOption.amount.value);
    return {
      newTransactionInfo: {
        totalPriceStatus: paymentDetails.total.pending ? 'ESTIMATED' : 'FINAL',
        totalPrice: String(total),
        totalPriceLabel: paymentDetails.total.label,
        currencyCode: paymentDetails.total.amount.currency
      }
    }
  };

  private setGooglePayConfigs = () => {
    if (this.paymentsClient) {
      const judoConfig = this.configuration;
      const googleConfig = judoConfig.googlePayConfiguration;

      const allowedCardNetworks: google.payments.api.AllowedCardNetwork[] = googleConfig.supportedNetworks.map((network) => {
        return network as google.payments.api.AllowedCardNetwork;
      });
      const allowedCardAuthMethods: google.payments.api.AllowedAuthMethod[] = googleConfig.merchantCapabilities;

      this.paymentMethod = {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: allowedCardAuthMethods,
          allowedCardNetworks: allowedCardNetworks
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            'gateway': 'judopay',
            'gatewayMerchantId': googleConfig.merchantIdentifier
          }
        }
      };
    }
  };

  private shouldRenderGooglePayButton = (): Promise<Boolean> => {

    return new Promise<Boolean>((resolve) => {
      const isReadyToPayRequest: google.payments.api.IsReadyToPayRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [this.paymentMethod]
      };

      this.paymentsClient.isReadyToPay(isReadyToPayRequest)
        .then((response: google.payments.api.IsReadyToPayResponse) => {
          resolve(response.result)
        })
        .catch((error: Error) => {
          this.responseHandler(null, error);
        });
    })
  };

  private createGooglePayButton = (): HTMLElement => {
    const googlePayButton = this.paymentsClient.createButton({
      buttonColor: this.configuration.googlePayConfiguration.style,
      buttonType: this.configuration.googlePayConfiguration.type,
      onClick: this.handleGooglePayment
    });

    const innerButton = googlePayButton.getElementsByTagName('button');
    innerButton[0].style.width = '100%';

    return googlePayButton;
  };

  private handleGooglePayment = () => {

    const googlePayConfig = this.configuration.googlePayConfiguration;

    const calculateTotalAmount = (paymentDetails: JudoPaymentDetails) => {

      if (!paymentDetails.shippingOptions) {
        return paymentDetails.total.amount.value;
      }

      const selectedShippingOption = paymentDetails.shippingOptions.filter((option: JudoPaymentShippingOption) => {
        return option.selected
      }).shift();

      if (!selectedShippingOption) {
        return paymentDetails.total.amount.value;
      }

      const total = Number(paymentDetails.total.amount.value) + Number(selectedShippingOption.amount.value);
      return String(total)
    };

    const paymentDataRequest: google.payments.api.PaymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [this.paymentMethod],
      merchantInfo: {
        merchantId: googlePayConfig.merchantIdentifier,
        merchantName: this.configuration.displayName,
        merchantOrigin: this.configuration.domainName
      },
      transactionInfo: {
        totalPriceStatus: this.configuration.paymentDetails.total.pending ? 'ESTIMATED' : 'FINAL',
        totalPrice: calculateTotalAmount(this.configuration.paymentDetails),
        currencyCode: this.configuration.paymentDetails.total.amount.currency
      },
    };

    const isShippingRequired = this.configuration.paymentOptions.requestShipping;
    paymentDataRequest.emailRequired = (this.configuration.paymentOptions.requestPayerEmail);
    paymentDataRequest.shippingAddressRequired = isShippingRequired;
    paymentDataRequest.shippingAddressParameters = this.getShippingParameters();

    const callbackIntents: GooglePayCallbackIntent[] = [GooglePayCallbackIntent.PAYMENT_AUTHORIZATION];

    const shippingRequiredProp = this.configuration.paymentOptions.requestShipping;
    const shippingOptions = this.configuration.paymentDetails.shippingOptions;

    if (shippingRequiredProp && shippingOptions) {
      callbackIntents.push(GooglePayCallbackIntent.SHIPPING_ADDRESS);
      callbackIntents.push(GooglePayCallbackIntent.SHIPPING_OPTION);
    }

    if (this.shouldRequestShippingOptions() === true) {
      paymentDataRequest['shippingOptionRequired'] = this.shouldRequestShippingOptions();
      paymentDataRequest['shippingOptionParameters'] = this.getShippingOptionParameters();
    }

    paymentDataRequest['callbackIntents'] = callbackIntents;

    this.loadPaymentData(paymentDataRequest);
  };

  private shouldRequestShippingOptions = () => {
    const shippingOptions = this.configuration.paymentDetails.shippingOptions;
    const areShippingOptionPresent = (shippingOptions !== undefined && shippingOptions.length > 0);
    return areShippingOptionPresent && (this.configuration.paymentOptions.requestShipping)
  };

  private getShippingOptionParameters = () => {
    if (this.configuration.paymentDetails.shippingOptions) {

      const shippingOptions = this.configuration.paymentDetails.shippingOptions.map((option) => {

        const currencySymbol = Number().toLocaleString(undefined, {
          style: "currency",
          currency: option.amount.currency
        }).slice(0, 1);

        return {
          id: option.id,
          label: `${currencySymbol}${option.amount.value}: ${option.label}`,
          description: option.description
        }
      });

      const defaultOption = this.configuration.paymentDetails.shippingOptions.filter(option => {
        return option.selected
      }).shift();

      if (defaultOption) {
        return {
          defaultSelectedOptionId: defaultOption.id,
          shippingOptions: shippingOptions
        };
      }

      return undefined;
    }
    return undefined;
  };

  private getShippingParameters = () => {
    return {
      allowedCountryCodes: this.configuration.googlePayConfiguration.allowedCountryCodes,
      phoneNumberRequired: this.configuration.paymentOptions.requestPayerPhone
    }
  };

  private loadPaymentData = (paymentDataRequest: google.payments.api.PaymentDataRequest) => {

    this.paymentsClient.loadPaymentData(paymentDataRequest)
      .then((paymentData: google.payments.api.PaymentData) => {

        const paymentResponse: JudoPaymentResponse = {
          googleApiVersion: paymentData.apiVersion,
          googleApiMinor: paymentData.apiVersionMinor,
          paymentDetails: paymentData.paymentMethodData,
          billingDetails: this.getBillingDetails(paymentData),
          shippingDetails: this.getShippingDetails(paymentData),
          shippingOptionSelected: this.getSelectedShippingOption(paymentData)
        };

        this.responseHandler(paymentResponse, null);
      })
      .catch((error: Error) => {
        this.responseHandler(null, error);
      })
  };

  private getSelectedShippingOption = (paymentData: google.payments.api.PaymentData) => {
    if (paymentData.shippingOptionData) {
      return paymentData.shippingOptionData.id;
    }
    return undefined;
  };

  private getBillingDetails = (paymentData: google.payments.api.PaymentData) => {
    const judoBillingDetails: JudoBillingDetails = {
      email: paymentData.email
    };
    return judoBillingDetails;
  };

  private getShippingDetails = (paymentData: google.payments.api.PaymentData) => {

    if (paymentData.shippingAddress) {
      const shippingDetails: JudoShippingDetails = {
        addressLine: [
          paymentData.shippingAddress.address1,
          paymentData.shippingAddress.address2,
          paymentData.shippingAddress.address3
        ],
        administrativeArea: paymentData.shippingAddress.administrativeArea,
        countryCode: paymentData.shippingAddress.countryCode,
        locality: paymentData.shippingAddress.locality,
        postalCode: paymentData.shippingAddress.postalCode,
        name: paymentData.shippingAddress.name,
        phone: paymentData.shippingAddress.phoneNumber,
        sortingCode: paymentData.shippingAddress.sortingCode
      };
      return shippingDetails;
    }
    return undefined
  }
}
