import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GoogleChartsModule } from 'angular-google-charts';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RentVsMortgageComponent } from './pages/rent-vs-mortgage/rent-vs-mortgage.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { TextComponent } from './shared/components/display/text/text.component';
import { MoneyComponent } from './shared/components/display/money/money.component';
import { RootComponent } from './root/root.component';
import { MortgageComponent } from './shared/components/inputs/mortgage/mortgage.component';
import { MaterialModule } from './material-module';
import { CurrencyInputDirective } from './shared/components/inputs/currency-input/currency-input.directive';
import { HelpComponent } from './shared/components/display/help/help.component';
import { ExpandTextComponent } from './shared/components/display/expand-text/expand-text.component';
import { TrackOnBlurDirective } from './shared/analytics/directives/track-on-blur/track-on-blur.directive';
import { TrackOnClickDirective } from './shared/analytics/directives/track-on-click/track-on-click.directive';
import { SelectOnFocusDirective } from './shared/directives/select-on-focus.directive';
import { SummaryTableComponent } from './shared/components/display/summary-table/summary-table.component';
import { RealEstateInvestmentComponent } from './pages/real-estate-investment/real-estate-investment.component';

@NgModule({
  declarations: [
    AppComponent,
    RentVsMortgageComponent,
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
    SelectOnFocusDirective,
    RealEstateInvestmentComponent
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
