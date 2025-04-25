import { Routes } from '@angular/router';
import { MainContentComponent } from './modules/admin/main-content/main-content.component';
import { MachineHoursComponent } from './modules/admin/machine-hours/machine-hours.component';
import { ProjectGestionComponent } from './modules/admin/project-gestion/project-gestion.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

export const routes: Routes = [
  { path: 'dashboard', component: MainContentComponent },
  { path: 'gestion-maquinas', component: MachineHoursComponent },
  { path: 'gestion-proyectos', component: ProjectGestionComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  // Ruta comodín para manejar rutas no encontradas
];
