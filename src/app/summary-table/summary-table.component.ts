import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CalcTextType } from '../text/text.component';

export interface SummaryItem {
  title: string,
  description?: string,
  value: number,
  valueType?: CalcTextType,
  isHighlight?: boolean
}

@Component({
  selector: 'calc-summary-table',
  templateUrl: './summary-table.component.html',
  styleUrls: ['./summary-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryTableComponent {
  @Input() items:SummaryItem[];

  columns = ['title', 'value'];
}
