import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces
export interface Producto {
  id: number;
  nombre: string;
  codigo_producto: string;
  inventario: number;
  created_at?: string;
  updated_at?: string;
}

export interface MovimientoProducto {
  id: number;
  producto_id: number;
  usuario_id: number;
  cantidad: number;
  fecha: Date | string;
  tipo_transaccion: 'entrada' | 'salida';
  // Campos adicionales para mostrar en la UI
  nombre_producto?: string;
  codigo_producto?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NuevoProducto {
  nombre: string;
  codigo_producto: string;
  inventario: number;
}

export interface NuevoMovimiento {
  producto_id: number;
  cantidad: number;
  tipo_transaccion: 'entrada' | 'salida';
}

export interface RespuestaAPI<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

export interface RespuestaPaginada<T> {
  success: boolean;
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  message?: string;
}

export interface FiltrosProducto {
  termino?: string;
  tipo_filtro?: 'todos' | 'nombre' | 'codigo' | 'stock_bajo';
  pagina?: number;
  limite?: number;
  stock_minimo?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private readonly baseUrl = `${environment.apiUrl}/inventario`;
  private readonly productosEndpoint = `${environment.apiUrl}/productos`;
  private readonly movimientosEndpoint = `${environment.apiUrl}/movimientos-inventario`;

  constructor(private http: HttpClient) {}

  // ========== MÉTODOS PARA PRODUCTOS ==========

  /**
   * Obtiene todos los productos con filtros opcionales
   */
  obtenerProductos(filtros?: FiltrosProducto): Observable<RespuestaPaginada<Producto>> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.termino) {
        params = params.set('termino', filtros.termino);
      }
      if (filtros.tipo_filtro && filtros.tipo_filtro !== 'todos') {
        params = params.set('tipo_filtro', filtros.tipo_filtro);
      }
      if (filtros.pagina) {
        params = params.set('page', filtros.pagina.toString());
      }
      if (filtros.limite) {
        params = params.set('limit', filtros.limite.toString());
      }
      if (filtros.stock_minimo) {
        params = params.set('stock_minimo', filtros.stock_minimo.toString());
      }
    }

    return this.http.get<RespuestaPaginada<Producto>>(this.productosEndpoint, { params })
      .pipe(
        map(response => {
          // Convertir fechas de string a Date si es necesario
          response.data = response.data.map(producto => ({
            ...producto,
            created_at: producto.created_at ? producto.created_at : undefined,
            updated_at: producto.updated_at ? producto.updated_at : undefined
          }));
          return response;
        }),
        catchError(this.manejarError)
      );
  }

  /**
   * Obtiene un producto por su ID
   */
  obtenerProductoPorId(id: number): Observable<RespuestaAPI<Producto>> {
    return this.http.get<RespuestaAPI<Producto>>(`${this.productosEndpoint}/${id}`)
      .pipe(catchError(this.manejarError));
  }

  /**
   * Crea un nuevo producto
   */
  crearProducto(producto: NuevoProducto | FormData): Observable<RespuestaAPI<Producto>> {
    return this.http.post<RespuestaAPI<Producto>>(this.productosEndpoint, producto)
      .pipe(catchError(this.manejarError));
  }

  /**
   * Actualiza un producto existente
   */
  actualizarProducto(id: number, producto: Partial<NuevoProducto>): Observable<RespuestaAPI<Producto>> {
    return this.http.put<RespuestaAPI<Producto>>(`${this.productosEndpoint}/${id}`, producto)
      .pipe(catchError(this.manejarError));
  }

  /**
   * Elimina un producto
   */
  eliminarProducto(id: number): Observable<RespuestaAPI<any>> {
    return this.http.delete<RespuestaAPI<any>>(`${this.productosEndpoint}/${id}`)
      .pipe(catchError(this.manejarError));
  }

  /**
   * Verifica si un código de producto ya existe
   */
  verificarCodigoProducto(codigo: string, excluirId?: number): Observable<RespuestaAPI<{ existe: boolean }>> {
    let params = new HttpParams().set('codigo', codigo);
    if (excluirId) {
      params = params.set('excluir_id', excluirId.toString());
    }

    return this.http.get<RespuestaAPI<{ existe: boolean }>>(`${this.productosEndpoint}/verificar-codigo`, { params })
      .pipe(catchError(this.manejarError));
  }

  /**
   * Obtiene productos con stock bajo
   */
  obtenerProductosStockBajo(limite: number = 10): Observable<RespuestaAPI<Producto[]>> {
    const params = new HttpParams().set('stock_maximo', limite.toString());
    
    return this.http.get<RespuestaAPI<Producto[]>>(`${this.productosEndpoint}/stock-bajo`, { params })
      .pipe(catchError(this.manejarError));
  }

  // ========== MÉTODOS PARA MOVIMIENTOS ==========

  /**
   * Obtiene todos los movimientos con filtros opcionales
   */
  obtenerMovimientos(filtros?: { 
    producto_id?: number; 
    tipo?: 'entrada' | 'salida'; 
    fecha_inicio?: string;
    fecha_fin?: string;
    pagina?: number;
    limite?: number;
  }): Observable<RespuestaPaginada<MovimientoProducto>> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.producto_id) {
        params = params.set('producto_id', filtros.producto_id.toString());
      }
      if (filtros.tipo) {
        params = params.set('tipo', filtros.tipo);
      }
      if (filtros.fecha_inicio) {
        params = params.set('fecha_inicio', filtros.fecha_inicio);
      }
      if (filtros.fecha_fin) {
        params = params.set('fecha_fin', filtros.fecha_fin);
      }
      if (filtros.pagina) {
        params = params.set('page', filtros.pagina.toString());
      }
      if (filtros.limite) {
        params = params.set('limit', filtros.limite.toString());
      }
    }

    return this.http.get<RespuestaPaginada<MovimientoProducto>>(this.movimientosEndpoint, { params })
      .pipe(
        map(response => {
          // Convertir fechas de string a Date
          response.data = response.data.map(movimiento => ({
            ...movimiento,
            fecha: typeof movimiento.fecha === 'string' ? new Date(movimiento.fecha) : movimiento.fecha
          }));
          return response;
        }),
        catchError(this.manejarError)
      );
  }

  /**
   * Obtiene movimientos de un producto específico
   */
  obtenerMovimientosProducto(productoId: number, pagina: number = 1, limite: number = 50): Observable<RespuestaPaginada<MovimientoProducto>> {
    return this.obtenerMovimientos({ 
      producto_id: productoId, 
      pagina, 
      limite 
    });
  }

  /**
   * Registra un nuevo movimiento (entrada o salida)
   */
  registrarMovimiento(movimiento: NuevoMovimiento): Observable<RespuestaAPI<MovimientoProducto>> {
    return this.http.post<RespuestaAPI<MovimientoProducto>>(this.movimientosEndpoint, movimiento)
      .pipe(
        map(response => {
          // Convertir fecha de string a Date
          if (response.data && typeof response.data.fecha === 'string') {
            response.data.fecha = new Date(response.data.fecha);
          }
          return response;
        }),
        catchError(this.manejarError)
      );
  }

  /**
   * Obtiene el historial completo de movimientos
   */
  obtenerHistorialCompleto(): Observable<RespuestaAPI<MovimientoProducto[]>> {
    return this.http.get<RespuestaAPI<MovimientoProducto[]>>(`${this.movimientosEndpoint}/historial`)
      .pipe(
        map(response => {
          // Convertir fechas de string a Date
          response.data = response.data.map(movimiento => ({
            ...movimiento,
            fecha: typeof movimiento.fecha === 'string' ? new Date(movimiento.fecha) : movimiento.fecha
          }));
          return response;
        }),
        catchError(this.manejarError)
      );
  }

  // ========== MÉTODOS DE REPORTES Y EXPORTACIÓN ==========

  /**
   * Obtiene estadísticas del inventario
   */
  obtenerEstadisticas(): Observable<RespuestaAPI<{
    total_productos: number;
    valor_total_inventario: number;
    productos_stock_bajo: number;
    movimientos_hoy: number;
    entradas_mes: number;
    salidas_mes: number;
  }>> {
    return this.http.get<RespuestaAPI<any>>(`${this.baseUrl}/estadisticas`)
      .pipe(catchError(this.manejarError));
  }

  /**
   * Exporta el inventario a CSV
   */
  exportarInventarioCSV(): Observable<Blob> {
    return this.http.get(`${this.productosEndpoint}/export/csv`, { 
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv'
      }
    }).pipe(catchError(this.manejarError));
  }

  /**
   * Exporta los movimientos a CSV
   */
  exportarMovimientosCSV(filtros?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    producto_id?: number;
  }): Observable<Blob> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.fecha_inicio) {
        params = params.set('fecha_inicio', filtros.fecha_inicio);
      }
      if (filtros.fecha_fin) {
        params = params.set('fecha_fin', filtros.fecha_fin);
      }
      if (filtros.producto_id) {
        params = params.set('producto_id', filtros.producto_id.toString());
      }
    }

    return this.http.get(`${this.movimientosEndpoint}/export/csv`, { 
      params,
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv'
      }
    }).pipe(catchError(this.manejarError));
  }

  /**
   * Exporta reporte de inventario en PDF
   */
  exportarInventarioPDF(): Observable<Blob> {
    return this.http.get(`${this.productosEndpoint}/export/pdf`, { 
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    }).pipe(catchError(this.manejarError));
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  /**
   * Genera un código de producto automático
   */
  generarCodigoProducto(nombre: string): Observable<RespuestaAPI<{ codigo: string }>> {
    const body = { nombre };
    return this.http.post<RespuestaAPI<{ codigo: string }>>(`${this.productosEndpoint}/generar-codigo`, body)
      .pipe(catchError(this.manejarError));
  }

  /**
   * Valida el stock antes de realizar una salida
   */
  validarStock(productoId: number, cantidad: number): Observable<RespuestaAPI<{ valido: boolean; stock_actual: number }>> {
    const params = new HttpParams()
      .set('producto_id', productoId.toString())
      .set('cantidad', cantidad.toString());

    return this.http.get<RespuestaAPI<{ valido: boolean; stock_actual: number }>>(`${this.movimientosEndpoint}/validar-stock`, { params })
      .pipe(catchError(this.manejarError));
  }

  // ========== MANEJO DE ERRORES ==========

  private manejarError(error: any): Observable<never> {
    let mensajeError = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      mensajeError = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 0) {
        mensajeError = 'No se puede conectar con el servidor. Verifique su conexión a internet.';
      } else if (error.status >= 400 && error.status < 500) {
        mensajeError = error.error?.message || `Error del cliente (${error.status})`;
      } else if (error.status >= 500) {
        mensajeError = 'Error interno del servidor. Intente nuevamente más tarde.';
      }
    }

    console.error('Error en InventarioService:', error);
    return throwError(() => new Error(mensajeError));
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Descarga un archivo blob
   */
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Formatea fecha para envío al servidor
   */
  formatearFechaParaAPI(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }
}