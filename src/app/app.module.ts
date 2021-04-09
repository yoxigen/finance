import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GoogleChartsModule } from 'angular-google-charts';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RealEstateComponent } from './real-estate/real-estate.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { TextComponent } from './text/text.component';
import { MoneyComponent } from './money/money.component';
import { SummaryTableComponent } from './summary-table/summary-table.component';
import { RootComponent } from './root/root.component';
import { MortgageComponent } from './mortgage/mortgage.component';
import { MaterialModule } from './material-module';
import { CurrencyInputDirective } from './inputs/currency-input/currency-input.directive';
import { HelpComponent } from './help/help.component';
import { ExpandTextComponent } from './expand-text/expand-text.component';
import { TrackOnBlurDirective } from './analytics/directives/track-on-blur/track-on-blur.directive';
import { TrackOnClickDirective } from './analytics/directives/track-on-click/track-on-click.directive';
import { SelectOnFocusDirective } from './shared/select-on-focus.directive';

@NgModule({
  declarations: [
    AppComponent,
    RealEstateComponent,
    TextComponent,
    MoneyComponent,
    SummaryTableComponent,
    RootComponent,
    MortgageComponent,
    CurrencyInputDirective,
    HelpComponent,
    ExpandTextComponent,
    TrackOnBlurDirective,
    TrackOnClickDirective,
    SelectOnFocusDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    GoogleChartsModule,
  ],
  providers: [
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'ILS' }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
