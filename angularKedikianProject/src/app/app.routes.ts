import { Routes } from '@angular/router';
import { MainContentComponent } from './modules/admin/main-content/main-content.component';
import { ProjectGestionComponent } from './modules/admin/project-gestion/project-gestion.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { MaquinariaComponent } from './modules/admin/machines/machines.component';
import { UsersGestionComponent } from './modules/admin/users-gestion/users-gestion.component';
import { InventarioComponent } from './modules/admin/inventario/inventario.component';
import { BalanceComponent } from './modules/admin/balance/balance.component';
import { IngresoComponent } from './modules/admin/balance/ingreso/ingreso.component';
import { EgresoComponent } from './modules/admin/balance/egreso/egreso.component';
import { AridosComponent } from './modules/admin/aridos/aridos.component';

export const routes: Routes = [
  { path: 'dashboard', component: MainContentComponent },
  { path: 'gestion-proyectos', component: ProjectGestionComponent },
  { path: 'gestion-machines', component: MaquinariaComponent },
  { path: 'gestion-operarios', component: UsersGestionComponent },
  { path: 'gestion-inventario', component: InventarioComponent },
  { path: 'balance', component: BalanceComponent },
  { path: 'aridos', component: AridosComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  // Ruta comodín para manejar rutas no encontradas
];
