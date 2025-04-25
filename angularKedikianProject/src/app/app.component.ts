import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { MainContentComponent } from './modules/admin/main-content/main-content.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { ProjectGestionComponent } from './modules/admin/project-gestion/project-gestion.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    SidebarComponent,
    RouterLink,
    MainContentComponent,
    HeaderComponent,
    ProjectGestionComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'kedikianProject';
}
