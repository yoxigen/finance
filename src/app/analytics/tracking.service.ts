import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  trackEvent(eventName: string, data?: object) {
    (<any>window).gtag('event', eventName, data);
  }
}
