import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule], // Importar RouterModule aquí
})
export class SidebarComponent implements OnInit {
  isOpen: boolean = false;
  screenWidth: number;
  isMobile: boolean = false;

  useAngularRouting: boolean = false;
  // Definición de elementos de navegación
  navItems = [
    {
      title: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard',
      active: true,
      imageUrl: 'public/assets/retro.png',
      roles: ['administrador', 'operario'], // Accesible para todos
    },
    {
      title: 'Gestión de Proyectos',
      icon: 'fas fa-truck-monster',
      route: '/gestion-proyectos',
      active: false,
      roles: ['administrador'], // Solo administradores
    },
    {
      title: 'Gestión de Áridos',
      icon: 'fas fa-cubes',
      route: '/aridos',
      active: false,
      roles: ['administrador'], // Solo administradores
    },
    {
      title: 'Gestión de Maquinas',
      icon: 'fas fa-file-invoice-dollar',
      route: '/gestion-machines',
      active: false,
      roles: ['administrador'], // Solo administradores
    },
    {
      title: 'Gestión de Operarios',
      icon: 'fas fa-project-diagram',
      route: '/gestion-operarios',
      active: false,
      roles: ['administrador'], // Solo administradores
    },
    {
      title: 'Balance',
      icon: 'fas fa-chart-pie',
      route: '/balance',
      active: false,
      roles: ['administrador'], // Solo administradores
    },
    {
      title: 'Informes y Reportes',
      icon: 'fas fa-chart-line',
      route: '/informes',
      active: false,
      roles: ['administrador'], // Solo administradores
    },
    {
      title: 'Cuenta Corriente',
      icon: 'fas fa-file-invoice-dollar',
      route: '/cuenta-corriente',
      active: false,
      roles: ['administrador', 'cliente'], // Accesible para administradores y clientes
    },
    {
      title: 'Importar Excel',
      icon: 'fas fa-file-excel',
      route: '/excel-import',
      active: false,
      roles: ['administrador'], // Solo administradores
    },
  ];

  configItems = [
    {
      title: 'Ajustes',
      icon: 'fas fa-cog',
      route: '/ajustes',
      active: false,
    },
    {
      title: 'Mi Cuenta',
      icon: 'fas fa-user-cog',
      route: '/cuenta',
      active: false,
    },
    {
      title: 'Ayuda',
      icon: 'fas fa-question-circle',
      route: '/ayuda',
      active: false,
    },
    {
      title: 'Cerrar Sesión',
      icon: 'fas fa-sign-out-alt',
      route: '/logout',
      active: false,
    },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private navigationService: NavigationService
  ) {
    this.screenWidth = window.innerWidth;
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Monitorea los cambios de ruta para actualizar el elemento activo
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveItem(event.url);
      });

    // Aplicar animación a los elementos de navegación
    this.applyAnimationDelays();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.screenWidth = event.target.innerWidth;
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobile = this.screenWidth < 1265;
    // Si cambia a vista de escritorio, asegurarse de que el sidebar esté abierto
    if (!this.isMobile) {
      this.isOpen = true;
    } else {
      this.isOpen = false;
    }
  }

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  // Método para actualizar el elemento activo basado en la URL actual
  updateActiveItem(currentUrl: string): void {
    // Resetear todos los items a inactivo
    [...this.navItems, ...this.configItems].forEach(
      (item) => (item.active = false)
    );

    // Buscar y marcar como activo el item correspondiente a la URL actual
    const allItems = [...this.navItems, ...this.configItems];
    const activeItem = allItems.find((item) => currentUrl.includes(item.route));

    if (activeItem) {
      activeItem.active = true;
    } else if (currentUrl === '/' || currentUrl === '') {
      // Si estamos en la ruta raíz, activar Dashboard por defecto
      this.navItems[0].active = true;
    }
  }

  // Método para navegar a una ruta y actualizar el estado activo
  navigateTo(route: string): void {
    this.router.navigate([route]);

    // Si estamos en móvil, cerrar el sidebar después de navegar
    if (this.isMobile) {
      this.isOpen = false;
    }
  }

  // Método para aplicar retrasos de animación a los elementos del nav
  private applyAnimationDelays(): void {
    setTimeout(() => {
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach((item, index) => {
        (item as HTMLElement).style.setProperty(
          '--item-index',
          index.toString()
        );
      });
    }, 0);
  }

  /**
   * Obtiene los elementos de navegación filtrados según el rol del usuario
   * CORRECCIÓN: Usar roles (array) en lugar de rol (string)
   */
  getFilteredNavItems() {
    const user = this.authService.obtenerUsuarioActual();
    if (!user) return [];

    return this.navItems.filter(item => 
      // Verificar si algún rol del usuario coincide con los roles permitidos del item
      user.roles.some(userRole => item.roles.includes(userRole))
    );
  }

  /**
   * Verifica si el usuario puede acceder a un elemento de navegación
   * CORRECCIÓN: Usar roles (array) en lugar de rol (string)
   */
  canAccessNavItem(item: any): boolean {
    const user = this.authService.obtenerUsuarioActual();
    if (!user) return false;

    // Verificar si algún rol del usuario coincide con los roles permitidos del item
    return user.roles.some(userRole => item.roles.includes(userRole));
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

  // Método para cerrar sesión
  logout(): void {
    this.authService.cerrarSesion();
  }
}