import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
export interface Usuario {
  id: string;
  nombreUsuario: string;
  rol: 'administrador' | 'operario';
  token?: string;
}

// Interfaz para la respuesta del login OAuth2
export interface LoginResponse {
  access_token: string;
  token_type: string;
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
    // Crear el body manualmente sin codificación
    const body = `username=${username}&password=${password}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    
    const loginUrl = `${apiUrl}/auth/login`;
    console.log('🚀 Intentando login en:', loginUrl);
    console.log('📦 Datos enviados:', body);
    
    return this.http.post<LoginResponse>(
      loginUrl,
      body,
      { headers }
    ).pipe(
      // Después del login exitoso, obtener información del usuario
      switchMap((loginResponse: LoginResponse) => {
        console.log('✅ Respuesta del login OAuth2:', loginResponse);
        
        // Crear un usuario temporal con el token
        const usuarioTemporal: Usuario = {
          id: 'temp',
          nombreUsuario: username,
          rol: 'administrador', // Por defecto, se actualizará después
          token: loginResponse.access_token
        };
        
        // Guardar temporalmente para que el interceptor pueda usar el token
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioTemporal));
        this.usuarioActualSubject.next(usuarioTemporal);
        
        // Intentar obtener información del usuario desde el backend
        return this.obtenerInformacionUsuario().pipe(
          catchError((error) => {
            console.warn('⚠️ No se pudo obtener información del usuario, usando datos por defecto:', error);
            // Si no se puede obtener la información del usuario, usar los datos por defecto
            return of(usuarioTemporal);
          })
        );
      }),
      // Manejar la respuesta final
      tap((usuario: Usuario) => {
        console.log('✅ Usuario final:', usuario);
        // Guardar el usuario en localStorage
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        console.log('💾 Usuario guardado en localStorage');
        // Actualizar el BehaviorSubject
        this.usuarioActualSubject.next(usuario);
        console.log('🔄 BehaviorSubject actualizado');
        console.log('🔍 Usuario actual después del login:', this.usuarioActualSubject.value);
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

  private obtenerInformacionUsuario(): Observable<Usuario> {
    // Por ahora, devolver un usuario por defecto ya que el backend no tiene este endpoint
    // En el futuro, esto debería hacer una petición a /api/v1/users/me o similar
    return of({
      id: '1',
      nombreUsuario: 'admin@kedikian.com',
      rol: 'administrador',
      token: this.obtenerTokenAuth() || ''
    });
  }
}
