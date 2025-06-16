import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './modules/login/login.component';
import { MainContentComponent } from './modules/admin/main-content/main-content.component';
import { ProjectGestionComponent } from './modules/admin/project-gestion/project-gestion.component';
import { AuthGuard } from './core/guards/auth.guards';
import { AdminLayoutComponent } from './modules/admin/admin-layout.component';
import { MaquinariaComponent } from './modules/admin/machines/machines.component';
import { UsersGestionComponent } from './modules/admin/users-gestion/users-gestion.component';
import { InventarioComponent } from './modules/admin/inventario/inventario.component';
import { BalanceComponent } from './modules/admin/balance/balance.component';
import { IngresoComponent } from './modules/admin/balance/ingreso/ingreso.component';
import { EgresoComponent } from './modules/admin/balance/egreso/egreso.component';
import { AridosComponent } from './modules/admin/aridos/aridos.component';
import { InformesComponent } from './modules/admin/informes/informes.component';
import { ExcelImportComponent } from './modules/admin/excel-import/excel-import.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AdminLayoutComponent, // Usa el layout para todas las rutas protegidas
    canActivate: [AuthGuard],
    children: [
      // Rutas hijas que se mostrarán dentro del router-outlet del layout
      { path: 'dashboard', component: MainContentComponent },
      { path: 'gestion-proyectos', component: ProjectGestionComponent },
      { path: 'gestion-machines', component: MaquinariaComponent },
      { path: 'gestion-operarios', component: UsersGestionComponent },
      { path: 'gestion-inventario', component: InventarioComponent },
      { path: 'balance', component: BalanceComponent },
      { path: 'aridos', component: AridosComponent },
      { path: 'informes', component: InformesComponent },
      { path: 'excel-import', component: ExcelImportComponent },
      // Otras rutas protegidas que deberían usar el layout admin
    ],
  },
  // Ruta comodín para manejar rutas no encontradas
  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
