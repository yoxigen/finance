import { Component, Inject, LOCALE_ID } from '@angular/core';
import { TrackingService } from './shared/analytics/tracking.service';

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

  constructor(@Inject(LOCALE_ID) public locale: string, private trackingService: TrackingService) {}

  get direction(): string {
    return RTL_LOCALES.includes(this.locale) ? 'rtl' : 'ltr';
  }

  async share() {
    await navigator.share({
      url: document.location.href,
      title: document.title
    });

    this.trackingService.trackEvent('share', { content_id: document.title, content_type: 'page' })
  }

  getLocaleHref(language: Language) {
    const baseHrefLangRegExp = new RegExp(`/${this.locale}/$`);
    return `${document.baseURI.replace(baseHrefLangRegExp, '/' + language.locale)}`
  }

  onLanguageSelect({locale}: Language) {
    this.trackingService.trackEvent('language_change', { label: locale })
  }
}
