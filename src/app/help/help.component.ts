import { Component, Input } from '@angular/core';

@Component({
  selector: 'calc-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent {
  @Input() text: string;
  
  isOpen = false;
}
