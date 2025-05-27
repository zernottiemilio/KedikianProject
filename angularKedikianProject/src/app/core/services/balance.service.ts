// balance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Asegúrate de que la ruta sea correcta

@Injectable({
  providedIn: 'root',
})
export class BalanceService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Gastos (Egresos)
  getGastos(fechaInicio: Date, fechaFin: Date): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());

    return this.http.get(`${this.apiUrl}/gastos`, { params });
  }

  getGasto(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/gastos/${id}`);
  }

  crearGasto(gasto: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/gastos`, gasto);
  }

  actualizarGasto(id: number, gasto: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/gastos/${id}`, gasto);
  }

  eliminarGasto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/gastos/${id}`);
  }

  // Pagos (Ingresos)
  getPagos(fechaInicio: Date, fechaFin: Date): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());

    return this.http.get(`${this.apiUrl}/pagos`, { params });
  }

  getPago(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/pagos/${id}`);
  }

  crearPago(pago: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pagos`, pago);
  }

  actualizarPago(id: number, pago: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/pagos/${id}`, pago);
  }

  eliminarPago(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/pagos/${id}`);
  }

  // Datos Relacionados
  getUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios`);
  }

  getMaquinas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/maquinas`);
  }

  getProyectos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/proyectos`);
  }

  getProductos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/productos`);
  }

  // Resumen o Estadísticas
  getResumenBalance(fechaInicio: Date, fechaFin: Date): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());

    return this.http.get(`${this.apiUrl}/balance/resumen`, { params });
  }

  getEstadisticasPorTipo(fechaInicio: Date, fechaFin: Date): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());

    return this.http.get(`${this.apiUrl}/balance/estadisticas/tipo`, {
      params,
    });
  }

  getEstadisticasPorMes(anio: number): Observable<any> {
    let params = new HttpParams().set('anio', anio.toString());
    return this.http.get(`${this.apiUrl}/balance/estadisticas/mes`, { params });
  }
}
