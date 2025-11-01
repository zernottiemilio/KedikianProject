import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaquinariaComponent } from './machines/machines.component';

@NgModule({
  declarations: [
    MaquinariaComponent
  ],
  imports: [
    CommonModule,
    NgModule
  ],
  exports: [
    MaquinariaComponent
  ]
})
export class AdminModule { }
