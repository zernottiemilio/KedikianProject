import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService, Usuario } from '../../core/services/auth.service';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2 class="login-title">Sistema Movimiento de Suelo</h2>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Usuario</label>
            <input
              type="text"
              id="username"
              formControlName="username"
              class="form-control"
              [ngClass]="{ 'is-invalid': submitted && f['username'].errors }"
            />
            <div
              *ngIf="submitted && f['username'].errors"
              class="error-message"
            >
              <div *ngIf="f['username'].errors['required']">
                El usuario es requerido
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-control"
              [ngClass]="{ 'is-invalid': submitted && f['password'].errors }"
            />
            <div
              *ngIf="submitted && f['password'].errors"
              class="error-message"
            >
              <div *ngIf="f['password'].errors['required']">
                La contraseña es requerida
              </div>
            </div>
          </div>

          <div class="form-group">
            <button type="submit" class="btn btn-primary" [disabled]="loading">
              <span
                *ngIf="loading"
                class="spinner-border spinner-border-sm"
              ></span>
              Iniciar Sesión
            </button>
          </div>

          <div *ngIf="error" class="alert alert-danger mt-3">
            {{ error }}
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f5f5f5;
      }

      .login-card {
        width: 100%;
        max-width: 400px;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .login-title {
        text-align: center;
        margin-bottom: 2rem;
        color: #333;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      .is-invalid {
        border-color: #dc3545;
      }

      .error-message {
        color: #dc3545;
        font-size: 0.85rem;
        margin-top: 0.25rem;
      }

      .btn {
        display: inline-block;
        font-weight: 400;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        user-select: none;
        border: 1px solid transparent;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        line-height: 1.5;
        border-radius: 0.25rem;
        cursor: pointer;
        width: 100%;
      }

      .btn-primary {
        color: #fff;
        background-color: #007bff;
        border-color: #007bff;
      }

      .btn-primary:hover {
        background-color: #0069d9;
        border-color: #0062cc;
      }

      .btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .alert {
        position: relative;
        padding: 0.75rem 1.25rem;
        margin-bottom: 1rem;
        border: 1px solid transparent;
        border-radius: 0.25rem;
      }

      .alert-danger {
        color: #721c24;
        background-color: #f8d7da;
        border-color: #f5c6cb;
      }

      .spinner-border {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        vertical-align: text-bottom;
        border: 0.2em solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spinner-border 0.75s linear infinite;
        margin-right: 0.5rem;
      }

      @keyframes spinner-border {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const usernameFromForm = this.f['username'].value;
    const passwordFromForm = this.f['password'].value;

    this.authService.login(usernameFromForm, passwordFromForm).subscribe({
      next: (usuario: Usuario) => {
        this.loading = false;

        // 🔹 Mapear roles del backend a los de Angular
        const mappedRoles = usuario.roles.map((rol) => {
          if (rol.toLowerCase() === 'user') return 'operario';
          if (rol.toLowerCase() === 'admin') return 'administrador';
          return rol.toLowerCase();
        });

        if (mappedRoles.includes('administrador')) {
          window.location.href =
            'http://168.197.50.82/administrador/dashboard';
        } else if (mappedRoles.includes('operario')) {
          window.location.href = 'http://168.197.50.82/operario/dashboard';
        } else {
          this.error = 'Usuario sin rol válido.';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;

        if (error.status === 401) {
          this.error = 'Usuario o contraseña incorrectos';
        } else if (error.status === 0) {
          this.error = 'Error de conexión. Verifique su conexión a internet.';
        } else if (error.status >= 500) {
          this.error = 'Error en el servidor. Intente nuevamente.';
        } else {
          this.error = 'Error de autenticación. Intente nuevamente.';
        }
      },
    });
  }
}
