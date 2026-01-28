import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthRoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Primero verificar si el usuario está autenticado
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    // Luego verificar el rol requerido
    const requiredRole = route.data['role'];

    if (!requiredRole) {
      return true;
    }

    // Verificar si el usuario tiene el rol requerido
    if (this.authService.hasRole(requiredRole)) {
      return true;
    }

    // El usuario no tiene el rol requerido
    // Redirigir según el rol del usuario
    if (this.authService.esAdministrador()) {
      this.router.navigate(['/dashboard']);
    } else if (this.authService.esOperario()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }

    return false;
  }
}
