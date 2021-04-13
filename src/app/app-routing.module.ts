import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RealEstateComponent } from './pages/rent-vs-mortgage/real-estate.component';
import { RootComponent } from './root/root.component';

const routes: Routes = [
  { path: 'rent-vs-mortgage', component: RealEstateComponent },
  { path: '', component: RealEstateComponent, pathMatch: 'full' },
  { path: '**', component: RootComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
