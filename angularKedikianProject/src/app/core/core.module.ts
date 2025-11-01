import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';
// Importa aquí tus otros componentes

// Define tus rutas (ajusta según tus componentes reales)
const appRoutes: Routes = [
  // Comment out routes until components are created
  // { path: 'dashboard', component: DashboardComponent },
  // { path: 'proyectos', component: ProyectosComponent },
  // { path: 'aridos', component: AridosComponent },
  // { path: 'maquinas', component: MaquinasComponent },
  // { path: 'operarios', component: OperariosComponent },
  // { path: 'pagos', component: PagosComponent },
  // { path: 'informes', component: InformesComponent },
  // { path: 'ajustes', component: AjustesComponent },
  // { path: 'cuenta', component: CuentaComponent },
  // { path: 'ayuda', component: AyudaComponent },
  // { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];

@NgModule({
  declarations: [
    // Declara aquí tus otros componentes
  ],
  imports: [
    BrowserModule,
    CommonModule,
    SidebarComponent,
    RouterModule.forRoot(appRoutes), // Importación del RouterModule con tus rutas
  ],
  exports: [
    SidebarComponent,
    RouterModule,
    // Exporta aquí otros componentes si es necesario
  ],
  providers: [],
})
export class CoreModule {}
