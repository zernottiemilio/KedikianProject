import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ResumenCuentaCorriente,
  ReporteCuentaCorriente,
  FiltrosCuentaCorriente,
  RequestGenerarReporte,
  RequestActualizarEstado,
  EstadoPago
} from '../models/cuenta-corriente.models';

@Injectable({
  providedIn: 'root',
})
export class CuentaCorrienteService {
  private apiUrl = `${environment.apiUrl}/cuenta-corriente`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const usuarioStr = localStorage.getItem('usuarioActual');
    let token = '';
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        token = usuario.access_token || usuario.token || '';
      } catch (error) {
        // Si hay error parseando, token queda vacío
      }
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ------------------------
  // Resumen de Cuenta Corriente
  // ------------------------

  /**
   * Obtiene el resumen de cuenta corriente para un proyecto específico
   * Incluye áridos y horas de máquinas con precios calculados
   */
  getResumenProyecto(
    proyectoId: number,
    filtros?: FiltrosCuentaCorriente
  ): Observable<ResumenCuentaCorriente> {
    let params = new HttpParams();

    // El backend espera periodo_inicio y periodo_fin, no fecha_inicio y fecha_fin
    if (filtros?.fecha_inicio) {
      params = params.set('periodo_inicio', filtros.fecha_inicio);
    }
    if (filtros?.fecha_fin) {
      params = params.set('periodo_fin', filtros.fecha_fin);
    }

    return this.http.get<ResumenCuentaCorriente>(
      `${this.apiUrl}/proyectos/${proyectoId}/resumen`,
      {
        params,
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Resumen de cuenta corriente obtenido:', response);
        console.log('Áridos en resumen:', response.aridos);
        if (response.aridos && response.aridos.length > 0) {
          response.aridos.forEach((arido, index) => {
            console.log(`Árido ${index}:`, {
              tipo: arido.tipo_arido,
              cantidad: arido.cantidad,
              precio_unitario: arido.precio_unitario,
              importe: arido.importe
            });
          });
        }
      }),
      catchError(this.handleError<ResumenCuentaCorriente>('getResumenProyecto'))
    );
  }

  // ------------------------
  // Gestión de Reportes
  // ------------------------

  /**
   * Obtiene lista de reportes de cuenta corriente
   */
  getReportes(proyectoId?: number): Observable<ReporteCuentaCorriente[]> {
    let params = new HttpParams();

    if (proyectoId) {
      params = params.set('proyecto_id', proyectoId.toString());
    }

    return this.http.get<ReporteCuentaCorriente[]>(
      `${this.apiUrl}/reportes`,
      {
        params,
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Reportes obtenidos:', response);
      }),
      catchError(this.handleError<ReporteCuentaCorriente[]>('getReportes', []))
    );
  }

  /**
   * Obtiene un reporte específico por ID
   */
  getReporte(reporteId: number): Observable<ReporteCuentaCorriente> {
    return this.http.get<ReporteCuentaCorriente>(
      `${this.apiUrl}/reportes/${reporteId}`,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Reporte obtenido:', response);
      }),
      catchError(this.handleError<ReporteCuentaCorriente>('getReporte'))
    );
  }

  /**
   * Obtiene el detalle completo de un reporte con items individuales
   */
  getReporteDetalle(reporteId: number): Observable<ReporteCuentaCorriente> {
    return this.http.get<ReporteCuentaCorriente>(
      `${this.apiUrl}/reportes/${reporteId}/detalle`,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Detalle de reporte obtenido:', response);
      }),
      catchError(this.handleError<ReporteCuentaCorriente>('getReporteDetalle'))
    );
  }

  /**
   * Actualiza el estado de pago de items individuales de un reporte
   */
  actualizarItemsPago(reporteId: number, items: {
    aridos?: { tipo_arido: string, pagado: boolean }[],
    horas?: { maquina_id: number, pagado: boolean }[]
  }): Observable<ReporteCuentaCorriente> {
    return this.http.put<ReporteCuentaCorriente>(
      `${this.apiUrl}/reportes/${reporteId}/items-pago`,
      items,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Items de pago actualizados:', response);
      }),
      catchError(this.handleError<ReporteCuentaCorriente>('actualizarItemsPago'))
    );
  }

  /**
   * Genera un nuevo reporte de cuenta corriente
   */
  generarReporte(request: RequestGenerarReporte): Observable<ReporteCuentaCorriente> {
    return this.http.post<ReporteCuentaCorriente>(
      `${this.apiUrl}/reportes`,
      request,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Reporte generado:', response);
      }),
      catchError(this.handleError<ReporteCuentaCorriente>('generarReporte'))
    );
  }

  /**
   * Actualiza el estado de pago de un reporte
   */
  actualizarEstadoPago(
    reporteId: number,
    request: RequestActualizarEstado
  ): Observable<ReporteCuentaCorriente> {
    return this.http.put<ReporteCuentaCorriente>(
      `${this.apiUrl}/reportes/${reporteId}/estado`,
      request,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Estado de pago actualizado:', response);
      }),
      catchError(this.handleError<ReporteCuentaCorriente>('actualizarEstadoPago'))
    );
  }

  /**
   * Elimina un reporte
   */
  eliminarReporte(reporteId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/reportes/${reporteId}`,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap(() => {
        console.log('Reporte eliminado:', reporteId);
      }),
      catchError(this.handleError<void>('eliminarReporte'))
    );
  }

  // ------------------------
  // Exportación
  // ------------------------

  /**
   * Exporta un reporte a PDF
   */
  exportarPDF(reporteId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/reportes/${reporteId}/pdf`,
      {
        responseType: 'blob',
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap(() => {
        console.log('PDF generado para reporte:', reporteId);
      }),
      catchError((error) => {
        console.error('Error al generar PDF:', error);
        return of(new Blob());
      })
    );
  }

  /**
   * Exporta un reporte a Excel
   */
  exportarExcel(reporteId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/reportes/${reporteId}/excel`,
      {
        responseType: 'blob',
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap(() => {
        console.log('Excel generado para reporte:', reporteId);
      }),
      catchError((error) => {
        console.error('Error al generar Excel:', error);
        return of(new Blob());
      })
    );
  }

  // ------------------------
  // Precios y Tarifas
  // ------------------------

  /**
   * Obtiene la tarifa por hora de una máquina
   */
  getTarifaMaquina(maquinaId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/maquinas/${maquinaId}/tarifa`,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Tarifa de máquina obtenida:', response);
      }),
      catchError(this.handleError<any>('getTarifaMaquina'))
    );
  }

  /**
   * Obtiene todos los precios de áridos
   */
  getPreciosAridos(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/aridos/precios`,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Precios de áridos obtenidos:', response);
      }),
      catchError(this.handleError<any[]>('getPreciosAridos', []))
    );
  }

  /**
   * Actualiza el precio unitario de áridos para un proyecto y período específico
   */
  actualizarPrecioArido(
    proyectoId: number,
    tipoArido: string,
    nuevoPrecio: number,
    periodoInicio: string,
    periodoFin: string
  ): Observable<any> {
    const body = {
      tipo_arido: tipoArido,
      nuevo_precio: nuevoPrecio,
      periodo_inicio: periodoInicio,
      periodo_fin: periodoFin
    };

    return this.http.put<any>(
      `${this.apiUrl}/proyectos/${proyectoId}/aridos/actualizar-precio`,
      body,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Precio de árido actualizado:', response);
      }),
      catchError((error) => {
        console.error('actualizarPrecioArido failed:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza la tarifa por hora de máquinas para un proyecto y período específico
   */
  actualizarTarifaMaquina(
    proyectoId: number,
    maquinaId: number,
    nuevaTarifa: number,
    periodoInicio: string,
    periodoFin: string
  ): Observable<any> {
    const body = {
      maquina_id: maquinaId,
      nueva_tarifa: nuevaTarifa,
      periodo_inicio: periodoInicio,
      periodo_fin: periodoFin
    };

    return this.http.put<any>(
      `${this.apiUrl}/proyectos/${proyectoId}/maquinas/actualizar-tarifa`,
      body,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Tarifa de máquina actualizada:', response);
      }),
      catchError((error) => {
        console.error('actualizarTarifaMaquina failed:', error);
        throw error;
      })
    );
  }

  // ------------------------
  // Utilidades para descargas
  // ------------------------

  /**
   * Descarga un archivo blob con el nombre especificado
   */
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // ------------------------
  // Manejo de errores
  // ------------------------
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);

      if (error.status === 401) {
        console.error('No autorizado - redirigir a login');
      }

      return of(result as T);
    };
  }
}
