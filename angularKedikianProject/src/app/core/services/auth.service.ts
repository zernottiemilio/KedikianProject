import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
export interface Usuario {
  id: string;
  nombreUsuario: string;
  rol: 'administrador' | 'operario';
  token?: string;
}

const apiUrl = `${environment.apiUrl}`;

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

  constructor(private router: Router, private http: HttpClient) {
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

  login(username: string, password: string): Observable<Usuario> {
    const body = new URLSearchParams();
    // Codificar usuario y contraseña en base64
    body.set('username', btoa(username));
    body.set('password', btoa(password));
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    
    const loginUrl = `${apiUrl}/login`;
    console.log('🚀 Intentando login en:', loginUrl);
    console.log('📦 Datos enviados:', body.toString());
    
    return this.http.post<Usuario>(
      loginUrl,
      body.toString(),
      { headers }
    ).pipe(
      // Manejar la respuesta exitosa
      tap((usuario: Usuario) => {
        // Guardar el usuario en localStorage
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        // Actualizar el BehaviorSubject
        this.usuarioActualSubject.next(usuario);
      })
    );
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
