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

    // Enviar el body como formulario x-www-form-urlencoded
    const body = new HttpParams()
      .set('username', usernameBase64)
      .set('password', passwordBase64);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    
    const loginUrl = `${apiUrl}/auth/login`;
    console.log('🚀 Intentando login en:', loginUrl);
    console.log('📦 Datos enviados:', body.toString());
    
    return this.http.post<LoginResponse>(
      loginUrl,
      body.toString(),
      { headers }
    ).pipe(
      // Después del login exitoso, obtener información del usuario
      switchMap((loginResponse: LoginResponse) => {
        console.log('✅ Respuesta del login OAuth2:', loginResponse);
        
        // 🚀 SOLUCIÓN: Guardar inmediatamente el token para el interceptor
        const tokenData = {
          access_token: loginResponse.access_token,
          token_type: loginResponse.token_type,
          token: loginResponse.access_token // Para compatibilidad
        };
        
        // Guardar solo los datos del token primero
        localStorage.setItem('usuarioActual', JSON.stringify(tokenData));
        
        // Intentar obtener información del usuario desde el backend
        return this.obtenerInformacionUsuario(loginResponse.access_token).pipe(
          // 🚀 MEJORADO: Combinar token con datos del usuario
          tap((usuarioInfo: any) => {
            console.log('✅ Información del usuario obtenida:', usuarioInfo);
            
            // 🚀 SOLUCIÓN: Crear usuario completo manteniendo el token
            const usuarioCompleto: Usuario = {
              id: usuarioInfo.id || 'temp',
              nombreUsuario: usuarioInfo.email || usuarioInfo.nombreUsuario || username,
              roles: usuarioInfo.roles || ['administrador'],
              // 🔑 CRÍTICO: Mantener ambas formas del token
              token: loginResponse.access_token,
              access_token: loginResponse.access_token,
              // Agregar cualquier otra propiedad del usuario
              ...usuarioInfo
            };
            
            console.log('✅ Usuario completo creado:', usuarioCompleto);
            
            // Guardar el usuario completo
            localStorage.setItem('usuarioActual', JSON.stringify(usuarioCompleto));
            console.log('💾 Usuario completo guardado en localStorage');
            
            // Actualizar el BehaviorSubject
            this.usuarioActualSubject.next(usuarioCompleto);
            console.log('🔄 BehaviorSubject actualizado');
            
            return usuarioCompleto;
          }),
          catchError((error) => {
            console.warn('⚠️ No se pudo obtener información del usuario, usando datos por defecto:', error);
            
            // 🚀 SOLUCIÓN: Usuario por defecto con token
            const usuarioPorDefecto: Usuario = {
              id: 'temp',
              nombreUsuario: username,
              roles: ['administrador'],
              token: loginResponse.access_token,
              access_token: loginResponse.access_token
            };
            
            // Guardar usuario por defecto
            localStorage.setItem('usuarioActual', JSON.stringify(usuarioPorDefecto));
            this.usuarioActualSubject.next(usuarioPorDefecto);
            
            return of(usuarioPorDefecto);
          })
        );
      }),
      // Manejar la respuesta final
      tap((usuario: Usuario) => {
        console.log('🎯 Login exitoso, usuario:', usuario);
        console.log('🔍 Token en usuario final:', usuario.access_token ? 'SÍ' : 'NO');
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
      tap((userInfo) => {
        console.log('✅ Usuario obtenido de /auth/me:', userInfo);
      }),
      catchError((error) => {
        console.warn('⚠️ Error al obtener información del usuario desde /auth/me:', error);
        throw error; // Re-lanzar el error para que sea manejado en el switchMap
      })
    );
  }
}