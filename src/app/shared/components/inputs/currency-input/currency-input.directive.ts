import { formatCurrency } from '@angular/common';
import { Directive, EventEmitter, Inject, LOCALE_ID, Output, DEFAULT_CURRENCY_CODE } from '@angular/core';
import {NgControl} from '@angular/forms';
import { CurrencyService } from 'src/app/shared/services/currency.service';

@Directive({
  selector: '[calcCurrencyInput]',
  host: {
    '(ngModelChange)': 'onInputChange($event)',
    '(keydown.backspace)':'onInputChange($event.target.value, true)'
  }
})
export class CurrencyInputDirective {

  constructor(
    public model: NgControl, 
    @Inject(LOCALE_ID) public locale: string,
    @Inject(DEFAULT_CURRENCY_CODE) private defaultCurrencyCode: string = 'USD',
    private currencyService: CurrencyService
    ) {}

  @Output() rawChange:EventEmitter<number> = new EventEmitter<number>();

  onInputChange(value: string, backspace?: boolean) {
    if (!value) {
      this.rawChange.emit(0);
    }
    else {
      let displayValue = value.replace(/[^\d\.]/g, '');
      let newValue: number;

      if (backspace) {
        displayValue = displayValue.slice(0, -1)
      }

      if(displayValue.length == 0) {
        displayValue = '';
        newValue = null;
      }
      else  {
        newValue = parseFloat(displayValue);
        displayValue = formatCurrency(newValue, this.locale, this.currencyService.currencySymbol, this.defaultCurrencyCode, '0.0-0');
      }

      this.model.valueAccessor.writeValue(displayValue);
      this.rawChange.emit(newValue)
    }
  }
}
