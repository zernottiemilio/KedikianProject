import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { InventarioComponent } from './inventario.component';

const routes: Routes = [
  {
    path: '',
    component: InventarioComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    InventarioComponent,
  ],
})
export class InventarioModule {}
