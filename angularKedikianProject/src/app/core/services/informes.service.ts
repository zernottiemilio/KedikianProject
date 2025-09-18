import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReporteLaboral {
  id: number;
  maquina_id: number;
  proyecto_id: number;
  usuario_id: number;
  fecha_asignacion: string; // ISO date string
  horas_turno: number;
  maquina_nombre?: string;
  proyecto_nombre?: string;
  usuario_nombre?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportesLaboralesService {
  private apiUrl = `${environment.apiUrl}/reportes-laborales`;

  constructor(private http: HttpClient) {}

  getReportes(filtros?: any): Observable<ReporteLaboral[]> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get<ReporteLaboral[]>(this.apiUrl, { params });
  }

  getReporteById(id: number): Observable<ReporteLaboral> {
    return this.http.get<ReporteLaboral>(`${this.apiUrl}/${id}`);
  }

  createReporte(reporte: Partial<ReporteLaboral>): Observable<ReporteLaboral> {
    return this.http.post<ReporteLaboral>(this.apiUrl, reporte);
  }

  updateReporte(reporte: Partial<ReporteLaboral>): Observable<ReporteLaboral> {
    return this.http.put<ReporteLaboral>(`${this.apiUrl}/${reporte.id}`, reporte);
  }

  deleteReporte(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  exportarExcel(filtros?: any): Observable<Blob> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/export/excel`, {
      params,
      responseType: 'blob',
    });
  }

  exportarPDF(filtros?: any): Observable<Blob> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/export/pdf`, {
      params,
      responseType: 'blob',
    });
  }
}
