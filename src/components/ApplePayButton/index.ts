import {JudoPayConfiguration} from '../../models/JudoPayTypes';
import {canMakeApplePayPayments} from 'judo-payment-request-api';

import classes from './ApplePayButton.css'

interface ApplePay {
  configuration: JudoPayConfiguration,
  height: string,
  language: string,
  clickHandler: () => void
}

export default class ApplePayImpl implements ApplePay {

  configuration: JudoPayConfiguration;
  height: string;
  language: string;
  clickHandler: () => void;

  canUseApplePay = false;
  classNames: String[];

  constructor(
    configuration: JudoPayConfiguration,
    language: string,
    height: string,
    clickHandler: () => void
  ) {

    this.configuration = configuration;
    this.language = language;
    this.height = height;
    this.clickHandler = clickHandler;

    this.classNames = [
      classes.ApplePayButton,
      classes[configuration.applePayConfiguration.style],
      classes[configuration.applePayConfiguration.type]
    ];
  }

  getApplePayButton = (): Promise<HTMLElement> => {

    return new Promise<HTMLElement>(resolve => {
      canMakeApplePayPayments()
        .then((result: boolean) => {

          if (result) {

            const applePayButton: HTMLElement | null = document.createElement("button");
            applePayButton.className = this.classNames.join(' ');
            applePayButton.style.width = `100%`;
            applePayButton.style.height = `${this.height}`;
            applePayButton.lang = this.language;
            applePayButton.onclick = this.clickHandler;

            resolve(applePayButton);
          }
        })
        .catch((error: Error) => {
          console.log(error.message);
        });
    })
  }
}
