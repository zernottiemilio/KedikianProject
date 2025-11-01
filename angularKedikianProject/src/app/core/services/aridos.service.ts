import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Arido, Proyecto, RegistroArido } from '../../modules/admin/aridos/aridos.component';

@Injectable({
  providedIn: 'root',
})
export class AridosService {
  private apiUrl = `${environment.apiUrl}/aridos`;

  constructor(private http: HttpClient) {}

  // ------------------------
  // Áridos
  // ------------------------
  getAridos(): Observable<Arido[]> {
    return this.http.get<Arido[]>(`${this.apiUrl}/tipos`).pipe(
      catchError(this.handleError<Arido[]>('getAridos', []))
    );
  }

  getArido(id: number): Observable<Arido> {
    return this.http.get<Arido>(`${this.apiUrl}/tipos/${id}`).pipe(
      catchError(this.handleError<Arido>(`getArido id=${id}`))
    );
  }

  // ------------------------
  // Proyectos
  // ------------------------
  getProyectos(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${environment.apiUrl}/proyectos`).pipe(
      catchError(this.handleError<Proyecto[]>('getProyectos', []))
    );
  }

  getProyecto(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${environment.apiUrl}/proyectos/${id}`).pipe(
      catchError(this.handleError<Proyecto>(`getProyecto id=${id}`))
    );
  }

  // ------------------------
  // Registros de áridos
  // ------------------------
  getRegistrosAridos(filtros?: { proyectoId?: number; aridoId?: number }): Observable<RegistroArido[]> {
    let params = new HttpParams();
    if (filtros?.proyectoId) params = params.set('proyectoId', filtros.proyectoId.toString());
    if (filtros?.aridoId) params = params.set('aridoId', filtros.aridoId.toString());

    return this.http.get<RegistroArido[]>(`${this.apiUrl}/registros`, { params }).pipe(
      catchError(this.handleError<RegistroArido[]>('getRegistrosAridos', []))
    );
  }

  getRegistroArido(id: number): Observable<RegistroArido> {
    return this.http.get<RegistroArido>(`${this.apiUrl}/registros/${id}`).pipe(
      catchError(this.handleError<RegistroArido>(`getRegistroArido id=${id}`))
    );
  }

  crearRegistroArido(registro: {
    proyecto_id: number;
    usuario_id: number;
    tipo_arido: string;
    cantidad: number;
    fecha_entrega: string;
    observaciones?: string;
  }): Observable<RegistroArido> {
    console.log('Enviando registro al backend:', registro);
    return this.http.post<RegistroArido>(`${this.apiUrl}/registros`, registro).pipe(
      catchError(this.handleError<RegistroArido>('crearRegistroArido'))
    );
  }

  actualizarRegistroArido(id: number, registro: {
    proyecto_id: number;
    usuario_id: number;
    tipo_arido: string;
    cantidad: number;
    fecha_entrega: string;
    observaciones?: string;
  }): Observable<RegistroArido> {
    return this.http.put<RegistroArido>(`${this.apiUrl}/registros/${id}`, registro).pipe(
      catchError(this.handleError<RegistroArido>('actualizarRegistroArido'))
    );
  }

  eliminarRegistroArido(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/registros/${id}`).pipe(
      catchError(this.handleError<void>('eliminarRegistroArido'))
    );
  }

  // ------------------------
  // Manejo de errores
  // ------------------------
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
