import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CalcTextType } from '../text/text.component';

@Component({
  selector: 'calc-money',
  template: `
    <calc-text type="{{type}}">{{amount | currency:'ILS':'symbol':'0.0-0'}}</calc-text>
  `,
  styles: [
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoneyComponent {
  @Input() type:CalcTextType;
  @Input() amount:number;
}
