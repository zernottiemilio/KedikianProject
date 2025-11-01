import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BalanceService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // =====================
  // Gastos (Egresos)
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
  const formData = new FormData();

  formData.append('usuario_id', gasto.usuario_id.toString());
  formData.append('tipo', gasto.tipo);
  formData.append('importe_total', gasto.importe_total.toString());
  formData.append('fecha', gasto.fecha);

  if (gasto.descripcion) {
    formData.append('descripcion', gasto.descripcion);
  }
  
  if (gasto.maquina_id !== null && gasto.maquina_id !== undefined && gasto.maquina_id !== '') {
    formData.append('maquina_id', gasto.maquina_id.toString());
  }

  if (imagen) {
    formData.append('imagen', imagen, imagen.name);
  }

  // NO PONGAS HEADERS AQUÍ - el navegador los maneja automáticamente
  return this.http.post<any>(`${this.apiUrl}/gastos/`, formData);
  // NO esto: return this.http.post<any>(`${this.apiUrl}/gastos/`, formData, { headers: ... });
}

actualizarGasto(id: number, gasto: any, imagen?: File): Observable<any> {
  const formData = new FormData();

  // Campos obligatorios
  formData.append('usuario_id', gasto.usuario_id.toString());
  formData.append('tipo', gasto.tipo);
  formData.append('importe_total', gasto.importe_total.toString());
  formData.append('fecha', gasto.fecha);

  // Campos opcionales - SOLO agregar si tienen valor
  if (gasto.descripcion) {
    formData.append('descripcion', gasto.descripcion);
  }
  
  if (gasto.maquina_id !== null && gasto.maquina_id !== undefined && gasto.maquina_id !== '') {
    formData.append('maquina_id', gasto.maquina_id.toString());
  }

  if (imagen) {
    formData.append('imagen', imagen, imagen.name);
  }

  return this.http.put<any>(`${this.apiUrl}/gastos/${id}`, formData);
}


  eliminarGasto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/gastos/${id}`);
  }

  // =====================
  // Pagos (Ingresos)
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
  // Datos Relacionados
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
  // Resumen y Estadísticas
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
