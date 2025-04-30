import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaquinariaComponent } from './machines/machines.component';

@NgModule({
  declarations: [MaquinariaComponent],
  imports: [CommonModule, NgModule],
  exports: [MaquinariaComponent], // Exportar si se usa en otros módulos
})
export class AdminModule {}
