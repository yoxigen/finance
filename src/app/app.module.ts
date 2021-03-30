import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GoogleChartsModule } from 'angular-google-charts';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RealEstateComponent } from './real-estate/real-estate.component';
import { MatSliderModule } from '@angular/material/slider';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatExpansionModule} from '@angular/material/expansion';
import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import {NgxMaterialToolsModule} from 'ngx-material-tools';
import {MatTableModule} from '@angular/material/table';
import { TextComponent } from './text/text.component';
import { MoneyComponent } from './money/money.component';
import { SummaryTableComponent } from './summary-table/summary-table.component';
import { RootComponent } from './root/root.component';
import { MortgageComponent } from './mortgage/mortgage.component';

@NgModule({
  declarations: [
    AppComponent,
    RealEstateComponent,
    TextComponent,
    MoneyComponent,
    SummaryTableComponent,
    RootComponent,
    MortgageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSliderModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,    
    MatToolbarModule,
    MatExpansionModule,
    NgxMaterialToolsModule,
    MatTableModule,
    GoogleChartsModule,
    MatTooltipModule
  ],
  providers: [
    {provide: DEFAULT_CURRENCY_CODE, useValue: 'ILS'}
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
