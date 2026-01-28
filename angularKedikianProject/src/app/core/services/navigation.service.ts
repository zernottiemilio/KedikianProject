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
   * CORRECCIÓN: Usar roles (array) en lugar de rol (string)
   */
  navigateByRole(): void {
    const user = this.authService.obtenerUsuarioActual();
    
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Verificar roles usando el array user.roles
    if (user.roles.includes('administrador')) {
      this.router.navigate(['/dashboard']);
    } else if (user.roles.includes('operario')) {
      this.router.navigate(['/dashboard']);
    } else {
      console.error('Rol no reconocido:', user.roles);
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
   * CORRECCIÓN: Usar roles (array) en lugar de rol (string)
   */
  getAvailableRoutes(): string[] {
    const user = this.authService.obtenerUsuarioActual();
    
    if (!user) {
      return [];
    }

    const baseRoutes = ['/dashboard'];
    
    // Verificar roles usando el array user.roles
    if (user.roles.includes('administrador')) {
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

    if (user.roles.includes('operario')) {
      return baseRoutes;
    }

    return [];
  }

  /**
   * Método auxiliar para verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this.authService.obtenerUsuarioActual();
    return user ? user.roles.includes(role) : false;
  }

  /**
   * Método auxiliar para verificar si el usuario es administrador
   */
  isAdmin(): boolean {
    return this.hasRole('administrador');
  }

  /**
   * Método auxiliar para verificar si el usuario es operario
   */
  isOperario(): boolean {
    return this.hasRole('operario');
  }

  /**
   * Obtiene el rol principal del usuario (útil para casos donde necesitas un solo rol)
   */
  getPrimaryRole(): string | null {
    const user = this.authService.obtenerUsuarioActual();
    if (!user || !user.roles.length) {
      return null;
    }

    // Priorizar administrador sobre operario
    if (user.roles.includes('administrador')) {
      return 'administrador';
    }
    
    if (user.roles.includes('operario')) {
      return 'operario';
    }

    // Retornar el primer rol disponible
    return user.roles[0];
  }

  /**
   * Versión alternativa de navigateByRole usando el rol principal
   */
  navigateByPrimaryRole(): void {
    const primaryRole = this.getPrimaryRole();
    
    if (!primaryRole) {
      this.router.navigate(['/login']);
      return;
    }

    switch (primaryRole) {
      case 'administrador':
        this.router.navigate(['/dashboard']);
        break;
      case 'operario':
        this.router.navigate(['/dashboard']);
        break;
      default:
        console.error('Rol no reconocido:', primaryRole);
        this.router.navigate(['/login']);
    }
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

  /**
   * Obtiene rutas disponibles con manejo más granular de roles múltiples
   */
  getAvailableRoutesAdvanced(): { route: string; requiredRoles: string[] }[] {
    const allRoutes = [
      { route: '/dashboard', requiredRoles: ['administrador', 'operario'] },
      { route: '/gestion-proyectos', requiredRoles: ['administrador'] },
      { route: '/gestion-machines', requiredRoles: ['administrador'] },
      { route: '/gestion-operarios', requiredRoles: ['administrador'] },
      { route: '/gestion-inventario', requiredRoles: ['administrador'] },
      { route: '/balance', requiredRoles: ['administrador'] },
      { route: '/aridos', requiredRoles: ['administrador'] },
      { route: '/informes', requiredRoles: ['administrador'] },
      { route: '/excel-import', requiredRoles: ['administrador'] }
    ];

    const user = this.authService.obtenerUsuarioActual();
    if (!user) {
      return [];
    }

    // Filtrar rutas que el usuario puede acceder
    return allRoutes.filter(routeInfo =>
      routeInfo.requiredRoles.some(requiredRole => 
        user.roles.includes(requiredRole)
      )
    );
  }
}