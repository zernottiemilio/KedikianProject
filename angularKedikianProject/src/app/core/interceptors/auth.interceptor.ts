import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export function AuthInterceptor(
  request: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const router = inject(Router);
  
  // Verificar si es una ruta de autenticación
  const authRoutes = ['/auth/login', '/auth/register', '/auth/refresh'];
  const isAuthRoute = authRoutes.some(route => request.url.includes(route));
  
  // Si es una ruta de auth, pasar sin modificar
  if (isAuthRoute) {
    console.log('🔓 Ruta de auth detectada, pasando sin token:', request.url);
    return next(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('🔥 Error HTTP en ruta de auth:', error.status, error.statusText, 'URL:', error.url);
        return throwError(() => error);
      })
    );
  }
  
  // 🚀 SOLUCIÓN: Función para obtener token con reintentos y debug detallado
  const getTokenWithRetry = (maxRetries = 3, currentRetry = 0): string | null => {
    const usuarioActual = localStorage.getItem('usuarioActual');
    
    if (!usuarioActual) {
      if (currentRetry < maxRetries) {
        console.log(`🔄 Intento ${currentRetry + 1}/${maxRetries} - Usuario no encontrado, reintentando...`);
        return null;
      }
      console.log('⚠️ No hay usuario en localStorage después de todos los intentos');
      return null;
    }

    try {
      const usuario = JSON.parse(usuarioActual);
      
      // 🔍 DEBUG: Mostrar estructura completa del objeto
      console.log('📋 Estructura del usuario en localStorage:', {
        keys: Object.keys(usuario),
        hasAccessToken: 'access_token' in usuario,
        hasToken: 'token' in usuario,
        usuario: usuario
      });
      
      // 🚀 CORREGIDO: Buscar token en todas las posibles ubicaciones
      const token = usuario.access_token || 
                    usuario.token || 
                    (usuario.auth && usuario.auth.access_token) ||
                    (usuario.loginResponse && usuario.loginResponse.access_token);
      
      if (!token && currentRetry < maxRetries) {
        console.log(`🔄 Intento ${currentRetry + 1}/${maxRetries} - Token no encontrado en estructura:`, Object.keys(usuario));
        return null;
      }
      
      if (token) {
        console.log('✅ Token encontrado en ubicación:', 
          usuario.access_token ? 'access_token directo' :
          usuario.token ? 'token directo' :
          (usuario.auth && usuario.auth.access_token) ? 'auth.access_token' :
          (usuario.loginResponse && usuario.loginResponse.access_token) ? 'loginResponse.access_token' :
          'ubicación desconocida'
        );
      }
      
      return token;
    } catch (error) {
      console.error('❌ Error parsing usuario from localStorage:', error);
      localStorage.removeItem('usuarioActual');
      return null;
    }
  };

  // Obtener el token con reintentos
  let token = getTokenWithRetry();
  
  // 🚀 SOLUCIÓN: Si no hay token, crear un Observable con delay para reintentar
  if (!token) {
    console.log('⏱️ Token no disponible inmediatamente, aplicando delay para timing...');
    
    return new Observable(observer => {
      // Esperar un poco para que se complete el guardado en localStorage
      setTimeout(() => {
        const retryToken = getTokenWithRetry(2, 0);
        
        if (retryToken) {
          console.log('✅ Token encontrado después del delay');
          console.log('🔍 Primeros caracteres del token:', retryToken.substring(0, 20) + '...');
          
          // Crear nueva petición con el token
          const authenticatedRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${retryToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('🚀 Petición con token a:', authenticatedRequest.url);
          
          // Continuar con la petición autenticada
          next(authenticatedRequest).pipe(
            catchError((error: HttpErrorResponse) => handleHttpError(error, router))
          ).subscribe(observer);
          
        } else {
          console.log('⚠️ Petición sin token a:', request.url);
          
          // Continuar sin token
          const requestWithoutToken = request.clone({
            setHeaders: {
              'Content-Type': 'application/json'
            }
          });
          
          next(requestWithoutToken).pipe(
            catchError((error: HttpErrorResponse) => handleHttpError(error, router))
          ).subscribe(observer);
        }
      }, 100); // 100ms de delay - ajusta según necesites
    });
  }

  // Si hay token inmediatamente disponible
  console.log('🔑 Token encontrado inmediatamente: Sí');
  console.log('🔍 Primeros caracteres del token:', token.substring(0, 20) + '...');
  
  const authenticatedRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('🚀 Petición con token a:', authenticatedRequest.url);

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => handleHttpError(error, router))
  );
}

// 🚀 SOLUCIÓN: Función auxiliar para manejo de errores HTTP
function handleHttpError(error: HttpErrorResponse, router: Router): Observable<never> {
  console.error('🔥 Error HTTP:', error.status, error.statusText, 'URL:', error.url);
  
  switch (error.status) {
    case 401:
      console.log('🔒 Error 401 - Token inválido o expirado, redirigiendo al login');
      localStorage.removeItem('usuarioActual');
      router.navigate(['/login']);
      break;
      
    case 403:
      console.log('🚫 Error 403 - Acceso prohibido');
      break;
      
    case 0:
      console.log('🌐 Error de conexión - Verificar servidor');
      break;
  }
  
  return throwError(() => error);
}