import { Injectable } from '@angular/core';

export interface TrackEventParams {
  [x: string]: any 
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  trackEvent(event: string, eventParams: TrackEventParams) {
    (<any>window).dataLayer.push({event, ...eventParams});
  }
}
