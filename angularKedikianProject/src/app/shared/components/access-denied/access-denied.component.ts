import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="access-denied-container">
      <div class="access-denied-card">
        <div class="icon-container">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h2>Acceso Denegado</h2>
        <p>{{ message || 'No tiene permisos para acceder a esta funcionalidad.' }}</p>
        <div class="actions">
          <button class="btn btn-primary" routerLink="/dashboard">
            <i class="fas fa-home"></i> Ir al Dashboard
          </button>
          <button class="btn btn-secondary" (click)="goBack()">
            <i class="fas fa-arrow-left"></i> Volver
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .access-denied-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: 2rem;
    }

    .access-denied-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      padding: 3rem;
      text-align: center;
      max-width: 500px;
      width: 100%;
    }

    .icon-container {
      margin-bottom: 1.5rem;
    }

    .icon-container i {
      font-size: 4rem;
      color: #ffc107;
    }

    h2 {
      color: #dc3545;
      margin-bottom: 1rem;
      font-size: 2rem;
    }

    p {
      color: #6c757d;
      margin-bottom: 2rem;
      font-size: 1.1rem;
      line-height: 1.6;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .access-denied-card {
        padding: 2rem;
        margin: 1rem;
      }

      .actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class AccessDeniedComponent {
  @Input() message: string = '';

  goBack(): void {
    window.history.back();
  }
}
