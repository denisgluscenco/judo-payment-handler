export enum GooglePayButtonStyle {
  BLACK = "black",
  WHITE = "white"
}

export enum GooglePayButtonType {
  SHORT = "short",
  LONG = "long"
}

export enum GooglePayEnvironment {
  TEST = 'TEST',
  PRODUCTION = 'PRODUCTION'
}

export enum GooglePayMerchantCapability {
  CRYPTOGRAM_3DS = 'CRYPTOGRAM_3DS',
  PAN_ONLY = 'PAN_ONLY'
}

export enum GooglePaySupportedNetwork {
  AMEX = "AMEX",
  DISCOVER = "DISCOVER",
  INTERAC = "INTERAC",
  JCB = 'JCB',
  MASTERCARD = "MASTERCARD",
  VISA = "VISA"
}

export enum GooglePayCallbackIntent {
  PAYMENT_AUTHORIZATION = 'PAYMENT_AUTHORIZATION',
  SHIPPING_ADDRESS = 'SHIPPING_ADDRESS',
  SHIPPING_OPTION = 'SHIPPING_OPTION'
}

export interface GooglePayConfiguration {
  environment: GooglePayEnvironment,
  merchantIdentifier: string,
  merchantCapabilities: GooglePayMerchantCapability[],
  supportedNetworks: GooglePaySupportedNetwork[],
  allowedCountryCodes: string[] | undefined,
  type: GooglePayButtonType,
  style: GooglePayButtonStyle
}
