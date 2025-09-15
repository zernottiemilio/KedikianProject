// machines.service.ts - CORREGIDO
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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

/**
 * Interfaz para el registro de horas trabajadas de una máquina en un proyecto específico
 */
export interface RegistroHoras {
  maquina_id: number;
  proyecto_id: number;
  horas_trabajadas: number;
  fecha: string; // YYYY-MM-DDTHH:mm:ss
}

/**
 * Interfaz para el historial de horas trabajadas
 */
export interface HistorialHoras {
  id: number;
  maquina_id: number;
  proyecto_id: number;
  horas_trabajadas: number;
  fecha: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interfaz para estadísticas de horas
 */
export interface EstadisticasHoras {
  total_horas: number;
  total_registros: number;
  promedio_horas: number;
  fecha_primer_registro?: string;
  fecha_ultimo_registro?: string;
  proyectos_involucrados: number;
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

  // ========== GESTIÓN DE HORAS EN PROYECTOS ==========

  registrarHorasEnProyecto(registro: RegistroHoras): Observable<any> {
    const body = {
      horas: registro.horas_trabajadas,
      fecha: registro.fecha
    };

    const url = `${this.apiUrl}/${registro.maquina_id}/proyectos/${registro.proyecto_id}/horas`;
    console.log('URL del endpoint:', url);
    console.log('Body:', body);

    return this.http.post<any>(url, body).pipe(
      tap((response: any) => {
        console.log('Respuesta del servidor:', response);
      }),
      catchError((error: any) => {
        console.error('Error detallado:', error);
        throw error;
      })
    );
  }

  /**
   * Historial completo de proyectos de una máquina
   */
  obtenerHistorialHoras(maquinaId: number): Observable<HistorialHoras[]> {
    const url = `${this.apiUrl}/${maquinaId}/historial-proyectos`;
    
    return this.http.get<HistorialHoras[]>(url).pipe(
      tap((response) => {
        console.log(`Historial de proyectos para máquina ${maquinaId}:`, response);
      }),
      catchError((error: any) => {
        console.error('Error al obtener historial de proyectos:', error);
        throw error;
      })
    );
  }

  /**
   * Historial filtrado por fechas y/o proyecto
   */
  obtenerHistorialHorasFiltrado(
    maquinaId: number, 
    fechaInicio?: string, 
    fechaFin?: string,
    proyectoId?: number
  ): Observable<HistorialHoras[]> {
    let params = new HttpParams();
    
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);
    if (proyectoId) params = params.set('proyecto_id', proyectoId.toString());

    const url = `${this.apiUrl}/${maquinaId}/historial-proyectos`;
    
    return this.http.get<HistorialHoras[]>(url, { params }).pipe(
      tap((response) => {
        console.log(`Historial filtrado para máquina ${maquinaId}:`, response);
      }),
      catchError((error: any) => {
        console.error('Error al obtener historial filtrado:', error);
        throw error;
      })
    );
  }

  /**
   * Horas de una máquina en un proyecto específico
   * (usa historial-proyectos filtrado por proyecto_id)
   */
  obtenerHorasEnProyecto(maquinaId: number, proyectoId: number): Observable<HistorialHoras[]> {
    const url = `${this.apiUrl}/${maquinaId}/historial-proyectos`;
    const params = new HttpParams().set('proyecto_id', proyectoId.toString());
    
    return this.http.get<HistorialHoras[]>(url, { params }).pipe(
      tap((response) => {
        console.log(`Horas en proyecto ${proyectoId} para máquina ${maquinaId}:`, response);
      }),
      catchError((error: any) => {
        console.error('Error al obtener horas del proyecto:', error);
        throw error;
      })
    );
  }

  // ========== ESTADÍSTICAS Y REPORTES ==========

  obtenerEstadisticasHoras(
    maquinaId: number, 
    fechaInicio?: string, 
    fechaFin?: string
  ): Observable<EstadisticasHoras> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    const url = `${this.apiUrl}/${maquinaId}/estadisticas-horas`;
    
    return this.http.get<EstadisticasHoras>(url, { params }).pipe(
      tap((response) => {
        console.log(`Estadísticas para máquina ${maquinaId}:`, response);
      }),
      catchError((error: any) => {
        console.error('Error al obtener estadísticas:', error);
        throw error;
      })
    );
  }

  obtenerResumenHorasPorProyecto(maquinaId: number): Observable<any[]> {
    const url = `${this.apiUrl}/${maquinaId}/horas/resumen-proyectos`;
    
    return this.http.get<any[]>(url).pipe(
      tap((response) => {
        console.log(`Resumen por proyectos para máquina ${maquinaId}:`, response);
      }),
      catchError((error: any) => {
        console.error('Error al obtener resumen por proyectos:', error);
        throw error;
      })
    );
  }

  // ========== UTILIDADES ==========

  validarRegistroHoras(registro: RegistroHoras): boolean {
    return (
      registro.maquina_id > 0 &&
      registro.proyecto_id > 0 &&
      registro.horas_trabajadas > 0 &&
      registro.fecha !== '' &&
      !isNaN(Date.parse(registro.fecha))
    );
  }

  formatearHoras(horas: number): string {
    return horas % 1 === 0 ? horas.toString() : horas.toFixed(2);
  }
}
