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
  proximo_mantenimiento?: number | null;
}

export interface NotaMaquina {
  id: number;
  maquina_id: number;
  texto: string;
  fecha: string;
  usuario: string;
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
    return this.http.get<Maquina[]>(this.apiUrl).pipe(
      tap(maquinas => console.log('📥 Máquinas RAW del backend:', maquinas)),
      map(maquinas => maquinas.map(m => {
        // Convertir estado a booleano real (el backend puede enviar 0/1, "true"/"false", etc.)
        const estadoOriginal = (m as any).estado;
        const estadoConvertido = estadoOriginal === true || estadoOriginal === 1 || estadoOriginal === 'true' || estadoOriginal === 'activa';
        console.log(`🔄 ${m.nombre}: estado=${estadoOriginal} (${typeof estadoOriginal}) -> ${estadoConvertido}`);
        return {
          ...m,
          estado: estadoConvertido
        };
      })),
      tap(maquinas => console.log('✅ Máquinas CONVERTIDAS:', maquinas))
    );
  }

  obtenerMaquinaPorId(id: number): Observable<Maquina> {
    return this.http.get<Maquina>(`${this.apiUrl}/${id}`).pipe(
      map(m => {
        const estado = (m as any).estado;
        return {
          ...m,
          estado: estado === true || estado === 1 || estado === 'true' || estado === 'activa'
        };
      })
    );
  }

  crearMaquina(maquina: Omit<Maquina, 'id'>): Observable<Maquina> {
    // ✅ IMPORTANTE: Crear un objeto NUEVO con SOLO el campo nombre
    // Esto evita que se envíen campos extras como "estado"
    const payload = {
      nombre: String(maquina.nombre).trim()
    };
    
    console.log('🔍 Datos que llegan al servicio:', maquina);
    console.log('🔍 Payload LIMPIO a enviar:', payload);
    console.log('🔍 Claves del payload:', Object.keys(payload));
    console.log('🔍 JSON del payload:', JSON.stringify(payload));
    
    // Usar JSON.parse(JSON.stringify()) para asegurar que es un objeto limpio
    const payloadLimpio = JSON.parse(JSON.stringify(payload));
    
    console.log('🔍 Payload después de limpiar:', payloadLimpio);
    console.log('🔍 Tiene "estado"?:', 'estado' in payloadLimpio);
    
    return this.http.post<Maquina>(this.apiUrl, payloadLimpio).pipe(
      tap(response => console.log('✅ Respuesta exitosa del servidor:', response)),
      catchError(error => {
        console.error('❌ Error en la petición:', error);
        console.error('❌ URL:', this.apiUrl);
        console.error('❌ Payload enviado:', payloadLimpio);
        if (error.error) {
          console.error('❌ Detalle del error:', error.error);
        }
        return throwError(() => error);
      })
    );
  }

  actualizarMaquina(maquina: Maquina): Observable<Maquina> {
    // Convertir estado booleano a número para el backend
    const payload = {
      ...maquina,
      estado: maquina.estado ? 1 : 0
    };
    console.log('📤 Actualizando máquina - payload:', payload);
    console.log('📤 Estado enviado:', payload.estado, typeof payload.estado);

    return this.http.put<Maquina>(`${this.apiUrl}/${maquina.id}`, payload).pipe(
      tap(response => console.log('✅ Respuesta del servidor:', response)),
      catchError(error => {
        console.error('❌ Error al actualizar máquina:', error);
        return throwError(() => error);
      })
    );
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

  // ========== HORÓMETRO INICIAL ==========
  obtenerHorasIniciales(): Observable<Record<number, number>> {
    const url = `${this.apiUrl}/horometro-inicial`;
    return this.http.get<Record<number, number>>(url).pipe(
      tap(response => console.log('⏱️ Horómetro inicial cargado:', response)),
      catchError(error => throwError(() => error))
    );
  }

  obtenerHorometroInicial(maquinaId: number): Observable<number> {
    const url = `${this.apiUrl}/${maquinaId}/horometro-inicial`;
    return this.http.get<{ horometro_inicial: number }>(url).pipe(
      tap(response => console.log(`⏱️ Horómetro inicial de máquina ${maquinaId}:`, response.horometro_inicial)),
      map(response => response.horometro_inicial ?? 0),
      catchError(error => {
        console.error(`Error al obtener horómetro inicial de máquina ${maquinaId}:`, error);
        return of(0);
      })
    );
  }

  // 🆕 NUEVO: Actualizar horómetro inicial
  actualizarHorometroInicial(maquinaId: number, nuevoHorometro: number): Observable<any> {
    const url = `${this.apiUrl}/${maquinaId}/horometro-inicial`;
    const body = { horometro_inicial: nuevoHorometro };
    console.log('⏱️ Actualizando horómetro inicial en:', url, 'con body:', body);
    return this.http.put<any>(url, body).pipe(
      tap((response: any) => console.log('✅ Horómetro actualizado:', response)),
      catchError((error: any) => {
        console.error('❌ Error al actualizar horómetro:', error);
        return throwError(() => error);
      })
    );
  }

  // ========== GESTIÓN DE NOTAS ==========
  obtenerNotasMaquina(maquinaId: number): Observable<NotaMaquina[]> {
    const url = `${this.apiUrl}/${maquinaId}/notas`;
    return this.http.get<NotaMaquina[]>(url).pipe(
      tap(response => console.log(`📝 Notas de máquina ${maquinaId} cargadas:`, response)),
      catchError(error => {
        console.error(`Error al obtener notas de máquina ${maquinaId}:`, error);
        return throwError(() => error);
      })
    );
  }

  crearNota(maquinaId: number, texto: string): Observable<NotaMaquina> {
    const url = `${this.apiUrl}/${maquinaId}/notas`;
    const body = { texto };
    console.log('📝 Creando nota en:', url, 'con texto:', texto);
    return this.http.post<NotaMaquina>(url, body).pipe(
      tap(response => console.log('✅ Nota creada:', response)),
      catchError(error => {
        console.error('❌ Error al crear nota:', error);
        return throwError(() => error);
      })
    );
  }

  eliminarNota(notaId: number): Observable<void> {
    const url = `${this.apiUrl}/notas/${notaId}`;
    console.log('🗑️ Eliminando nota:', notaId);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log('✅ Nota eliminada:', notaId)),
      catchError(error => {
        console.error('❌ Error al eliminar nota:', error);
        return throwError(() => error);
      })
    );
  }

  // ========== GESTIÓN DE PRÓXIMO MANTENIMIENTO ==========
  actualizarProximoMantenimiento(maquinaId: number, horas: number): Observable<Maquina> {
    const url = `${this.apiUrl}/${maquinaId}/proximo-mantenimiento`;
    const body = { horas };
    console.log('🔧 Actualizando próximo mantenimiento en:', url, 'con horas:', horas);
    return this.http.put<Maquina>(url, body).pipe(
      tap(response => console.log('✅ Próximo mantenimiento actualizado:', response)),
      catchError(error => {
        console.error('❌ Error al actualizar próximo mantenimiento:', error);
        return throwError(() => error);
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