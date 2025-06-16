import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';
import { MainContentComponent } from './main-content/main-content.component';
import { ProjectGestionComponent } from './project-gestion/project-gestion.component';
import { MaquinariaComponent } from './machines/machines.component';
import { UsersGestionComponent } from './users-gestion/users-gestion.component';
import { InventarioComponent } from './inventario/inventario.component';
import { BalanceComponent } from './balance/balance.component';
import { AridosComponent } from './aridos/aridos.component';
import { InformesComponent } from './informes/informes.component';
import { ExcelImportComponent } from './excel-import/excel-import.component';

export const adminRoutes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: MainContentComponent },
      { path: 'gestion-proyectos', component: ProjectGestionComponent },
      { path: 'gestion-machines', component: MaquinariaComponent },
      { path: 'gestion-operarios', component: UsersGestionComponent },
      { path: 'gestion-inventario', component: InventarioComponent },
      { path: 'balance', component: BalanceComponent },
      { path: 'aridos', component: AridosComponent },
      { path: 'informes', component: InformesComponent },
      { path: 'excel-import', component: ExcelImportComponent },
    ],
  },
];
