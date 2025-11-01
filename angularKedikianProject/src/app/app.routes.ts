import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './modules/login/login.component';
import { MainContentComponent } from './modules/admin/main-content/main-content.component';
import { ProjectGestionComponent } from './modules/admin/project-gestion/project-gestion.component';
import { AuthRoleGuard } from './core/guards/auth-role.guard';
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
    canActivate: [AuthRoleGuard],
    children: [
      // Rutas accesibles para todos los usuarios autenticados
      { path: 'dashboard', component: MainContentComponent },
      
      // Rutas solo para administradores
      { 
        path: 'gestion-proyectos', 
        component: ProjectGestionComponent,
        data: { role: 'administrador' }
      },
      { 
        path: 'gestion-machines', 
        component: MaquinariaComponent,
        data: { role: 'administrador' }
      },
      { 
        path: 'gestion-operarios', 
        component: UsersGestionComponent,
        data: { role: 'administrador' }
      },
      { 
        path: 'gestion-inventario', 
        component: InventarioComponent,
        data: { role: 'administrador' }
      },
      { 
        path: 'balance', 
        component: BalanceComponent,
        data: { role: 'administrador' }
      },
      { 
        path: 'aridos', 
        component: AridosComponent,
        data: { role: 'administrador' }
      },
      { 
        path: 'informes', 
        component: InformesComponent,
        data: { role: 'administrador' }
      },
      { 
        path: 'excel-import', 
        component: ExcelImportComponent,
        data: { role: 'administrador' }
      },
      
      // Rutas para operarios (si las hay en el futuro)
      // { path: 'operario-ruta', component: OperarioComponent, data: { role: 'operario' } },
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
