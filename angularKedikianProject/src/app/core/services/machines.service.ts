import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Maquina {
  id: number;
  codigo: string;
  nombre: string;
  estado: boolean;
  horas_uso: number;
}

export interface RegistroHoras {
  maquina_id: number;
  horas_trabajadas: number;
  fecha: string; // YYYY-MM-DD
  descripcion?: string;
}

export interface HistorialHoras {
  id: number;
  maquina_id: number;
  horas_trabajadas: number;
  fecha: string;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
}

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

  // ========== GESTIÓN DE HORAS ==========
  registrarHoras(registro: RegistroHoras): Observable<any> {
    const url = `${this.apiUrl}/${registro.maquina_id}/horas`;
    const body = {
      horas: registro.horas_trabajadas,
      fecha: registro.fecha,
      descripcion: registro.descripcion || ''
    };
    console.log('⏱️ Registrando horas en:', url, 'con body:', body);
    return this.http.post<any>(url, body).pipe(
      tap((response: any) => console.log('✅ Respuesta del servidor al registrar horas:', response)),
      catchError((error: any) => throwError(() => error))
    );
  }

  obtenerHistorialHoras(maquinaId: number): Observable<HistorialHoras[]> {
    return this.http.get<HistorialHoras[]>(`${this.apiUrl}/${maquinaId}/horas/historial`);
  }

  obtenerEstadisticasHoras(maquinaId: number, fechaInicio?: string, fechaFin?: string): Observable<EstadisticasHoras> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);
    return this.http.get<EstadisticasHoras>(`${this.apiUrl}/${maquinaId}/horas/estadisticas`, { params });
  }

  // ====================== NUEVO MÉTODO: HORÓMETRO INICIAL DESDE REPORTES ======================
  obtenerHorasIniciales(): Observable<Record<number, number>> {
    const url = `${this.apiUrl}/horometro-inicial`;
    return this.http.get<Record<number, number>>(url).pipe(
      tap(response => console.log('⏱️ Horómetro inicial cargado:', response)),
      catchError(error => throwError(() => error))
    );
  }
  // ====================== NUEVO MÉTODO: HORÓMETRO INICIAL POR MÁQUINA ======================
obtenerHorometroInicial(maquinaId: number): Observable<number> {
  const url = `${this.apiUrl}/${maquinaId}/horometro-inicial`;
  return this.http.get<{ horometro_inicial: number }>(url).pipe(
    tap(response => console.log(`⏱️ Horómetro inicial de máquina ${maquinaId}:`, response.horometro_inicial)),
    // Extraemos directamente el valor del horómetro
    map(response => response.horometro_inicial ?? 0),
    catchError(error => {
      console.error(`Error al obtener horómetro inicial de máquina ${maquinaId}:`, error);
      return of(0); // Si falla, devolvemos 0
    })
  );
}

  // ========== UTILIDADES ==========
  validarRegistroHoras(registro: RegistroHoras): boolean {
    return (
      registro.maquina_id > 0 &&
      registro.horas_trabajadas > 0 &&
      registro.fecha !== '' &&
      !isNaN(Date.parse(registro.fecha))
    );
  }

  formatearHoras(horas: number): string {
    return horas % 1 === 0 ? horas.toString() : horas.toFixed(2);
  }
}
