import { getCurrencySymbol } from '@angular/common';
import { DEFAULT_CURRENCY_CODE, Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {

  constructor(@Inject(DEFAULT_CURRENCY_CODE) private defaultCurrencyCode: string = 'USD') { }

  get currencySymbol(): string {
    return getCurrencySymbol(this.defaultCurrencyCode, 'wide');
  }
}
