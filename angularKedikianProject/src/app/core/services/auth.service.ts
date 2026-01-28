import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

export interface Usuario {
  id: string;
  nombreUsuario: string;
  roles: string[];
  token?: string;
  // 🚀 AGREGADO: Para mantener compatibilidad con el interceptor
  access_token?: string;
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
    // Codificar en base64
    const usernameBase64 = btoa(username);
    const passwordBase64 = btoa(password);

    const body = new HttpParams()
      .set('username', usernameBase64)
      .set('password', passwordBase64);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const loginUrl = `${apiUrl}/auth/login`;

    return this.http.post<LoginResponse>(
      loginUrl,
      body.toString(),
      { headers }
    ).pipe(
      switchMap((loginResponse: LoginResponse) => {
        const tokenData = {
          access_token: loginResponse.access_token,
          token_type: loginResponse.token_type,
          token: loginResponse.access_token
        };

        localStorage.setItem('usuarioActual', JSON.stringify(tokenData));

        return this.obtenerInformacionUsuario(loginResponse.access_token).pipe(
          tap((usuarioInfo: any) => {
            const usuarioCompleto: Usuario = {
              id: usuarioInfo.id || 'temp',
              nombreUsuario: usuarioInfo.email || usuarioInfo.nombreUsuario || username,
              roles: usuarioInfo.roles || ['administrador'],
              token: loginResponse.access_token,
              access_token: loginResponse.access_token,
              ...usuarioInfo
            };

            localStorage.setItem('usuarioActual', JSON.stringify(usuarioCompleto));
            this.usuarioActualSubject.next(usuarioCompleto);

            return usuarioCompleto;
          }),
          catchError((error) => {
            const usuarioPorDefecto: Usuario = {
              id: 'temp',
              nombreUsuario: username,
              roles: ['administrador'],
              token: loginResponse.access_token,
              access_token: loginResponse.access_token
            };

            localStorage.setItem('usuarioActual', JSON.stringify(usuarioPorDefecto));
            this.usuarioActualSubject.next(usuarioPorDefecto);

            return of(usuarioPorDefecto);
          })
        );
      }),
      catchError((error) => {
        return throwError(() => error);
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
    return !!usuario && usuario.roles.includes('administrador');
  }

  esOperario(): boolean {
    const usuario = this.usuarioActualSubject.value;
    return !!usuario && usuario.roles.includes('operario');
  }

  // Método para verificar el rol (alias)
  hasRole(role: string): boolean {
    const usuario = this.usuarioActualSubject.value;
    return !!usuario && usuario.roles.includes(role);
  }

  // 🚀 MEJORADO: Obtener token de múltiples fuentes
  obtenerTokenAuth(): string | null {
    const usuario = this.usuarioActualSubject.value;
    return usuario?.access_token || usuario?.token || null;
  }

  refrescarToken(): Observable<Usuario> {
    return throwError(
      () => new Error('Token refresh no disponible en modo simulado')
    );
  }

  // 🚀 MEJORADO: Pasar token como parámetro para evitar referencias circulares
  private obtenerInformacionUsuario(token: string): Observable<any> {
    // Obtener información del usuario desde el backend
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${apiUrl}/auth/me`, { headers }).pipe(
      catchError((error) => {
        throw error; // Re-lanzar el error para que sea manejado en el switchMap
      })
    );
  }
}