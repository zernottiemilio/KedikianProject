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
  
  // Obtener el token del localStorage
  const usuarioActual = localStorage.getItem('usuarioActual');
  let token = null;
  
  if (usuarioActual) {
    try {
      const usuario = JSON.parse(usuarioActual);
      token = usuario.token;
    } catch (error) {
      console.error('Error parsing usuario from localStorage:', error);
    }
  }

  // Si hay token, agregarlo al header de autorización
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es 401 (Unauthorized), redirigir al login
      if (error.status === 401) {
        localStorage.removeItem('usuarioActual');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
} 