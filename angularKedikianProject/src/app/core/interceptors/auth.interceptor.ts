// auth.interceptor.ts
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export function AuthInterceptor(
  request: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const router = inject(Router);

  // Rutas que no requieren token
  const authRoutes = ['/auth/login', '/auth/register', '/auth/refresh'];
  const isAuthRoute = authRoutes.some(route => request.url.includes(route));

  if (isAuthRoute) {
    return next(request).pipe(
      catchError((error: HttpErrorResponse) => handleHttpError(error, router))
    );
  }

  // Buscar token en localStorage
  const usuarioActual = localStorage.getItem('usuarioActual');
  let token: string | null = null;

  if (usuarioActual) {
    try {
      const usuario = JSON.parse(usuarioActual);
      token = usuario.access_token || usuario.token || null;
    } catch {
      localStorage.removeItem('usuarioActual');
    }
  }

  // ⚠️ CAMBIO IMPORTANTE: No establecer Content-Type si es FormData
  const headers: any = {};
  
  // Solo agregar Content-Type si NO es FormData
  if (!(request.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Agregar Authorization si existe token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Clonar request con headers
  const secureRequest = request.clone({ setHeaders: headers });

  return next(secureRequest).pipe(
    catchError((error: HttpErrorResponse) => handleHttpError(error, router))
  );
}

// Manejo seguro de errores
function handleHttpError(error: HttpErrorResponse, router: Router): Observable<never> {
  switch (error.status) {
    case 401:
      localStorage.removeItem('usuarioActual');
      router.navigate(['/login']);
      break;
    case 403:
      break;
    case 0:
      console.error('Error de conexión con el servidor');
      break;
    default:
      console.error(`Error HTTP ${error.status}: ${error.statusText}`);
  }
  return throwError(() => error);
}