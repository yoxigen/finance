import { Directive, Input, HostListener } from '@angular/core';
import { TrackingService } from '../../tracking.service';

@Directive({
  selector: '[calcTrackOnBlur]'
})
export class TrackOnBlurDirective {
  private _previousValue: string;

  constructor(private trackingService: TrackingService) {}

  @Input('calcTrackOnBlur') trackInputType: 'currency' | 'number' = 'number';

  @HostListener('focus', ['$event']) onFocus($event){
    this._previousValue = $event.target.value;
  }

  @HostListener('blur', ['$event']) onBlur($event){
    const isCurrency = this.trackInputType === 'currency';
    const eventName = isCurrency ? 'currency_change' : 'number_input_change';
    const input_name = $event.target.name;

    if (!input_name) {
      throw new Error("Can't track event, missing input_name.");
    }

    const rawValue = $event.target.value;
    if (rawValue !== this._previousValue) {
      const value = $event.target.getAttribute("type") === 'number' ? parseFloat(rawValue) : rawValue;
      this.trackingService.trackEvent(eventName, { 
        input_name,
        [isCurrency ? 'currency_value' : 'value']: value
      });
    }
  }
}
