import { Directive, Input, HostListener } from '@angular/core';
import { TrackingService } from '../../tracking.service';

@Directive({
  selector: '[calcTrackOnClick]'
})
export class TrackOnClickDirective {
  constructor(private trackingService: TrackingService) {}

  @Input('calcTrackOnClick') trackElement: string;
  @Input() trackEventName: string;

  @HostListener('click', ['$event']) onClick($event){
    if (!this.trackElement) {
      throw new Error("Can't track click event, missing event name.");
    }

    this.trackingService.trackEvent(this.trackEventName || 'click', { element: this.trackElement });
  }
}
