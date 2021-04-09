import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[calcSelectOnFocus]'
})
export class SelectOnFocusDirective {

  @HostListener('focus', ['$event']) onClick($event){
    $event.target.select();
  }

}
