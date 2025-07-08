// maquinaria.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface ProyectoAsignado {
  id: number;
  nombre: string;
  fechaAsignacion: Date;
}

export interface Maquina {
  id: number;
  codigo: string;
  nombre: string;
  estado: boolean;
  horas_uso: number;
  proyecto_id: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class MachinesService {
  private apiUrl = `${environment.apiUrl}/maquinas`; // Cambiar según tu configuración de API

  constructor(private http: HttpClient) {}

  obtenerMaquinas(): Observable<Maquina[]> {
    return this.http.get<Maquina[]>(this.apiUrl);
  }

  obtenerMaquinaPorId(id: number): Observable<Maquina> {
    return this.http.get<Maquina>(`${this.apiUrl}/${id}`);
  }

  crearMaquina(maquina: Omit<Maquina, 'id'>): Observable<Maquina> {
    return this.http.post<Maquina>(this.apiUrl, maquina);
  }

  actualizarMaquina(maquina: Maquina): Observable<Maquina> {
    return this.http.put<Maquina>(`${this.apiUrl}/${maquina.id}`, maquina);
  }

  eliminarMaquina(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
