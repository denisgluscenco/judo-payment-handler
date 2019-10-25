import { ApplePayConfiguration } from './ApplePayTypes'
import { GooglePayConfiguration } from './GooglePayTypes';

export enum JudoButtonType {
  APPLE_PAY = 'applePay',
  NONE = 'none'
}

export interface JudoPaymentItem {
  label: string,
  description?: string,
  amount: JudoPaymentCurrencyAmount,
  pending?: boolean
}

export interface JudoBillingDetails {
  name?: string,
  email?: string,
  phone?: string
}

export interface JudoShippingDetails {
  addressLine?: string[],
  administrativeArea?: string,
  city?: string,
  country?: string,
  countryCode?: string,
  locality?: string,
  dependentLocality?: string,
  languageCode?: string,
  organization?: string,
  name?: string,
  phone?: string,
  postalCode?: string,
  recipient?: string,
  region?: string,
  sortingCode?: string
}

export interface JudoPaymentResponse {
  googleApiVersion?: number,
  googleApiMinor?: number,
  paymentDetails: any,
  billingDetails?: JudoBillingDetails,
  shippingDetails?: JudoShippingDetails,
  shippingOptionSelected?: string
}

export interface JudoPaymentCurrencyAmount {
  value: string,
  currency: string,
}

export interface JudoPaymentShippingOption {
  id: string,
  label: string,
  description?: string,
  amount: JudoPaymentCurrencyAmount,
  selected: boolean
}

export interface JudoPaymentDetails {
  total: JudoPaymentItem,
  displayItems?: JudoPaymentItem[];
  modifiers?: PaymentDetailsModifier[];
  shippingOptions?: JudoPaymentShippingOption[];
}

export enum JudoShippingType {
  SHIPPING = 'shipping',
  DELIVERY = 'delivery',
  PICKUP = 'pickup'
}

export interface JudoPaymentOptions {
  requestPayerEmail?: boolean;
  requestPayerName?: boolean;
  requestPayerPhone?: boolean;
  requestShipping?: boolean;
  shippingType?: string;
}

export interface JudoPayConfiguration {
  displayName: string,
  domainName: string,
  countryCode: string,
  applePayConfiguration: ApplePayConfiguration,
  googlePayConfiguration: GooglePayConfiguration,
  paymentDetails: JudoPaymentDetails,
  paymentOptions: JudoPaymentOptions
}
