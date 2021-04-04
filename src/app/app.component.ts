import { Component, Inject, LOCALE_ID } from '@angular/core';

const RTL_LOCALES = ["he", "ar"];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'calc';

  constructor(@Inject(LOCALE_ID) public locale: string) {}

  get direction(): string {
    return RTL_LOCALES.includes(this.locale) ? 'rtl' : 'ltr';
  }
}
