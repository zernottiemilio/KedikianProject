import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-container">
      <app-sidebar></app-sidebar>
      <div class="content-area">
        <app-header></app-header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      header {
        height: 60px;
        background-color: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        padding: 0 1rem;
        position: fixed;
        top: 0;
        right: 0;
        left: 0;
        z-index: 90;
      }

      .menu-toggle {
        display: none;
        margin-right: 1rem;
        cursor: pointer;
        padding: 0.5rem;
      }

      .menu-icon {
        font-size: 1.5rem;
      }

      .header-title {
        flex: 1;
      }

      .header-title h2 {
        margin: 0;
        font-size: 1.25rem;
      }

      .header-actions {
        display: flex;
        align-items: center;
      }

      .user-profile {
        cursor: pointer;
        padding: 0.5rem;
      }
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
        .header {
          left: 250px; /* Ancho del sidebar */
        }
      }

      /* Estilos para pantallas medianas y pequeñas (tablets y móviles) */
      @media (max-width: 991px) {
        .header {
          left: 0;
        }

        .menu-toggle {
          display: block;
        }
      }
    `,
  ],
})
export class AdminLayoutComponent {}
//   </div>
