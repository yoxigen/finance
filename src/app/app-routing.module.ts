import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RealEstateInvestmentComponent } from './pages/real-estate-investment/real-estate-investment.component';
import { RentVsMortgageComponent } from './pages/rent-vs-mortgage/rent-vs-mortgage.component';
import { RootComponent } from './root/root.component';

const routes: Routes = [
  { path: 'rent-vs-mortgage', component: RentVsMortgageComponent },
  { path: 'real-estate-investment', component: RealEstateInvestmentComponent },
  { path: '', redirectTo: 'rent-vs-mortgage', pathMatch: 'full' },
  { path: '**', component: RootComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
