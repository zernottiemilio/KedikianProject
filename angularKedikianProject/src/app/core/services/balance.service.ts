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

  // =====================
  // Gastos (Egresos)
  // =====================
  getGastos(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    return this.http.get<any>(`${this.apiUrl}/gastos`, { params, headers: this.getAuthHeaders() });
  }

  getGasto(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/gastos/${id}`, { headers: this.getAuthHeaders() });
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

  const token = localStorage.getItem('token') || '';
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.post<any>(`${this.apiUrl}/gastos/`, formData, { headers });
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

  const token = localStorage.getItem('token') || '';
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.put<any>(`${this.apiUrl}/gastos/${id}`, formData, { headers });
}


  eliminarGasto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/gastos/${id}`, { headers: this.getAuthHeaders() });
  }

  // =====================
  // Pagos (Ingresos)
  // =====================
  getPagos(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    return this.http.get<any>(`${this.apiUrl}/pagos`, { params, headers: this.getAuthHeaders() });
  }

  getPago(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pagos/${id}`, { headers: this.getAuthHeaders() });
  }

  crearPago(pago: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pagos`, pago, {
      headers: this.getAuthHeaders()
    });
  }

  actualizarPago(id: number, pago: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pagos/${id}`, pago, {
      headers: this.getAuthHeaders()
    });
  }

  eliminarPago(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/pagos/${id}`, { headers: this.getAuthHeaders() });
  }

  // =====================
  // Datos Relacionados
  // =====================
  getUsuarios(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/usuarios`, { headers: this.getAuthHeaders() });
  }

  getMaquinas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/maquinas`, { headers: this.getAuthHeaders() });
  }

  getProyectos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/proyectos`, { headers: this.getAuthHeaders() });
  }

  getProductos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/productos`, { headers: this.getAuthHeaders() });
  }

  // =====================
  // Resumen y Estadísticas
  // =====================
  getResumenBalance(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    return this.http.get<any>(`${this.apiUrl}/resumen`, { params, headers: this.getAuthHeaders() });
  }

  getEstadisticasPorTipo(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    return this.http.get<any>(`${this.apiUrl}/estadisticas/tipo`, { params, headers: this.getAuthHeaders() });
  }

  getEstadisticasPorMes(anio: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas/mes`, {
      params: new HttpParams().set('anio', anio.toString()),
      headers: this.getAuthHeaders()
    });
  }
}
