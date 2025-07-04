import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AridosComponent, Arido, Proyecto, RegistroArido } from '../../modules/admin/aridos/aridos.component';

@Injectable({
  providedIn: 'root',
})
export class AridosService {
  // URL base de la API
  private apiUrl = `${environment.apiUrl}/aridos`;

  constructor(private http: HttpClient) {}

  // Métodos para obtener datos de áridos
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

  // Métodos para obtener proyectos
  getProyectos(): Observable<Proyecto[]> {
    // Usar el servicio de proyectos real
    return this.http.get<Proyecto[]>(`${environment.apiUrl}/proyectos`).pipe(
      catchError(this.handleError<Proyecto[]>('getProyectos', []))
    );
  }

  getProyecto(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${environment.apiUrl}/proyectos/${id}`).pipe(
      catchError(this.handleError<Proyecto>(`getProyecto id=${id}`))
    );
  }

  // Métodos para registros de áridos
  getRegistrosAridos(filtros?: {
    proyectoId?: number;
    aridoId?: number;
  }): Observable<any[]> {
    let url = `${this.apiUrl}/registros`;
    if (filtros) {
      const params = new HttpParams();
      if (filtros.proyectoId) params.set('proyectoId', filtros.proyectoId.toString());
      if (filtros.aridoId) params.set('aridoId', filtros.aridoId.toString());
      return this.http.get<any[]>(url, { params }).pipe(
        catchError(this.handleError<any[]>('getRegistrosAridos', []))
      );
    }
    return this.http.get<any[]>(url).pipe(
      catchError(this.handleError<any[]>('getRegistrosAridos', []))
    );
  }

  getRegistroArido(id: number): Observable<RegistroArido> {
    return this.http.get<RegistroArido>(`${this.apiUrl}/registros/${id}`).pipe(
      catchError(this.handleError<RegistroArido>(`getRegistroArido id=${id}`))
    );
  }

  crearRegistroArido(
    registro: {
      proyecto_id: number;
      usuario_id: number;
      tipo_arido: string;
      cantidad: number;
      fecha_entrega: string;
    }
  ): Observable<RegistroArido> {
    console.log('Enviando registro al backend:', registro);
    console.log('JSON que se envía:', JSON.stringify(registro, null, 2));
    return this.http.post<RegistroArido>(`${this.apiUrl}/registros`, registro).pipe(
      catchError((error) => {
        console.error('Error completo:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);
        console.error('Error detail:', JSON.stringify(error.error, null, 2));
        return this.handleError<RegistroArido>('crearRegistroArido')(error);
      })
    );
  }

  actualizarRegistroArido(registro: RegistroArido): Observable<RegistroArido> {
    return this.http.put<RegistroArido>(`${this.apiUrl}/registros/${registro.id}`, registro).pipe(
      catchError(this.handleError<RegistroArido>('actualizarRegistroArido'))
    );
  }

  eliminarRegistroArido(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/registros/${id}`).pipe(
      catchError(this.handleError<void>('eliminarRegistroArido'))
    );
  }



  // Método para manejar errores
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);

      // Registrar el error en un sistema de logging (implementar en el futuro)

      // Retornar un resultado vacío para que la aplicación siga funcionando
      return of(result as T);
    };
  }
}
