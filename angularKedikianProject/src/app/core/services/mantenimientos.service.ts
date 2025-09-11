import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Mantenimiento {
  id: number;
  maquina_id: number;
  tipo_mantenimiento: string;
  fecha_mantenimiento: string; // ISO date
  descripcion: string;
  horas_maquina: number | null;
  created: string;
  updated: string;
}

export interface MantenimientoCreate {
  maquina_id: number;
  tipo_mantenimiento: string;
  fecha_mantenimiento: string; // ISO date
  descripcion: string;
  horas_maquina?: number | null;
}

@Injectable({ providedIn: 'root' })
export class MantenimientosService {
  private readonly apiUrl = `${environment.apiUrl}/mantenimientos`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<Mantenimiento[]> {
    return this.http.get<Mantenimiento[]>(this.apiUrl);
  }

  listarPorMaquina(maquinaId: number): Observable<Mantenimiento[]> {
    return this.http.get<Mantenimiento[]>(`${this.apiUrl}/maquina/${maquinaId}`);
  }

  obtenerPorId(id: number): Observable<Mantenimiento> {
    return this.http.get<Mantenimiento>(`${this.apiUrl}/${id}`);
  }

  crear(data: MantenimientoCreate): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(this.apiUrl, data);
  }

  actualizar(id: number, data: Partial<MantenimientoCreate>): Observable<Mantenimiento> {
    return this.http.put<Mantenimiento>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}


