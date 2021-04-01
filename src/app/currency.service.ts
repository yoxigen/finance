import { getCurrencySymbol } from '@angular/common';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {

  constructor() { }

  get currencySymbol(): string {
    return getCurrencySymbol('ILS', 'wide');
  }
}
