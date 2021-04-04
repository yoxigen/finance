import { Component, Input } from '@angular/core';

@Component({
  selector: 'calc-expand-text',
  templateUrl: './expand-text.component.html',
  styleUrls: ['./expand-text.component.scss']
})
export class ExpandTextComponent {
  @Input() label: string;
  @Input() text: string;

  isExpanded = false;
}
