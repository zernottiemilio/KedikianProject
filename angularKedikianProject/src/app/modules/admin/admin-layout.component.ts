import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="app-container">
      <app-sidebar></app-sidebar>
      <div class="content-area">
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      @media (min-width: 1264px) {
        .content-area {
          margin-left: 250px; /* Ancho del sidebar */
          width: calc(100% - 250px);
        }

        .main-content {
          padding: 2.5rem;
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
        }
      }

      @media (min-width: 1920px) {
        .content-area {
          margin-left: 250px; /* Ancho del sidebar */
          width: calc(100% - 250px);
        }

        .main-content {
          padding: 2.5rem;
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
        }
      }

      /* Estilos para pantallas grandes (desktop) */
      @media (min-width: 992px) {
        .content-area {
          margin-left: 250px;
        }
      }

      /* Estilos para pantallas medianas y pequeñas (tablets y móviles) */
      @media (max-width: 991px) {
        .content-area {
          margin-left: 0;
        }
      }
    `,
  ],
})
export class AdminLayoutComponent {}
//   </div>
