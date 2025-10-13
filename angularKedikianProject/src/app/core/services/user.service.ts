import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface User {
  id: number;
  nombre: string;
  email: string;
  hash_contrasena?: string;
  estado: boolean;
  roles: string[] | string;
  fecha_creacion: Date | string;
}

export interface JornadaLaboral {
  id: number;
  usuario_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  tiempo_descanso: number;
  horas_regulares: number;
  horas_extras: number;
  total_horas: number;
  estado: string;
  es_feriado: boolean;
  limite_regular_alcanzado: boolean;
  overtime_confirmado: boolean;
  is_active: boolean;
  is_in_overtime: boolean;
  puede_iniciar_overtime: boolean;
  notas_inicio?: string;
  notas_fin?: string;
  motivo_finalizacion?: string;
  created: string;
  updated?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
      if (error.error && (error.error.detail !== undefined)) {
        const detail = Array.isArray(error.error.detail)
          ? JSON.stringify(error.error.detail)
          : (typeof error.error.detail === 'object'
              ? JSON.stringify(error.error.detail)
              : String(error.error.detail));
        errorMessage += `\nDetalle: ${detail}`;
      }
    }
    
    console.error('Error completo:', error);
    return throwError(() => new Error(errorMessage));
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getJornadasLaborales(usuarioId: number): Observable<JornadaLaboral[]> {
    return this.http.get<JornadaLaboral[]>(
      `${environment.apiUrl}/jornadas-laborales/usuario/${usuarioId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  createUser(user: Partial<User>): Observable<User> {
    // Asegurar que la contraseña esté presente al crear
    if (!user.hash_contrasena) {
      return throwError(() => new Error('La contraseña es requerida'));
    }
    
    return this.http.post<User>(this.apiUrl, user).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(user: Partial<User>): Observable<User> {
    // Enviar el recurso completo por PUT. Si hash_contrasena es cadena vacía, eliminarla;
    // si es null, mantenerla para cumplir validación de presencia del backend.
    const userToUpdate = { ...user } as any;
    if (userToUpdate.hash_contrasena === '') {
      delete userToUpdate.hash_contrasena;
    }

    return this.http.put<User>(`${this.apiUrl}/${user.id}`, userToUpdate).pipe(
      catchError(this.handleError)
    );
  }

  updateUserStatus(userId: number, status: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${userId}/status`, { 
      estado: status 
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  checkEmailExists(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);
    return this.http.get<boolean>(`${this.apiUrl}/check-email`, { params }).pipe(
      catchError(this.handleError)
    );
  }
}