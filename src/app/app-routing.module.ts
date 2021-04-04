import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RealEstateComponent } from './real-estate/real-estate.component';
import { RootComponent } from './root/root.component';

const routes: Routes = [
  { path: 'rent-vs-ownership', component: RealEstateComponent },
  { path: '**', component: RootComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
