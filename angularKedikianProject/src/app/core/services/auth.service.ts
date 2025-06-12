import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
export interface Usuario {
  id: string;
  nombreUsuario: string;
  rol: 'administrador' | 'operario';
  token?: string;
}

const apiUrl = `${environment.apiUrl}/auth`;

export type User = Usuario;

export interface CredencialesLogin {
  nombreUsuario: string;
  contraseña: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(null);
  public usuarioActual$ = this.usuarioActualSubject.asObservable();

  // Alias para componentes que usan nombres en inglés
  public currentUser$ = this.usuarioActual$;

  constructor(private router: Router) {
    this.cargarUsuarioDesdeAlmacenamiento();
  }

  private cargarUsuarioDesdeAlmacenamiento(): void {
    const usuarioAlmacenado = localStorage.getItem('usuarioActual');
    if (usuarioAlmacenado) {
      try {
        const usuario = JSON.parse(usuarioAlmacenado);
        this.usuarioActualSubject.next(usuario);
      } catch (error) {
        localStorage.removeItem('usuarioActual');
      }
    }
  }

  // Método con nombre en inglés para compatibilidad
  login(username: string, password: string): Observable<Usuario> {
    return this.iniciarSesion({
      nombreUsuario: username,
      contraseña: password,
    });
  }

  private iniciarSesion(credenciales: CredencialesLogin): Observable<Usuario> {
    // Validar credenciales y asignar rol correspondiente
    if (
      credenciales.nombreUsuario === 'administrador' &&
      credenciales.contraseña === '1234'
    ) {
      const mockUsuario: Usuario = {
        id: '1',
        nombreUsuario: credenciales.nombreUsuario,
        rol: 'administrador', // Ahora asignamos el rol correcto
        token: 'fake-jwt-token',
      };

      localStorage.setItem('usuarioActual', JSON.stringify(mockUsuario));
      this.usuarioActualSubject.next(mockUsuario);
      return of(mockUsuario); // Usando 'of' de rxjs para crear un Observable
    } else if (
      credenciales.nombreUsuario === 'operario' &&
      credenciales.contraseña === '1234'
    ) {
      const mockUsuario: Usuario = {
        id: '2',
        nombreUsuario: credenciales.nombreUsuario,
        rol: 'operario',
        token: 'fake-jwt-token',
      };

      localStorage.setItem('usuarioActual', JSON.stringify(mockUsuario));
      this.usuarioActualSubject.next(mockUsuario);
      return of(mockUsuario);
    } else {
      return throwError(() => new Error('Credenciales inválidas'));
    }
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuarioActual');
    this.usuarioActualSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Alias para cerrarSesion
  logout(): void {
    this.cerrarSesion();
  }

  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioActualSubject.value;
  }

  // Alias para obtenerUsuarioActual
  getCurrentUser(): Usuario | null {
    return this.obtenerUsuarioActual();
  }

  estaAutenticado(): boolean {
    return !!this.usuarioActualSubject.value;
  }

  // Alias para estaAutenticado
  isAuthenticated(): boolean {
    return this.estaAutenticado();
  }

  esAdministrador(): boolean {
    const usuario = this.usuarioActualSubject.value;
    return !!usuario && usuario.rol === 'administrador';
  }

  esOperario(): boolean {
    const usuario = this.usuarioActualSubject.value;
    return !!usuario && usuario.rol === 'operario';
  }

  // Método para verificar el rol (alias)
  hasRole(role: string): boolean {
    const usuario = this.usuarioActualSubject.value;
    return !!usuario && usuario.rol === role;
  }

  obtenerTokenAuth(): string | null {
    const usuario = this.usuarioActualSubject.value;
    return usuario?.token || null;
  }

  refrescarToken(): Observable<Usuario> {
    return throwError(
      () => new Error('Token refresh no disponible en modo simulado')
    );
  }
}
