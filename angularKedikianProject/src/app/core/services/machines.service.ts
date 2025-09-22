// machines.service.ts - CORREGIDO SIN PROYECTOS
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Maquina {
  id: number;
  codigo: string;
  nombre: string;
  estado: boolean;
  horas_uso: number;
}

// Interfaz para el registro de horas trabajadas de una máquina
export interface RegistroHoras {
  maquina_id: number;
  horas_trabajadas: number;
  fecha: string; // YYYY-MM-DD
  descripcion?: string;
}

// Interfaz para historial de horas
export interface HistorialHoras {
  id: number;
  maquina_id: number;
  horas_trabajadas: number;
  fecha: string;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
}

// Interfaz para estadísticas de horas
export interface EstadisticasHoras {
  total_horas: number;
  total_registros: number;
  promedio_horas: number;
  fecha_primer_registro?: string;
  fecha_ultimo_registro?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MachinesService {
  private apiUrl = `${environment.apiUrl}/maquinas`;

  constructor(private http: HttpClient) {}

  // ========== CRUD BÁSICO DE MÁQUINAS ==========

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

  // ========== GESTIÓN DE HORAS (SIN PROYECTOS) ==========

  registrarHoras(registro: RegistroHoras): Observable<any> {
    const url = `${this.apiUrl}/${registro.maquina_id}/horas`;
    const body = {
      horas: registro.horas_trabajadas,
      fecha: registro.fecha,
      descripcion: registro.descripcion || ''
    };

    console.log('⏱️ Registrando horas en:', url, 'con body:', body);

    return this.http.post<any>(url, body).pipe(
      tap((response: any) => {
        console.log('✅ Respuesta del servidor al registrar horas:', response);
      }),
      catchError((error: any) => {
        console.error('❌ Error detallado al registrar horas:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerHistorialHoras(maquinaId: number): Observable<HistorialHoras[]> {
    const url = `${this.apiUrl}/${maquinaId}/horas/historial`;
    console.log('🔍 Obteniendo historial desde:', url);

    return this.http.get<HistorialHoras[]>(url).pipe(
      tap((response) => {
        console.log(`✅ Historial de horas para máquina ${maquinaId}:`, response);
      }),
      catchError((error: any) => {
        console.error('❌ Error al obtener historial de horas:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerHistorialHorasFiltrado(
    maquinaId: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<HistorialHoras[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    const url = `${this.apiUrl}/${maquinaId}/horas/historial`;
    console.log('🔍 Obteniendo historial filtrado desde:', url, 'con parámetros:', params.toString());

    return this.http.get<HistorialHoras[]>(url, { params }).pipe(
      tap((response) => {
        console.log(`✅ Historial filtrado para máquina ${maquinaId}:`, response);
      }),
      catchError((error: any) => {
        console.error('❌ Error al obtener historial filtrado:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerEstadisticasHoras(
    maquinaId: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<EstadisticasHoras> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    const url = `${this.apiUrl}/${maquinaId}/horas/estadisticas`;

    return this.http.get<EstadisticasHoras>(url, { params }).pipe(
      tap((response) => {
        console.log(`📊 Estadísticas para máquina ${maquinaId}:`, response);
      }),
      catchError((error: any) => {
        console.error('❌ Error al obtener estadísticas:', error);
        return throwError(() => error);
      })
    );
  }

  // ========== UTILIDADES ==========

  validarRegistroHoras(registro: RegistroHoras): boolean {
    const esValido = (
      registro.maquina_id > 0 &&
      registro.horas_trabajadas > 0 &&
      registro.fecha !== '' &&
      !isNaN(Date.parse(registro.fecha))
    );

    if (!esValido) {
      console.warn('❌ Registro de horas inválido:', registro);
    }

    return esValido;
  }

  formatearHoras(horas: number): string {
    return horas % 1 === 0 ? horas.toString() : horas.toFixed(2);
  }
}