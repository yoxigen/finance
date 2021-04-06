import { Component, Inject, LOCALE_ID } from '@angular/core';

const RTL_LOCALES = ["he", "ar"];

interface Language {
  locale: string,
  name: string
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'calc';
  languages: Language[] = [
    { locale: 'en-US', name: 'English' },
    { locale: 'he', name: 'עברית' }
  ];

  constructor(@Inject(LOCALE_ID) public locale: string) {}

  get direction(): string {
    return RTL_LOCALES.includes(this.locale) ? 'rtl' : 'ltr';
  }

  async share() {
    await navigator.share({
      url: document.location.href,
      title: document.title
    });
  }

  getLocaleHref(language: Language) {
    const baseHrefLangRegExp = new RegExp(`/${this.locale}/$`);
    return `${document.baseURI.replace(baseHrefLangRegExp, '/' + language.locale)}`
  }
}
