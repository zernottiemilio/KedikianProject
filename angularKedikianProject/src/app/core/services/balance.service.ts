import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BalanceService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // =====================
  // Gastos (Egresos) - MÉTODOS CORREGIDOS
  // =====================
  getGastos(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    return this.http.get<any>(`${this.apiUrl}/gastos`, { params });
  }

  getGasto(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/gastos/${id}`);
  }

  crearGasto(gasto: any, imagen?: File): Observable<any> {
  console.log('=== CREANDO GASTO EN SERVICIO ===');
  console.log('Datos recibidos:', gasto);
  console.log('Imagen recibida:', imagen ? imagen.name : 'No hay imagen');
  
  const formData = new FormData();

  // ✅ Campos obligatorios
  formData.append('usuario_id', gasto.usuario_id.toString());
  formData.append('tipo', gasto.tipo);
  formData.append('importe_total', gasto.importe_total.toString());
  formData.append('fecha', gasto.fecha);
  formData.append('descripcion', gasto.descripcion || '');

  // ✅ CORRECCIÓN CRÍTICA: Solo agregar maquina_id si tiene un valor válido
  // El backend espera que NO esté presente si es null, no una string vacía
  if (gasto.maquina_id !== null && gasto.maquina_id !== undefined && gasto.maquina_id !== '') {
    formData.append('maquina_id', gasto.maquina_id.toString());
    console.log('✅ maquina_id agregado:', gasto.maquina_id);
  } else {
    console.log('ℹ️ maquina_id omitido (es null/undefined/vacío)');
    // NO agregamos el campo al FormData
  }

  // Adjuntar imagen si existe
  if (imagen) {
    formData.append('imagen', imagen);
    console.log('✅ imagen agregada:', imagen.name);
  }
  
  // Debug del FormData
  console.log('=== CONTENIDO FINAL DEL FORMDATA ===');
  formData.forEach((value, key) => {
    console.log(`${key}:`, value);
  });
  console.log('=== FIN CONTENIDO FORMDATA ===');

  return this.http.post<any>(`${this.apiUrl}/gastos`, formData);
}

actualizarGasto(id: number, gasto: any, imagen?: File): Observable<any> {
  console.log('=== ACTUALIZANDO GASTO EN SERVICIO ===');
  console.log('ID:', id);
  console.log('Datos recibidos:', gasto);
  console.log('Imagen recibida:', imagen ? imagen.name : 'No hay imagen');
  
  const formData = new FormData();

  // ✅ Para UPDATE, el backend espera maquina_id siempre (según el código mostrado)
  // Pero podemos enviarlo como 0 o null si no hay valor
  formData.append('usuario_id', gasto.usuario_id.toString());
  formData.append('tipo', gasto.tipo);
  formData.append('importe_total', gasto.importe_total.toString());
  formData.append('fecha', gasto.fecha);
  formData.append('descripcion', gasto.descripcion || '');
  
  // Para update, enviamos 0 si no hay maquina_id (ajustar según tu lógica de backend)
  if (gasto.maquina_id !== null && gasto.maquina_id !== undefined && gasto.maquina_id !== '') {
    formData.append('maquina_id', gasto.maquina_id.toString());
  } else {
    formData.append('maquina_id', '0'); // o el valor por defecto que maneje tu backend
  }

  if (imagen) {
    formData.append('imagen', imagen);
  }
  
  console.log('=== CONTENIDO DEL FORMDATA (UPDATE) ===');
  formData.forEach((value, key) => {
    console.log(`${key}:`, value);
  });

  return this.http.put<any>(`${this.apiUrl}/gastos/${id}`, formData);
}

  eliminarGasto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/gastos/${id}`);
  }

  // =====================
  // Pagos (Ingresos) - SIN CAMBIOS
  // =====================
  getPagos(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    return this.http.get<any>(`${this.apiUrl}/pagos`, { params });
  }

  getPago(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pagos/${id}`);
  }

  crearPago(pago: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pagos`, pago, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  actualizarPago(id: number, pago: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pagos/${id}`, pago, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  eliminarPago(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/pagos/${id}`);
  }

  // =====================
  // Datos Relacionados - SIN CAMBIOS
  // =====================
  getUsuarios(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/usuarios`);
  }

  getMaquinas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/maquinas`);
  }

  getProyectos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/proyectos`);
  }

  getProductos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/productos`);
  }

  // =====================
  // Resumen y Estadísticas - SIN CAMBIOS
  // =====================
  getResumenBalance(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    return this.http.get<any>(`${this.apiUrl}/resumen`, { params });
  }

  getEstadisticasPorTipo(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    return this.http.get<any>(`${this.apiUrl}/estadisticas/tipo`, { params });
  }

  getEstadisticasPorMes(anio: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas/mes`, {
      params: new HttpParams().set('anio', anio.toString()),
    });
  }
}