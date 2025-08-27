// balance.service.ts
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

  crearGasto(gasto: any): Observable<any> {
    if (gasto instanceof FormData) {
      return this.http.post<any>(`${this.apiUrl}/gastos`, gasto);
    }
    return this.http.post<any>(`${this.apiUrl}/gastos`, gasto, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  actualizarGasto(id: number, gasto: any): Observable<any> {
    if (gasto instanceof FormData) {
      return this.http.put<any>(`${this.apiUrl}/gastos/${id}`, gasto);
    }
    return this.http.put<any>(`${this.apiUrl}/gastos/${id}`, gasto, {
      headers: { 'Content-Type': 'application/json' }
    });
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
    return this.http.post<any>(`${this.apiUrl}/pagos`, pago);
  }

  actualizarPago(id: number, pago: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pagos/${id}`, pago);
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
  // Resumen y Estadísticas (via backend)
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
