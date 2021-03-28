import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export enum CalcTextType {
  good = 'good',
  bad = 'bad'
}
@Component({
  selector: 'calc-text',
  template: `
    <span class={{type}}><ng-content></ng-content></span>
  `,
  styles: [
    '.good, .bad { font-weight: bold }',
    '.good { color: green }',
    '.bad { color: red }'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextComponent {
  @Input() type: CalcTextType
}
