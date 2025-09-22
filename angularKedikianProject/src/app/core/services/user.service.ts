import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface User {
  id: number;
  nombre: string;
  email: string;
  hash_contrasena?: string;
  estado: boolean;
  roles: 'administrador' | 'operario';
  fecha_creacion: Date;
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

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getJornadasLaborales(usuarioId: number): Observable<JornadaLaboral[]> {
  return this.http.get<JornadaLaboral[]>(`${environment.apiUrl}/jornadas-laborales/usuario/${usuarioId}`);}

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${user.id}`, user);
  }

  updateUserStatus(userId: number, status: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${userId}/status`, { estado: status });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  checkEmailExists(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);
    return this.http.get<boolean>(`${this.apiUrl}/check-email`, { params });
  }
}
