import { Directive, Input, HostListener } from '@angular/core';
import { TrackingService } from '../../tracking.service';

@Directive({
  selector: '[calcTrackOnBlur]'
})
export class TrackOnBlurDirective {
  private _previousValue: string;

  constructor(private trackingService: TrackingService) {}

  @Input('calcTrackOnBlur') trackEventName: string;
  
  @HostListener('focus', ['$event']) onFocus($event){
    this._previousValue = $event.target.value;
  }

  @HostListener('blur', ['$event']) onBlur($event){
    const eventName = this.trackEventName || $event.target.name;

    if (!eventName) {
      throw new Error("Can't track event, missing event name.");
    }

    const rawValue = $event.target.value;
    if (rawValue !== this._previousValue) {
      const value = $event.target.getAttribute("type") === 'number' ? parseFloat(rawValue) : rawValue;
      this.trackingService.trackEvent(eventName, { value });
    }
  }
}
