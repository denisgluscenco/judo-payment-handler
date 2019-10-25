export enum ApplePayButtonStyle {
  BLACK = "ApplePayButtonBlack",
  WHITE = "ApplePayButtonWhite",
  WHITE_WITH_LINE = "ApplePayButtonWhiteWithLine",
}

export enum ApplePayButtonType {
  PLAIN = "ApplePayButtonPlain",
  BUY = "ApplePayButtonBuy",
  DONATE = "ApplePayButtonDonate",
  CHECKOUT = "ApplePayButtonCheckout",
  BOOK = "ApplePayButtonBook",
  SETUP = "ApplePayButtonSetup",
  SUBSCRIBE = "ApplePayButtonSubscribe"
}

export enum ApplePaySupportedNetwork {
  AMEX = "amex",
  CHINA_UNION_PAY = "chinaUnionPay",
  DISCOVER = "discover",
  INTERAC = "interac",
  MASTERCARD = "masterCard",
  PRIVATE_LABEL = "privateLabel",
  VISA = "visa"
}

export enum ApplePayMerchantCapability {
  SUPPORTS_3DS = 'supports3DS',
  SUPPORTS_CREDIT = 'supportsCredit',
}

export interface ApplePayConfiguration {
  merchantIdentifier: string,
  merchantCapabilities: ApplePayMerchantCapability[],
  supportedNetworks: ApplePaySupportedNetwork[],
  certificate: string,
  key: string,
  style: ApplePayButtonStyle,
  type: ApplePayButtonType,
}
