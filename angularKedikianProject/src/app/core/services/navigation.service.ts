import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Navega a la ruta apropiada según el rol del usuario
   */
  navigateByRole(): void {
    const user = this.authService.obtenerUsuarioActual();
    
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    switch (user.rol) {
      case 'administrador':
        this.router.navigate(['/dashboard']);
        break;
      case 'operario':
        this.router.navigate(['/dashboard']);
        break;
      default:
        console.error('Rol no reconocido:', user.rol);
        this.router.navigate(['/login']);
    }
  }

  /**
   * Verifica si el usuario puede acceder a una ruta específica
   */
  canAccessRoute(requiredRole?: string): boolean {
    if (!this.authService.estaAutenticado()) {
      return false;
    }

    if (!requiredRole) {
      return true;
    }

    return this.authService.hasRole(requiredRole);
  }

  /**
   * Obtiene las rutas disponibles según el rol del usuario
   */
  getAvailableRoutes(): string[] {
    const user = this.authService.obtenerUsuarioActual();
    
    if (!user) {
      return [];
    }

    const baseRoutes = ['/dashboard'];
    
    if (user.rol === 'administrador') {
      return [
        ...baseRoutes,
        '/gestion-proyectos',
        '/gestion-machines',
        '/gestion-operarios',
        '/gestion-inventario',
        '/balance',
        '/aridos',
        '/informes',
        '/excel-import'
      ];
    }

    if (user.rol === 'operario') {
      return baseRoutes;
    }

    return [];
  }

  /**
   * Redirige al usuario a la página de acceso denegado si no tiene permisos
   */
  redirectToAccessDenied(): void {
    this.router.navigate(['/dashboard'], { 
      queryParams: { 
        message: 'Acceso denegado. No tiene permisos para acceder a esta funcionalidad.' 
      } 
    });
  }
}
