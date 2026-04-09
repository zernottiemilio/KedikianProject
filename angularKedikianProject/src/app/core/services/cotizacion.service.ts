import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Cliente,
  ClienteOut,
  ServicioPredefinido,
  Cotizacion,
  CotizacionOut,
  CotizacionCreate,
  CotizacionUpdate,
  CotizacionItem
} from '../models/cotizacion.models';

@Injectable({
  providedIn: 'root',
})
export class CotizacionService {
  private apiUrl = `${environment.apiUrl}/cotizaciones`;

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
  // Gestión de Clientes
  // ------------------------

  /**
   * Obtiene lista de clientes (por defecto solo los visibles)
   */
  getClientes(incluirOcultos: boolean = false): Observable<ClienteOut[]> {
    const params = incluirOcultos ? '?incluir_ocultos=true' : '';
    return this.http.get<ClienteOut[]>(
      `${this.apiUrl}/clientes${params}`,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Clientes obtenidos:', response);
      }),
      catchError(this.handleError<ClienteOut[]>('getClientes', []))
    );
  }

  /**
   * Crea un nuevo cliente
   */
  crearCliente(cliente: Cliente): Observable<ClienteOut> {
    return this.http.post<ClienteOut>(
      `${this.apiUrl}/clientes`,
      cliente,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Cliente creado:', response);
      }),
      catchError(this.handleError<ClienteOut>('crearCliente'))
    );
  }

  /**
   * Oculta un cliente (no aparecerá en el selector)
   */
  ocultarCliente(clienteId: number): Observable<ClienteOut> {
    return this.http.put<ClienteOut>(
      `${this.apiUrl}/clientes/${clienteId}/ocultar`,
      {},
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Cliente ocultado:', response);
      }),
      catchError(this.handleError<ClienteOut>('ocultarCliente'))
    );
  }

  /**
   * Muestra un cliente oculto (volverá a aparecer en el selector)
   */
  mostrarCliente(clienteId: number): Observable<ClienteOut> {
    return this.http.put<ClienteOut>(
      `${this.apiUrl}/clientes/${clienteId}/mostrar`,
      {},
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Cliente mostrado:', response);
      }),
      catchError(this.handleError<ClienteOut>('mostrarCliente'))
    );
  }

  // ------------------------
  // Servicios Predefinidos
  // ------------------------

  /**
   * Obtiene lista de servicios predefinidos (áridos + máquinas con precios)
   */
  getServiciosPredefinidos(): Observable<ServicioPredefinido[]> {
    return this.http.get<any>(
      `${this.apiUrl}/servicios-predefinidos`,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Servicios predefinidos obtenidos:', response);
      }),
      map((response) => {
        // Si la respuesta es un objeto con propiedad 'servicios', extraerla
        if (response && response.servicios && Array.isArray(response.servicios)) {
          return response.servicios;
        }
        // Si ya es un array, devolverlo directamente
        if (Array.isArray(response)) {
          return response;
        }
        // Si no, devolver array vacío
        return [];
      }),
      catchError(this.handleError<ServicioPredefinido[]>('getServiciosPredefinidos', []))
    );
  }

  // ------------------------
  // Gestión de Cotizaciones
  // ------------------------

  /**
   * Obtiene lista de cotizaciones
   */
  getCotizaciones(): Observable<CotizacionOut[]> {
    return this.http.get<CotizacionOut[]>(
      `${this.apiUrl}/cotizaciones`,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Cotizaciones obtenidas:', response);
      }),
      catchError(this.handleError<CotizacionOut[]>('getCotizaciones', []))
    );
  }

  /**
   * Obtiene una cotización específica por ID
   */
  getCotizacion(cotizacionId: number): Observable<CotizacionOut> {
    return this.http.get<CotizacionOut>(
      `${this.apiUrl}/cotizaciones/${cotizacionId}`,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Cotización obtenida:', response);
      }),
      catchError(this.handleError<CotizacionOut>('getCotizacion'))
    );
  }

  /**
   * Crea una nueva cotización
   */
  crearCotizacion(cotizacion: CotizacionCreate): Observable<CotizacionOut> {
    return this.http.post<CotizacionOut>(
      `${this.apiUrl}/cotizaciones`,
      cotizacion,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Cotización creada:', response);
      }),
      catchError(this.handleError<CotizacionOut>('crearCotizacion'))
    );
  }

  /**
   * Actualiza una cotización (estado, observaciones, fecha_validez)
   */
  actualizarCotizacion(
    cotizacionId: number,
    data: CotizacionUpdate
  ): Observable<CotizacionOut> {
    return this.http.put<CotizacionOut>(
      `${this.apiUrl}/cotizaciones/${cotizacionId}`,
      data,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Cotización actualizada:', response);
      }),
      catchError(this.handleError<CotizacionOut>('actualizarCotizacion'))
    );
  }

  /**
   * Actualiza los items de una cotización (precios editados)
   */
  actualizarItems(
    cotizacionId: number,
    items: CotizacionItem[]
  ): Observable<CotizacionOut> {
    return this.http.put<CotizacionOut>(
      `${this.apiUrl}/cotizaciones/${cotizacionId}/items`,
      { items },
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap((response) => {
        console.log('Items de cotización actualizados:', response);
      }),
      catchError(this.handleError<CotizacionOut>('actualizarItems'))
    );
  }

  /**
   * Elimina una cotización
   */
  eliminarCotizacion(cotizacionId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/cotizaciones/${cotizacionId}`,
      {
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap(() => {
        console.log('Cotización eliminada:', cotizacionId);
      }),
      catchError(this.handleError<void>('eliminarCotizacion'))
    );
  }

  // ------------------------
  // Exportación
  // ------------------------

  /**
   * Exporta una cotización a PDF
   */
  exportarPDF(cotizacionId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/cotizaciones/${cotizacionId}/pdf`,
      {
        responseType: 'blob',
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap(() => {
        console.log('PDF generado para cotización:', cotizacionId);
      }),
      catchError((error) => {
        console.error('Error al generar PDF:', error);
        return of(new Blob());
      })
    );
  }

  /**
   * Exporta una cotización a Excel
   */
  exportarExcel(cotizacionId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/cotizaciones/${cotizacionId}/excel`,
      {
        responseType: 'blob',
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap(() => {
        console.log('Excel generado para cotización:', cotizacionId);
      }),
      catchError((error) => {
        console.error('Error al generar Excel:', error);
        return of(new Blob());
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
