import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReporteLaboral {
  id: number;
  maquina_id: number;
  proyecto_id: number;
  usuario_id: number;
  fecha_asignacion: string;
  horas_turno: number;
  horometro_inicial: number;
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
        const value = filtros[key];
        // Solo agregar el parámetro si tiene un valor válido (no vacío, no null, no undefined)
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, String(value).trim());
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
        const value = filtros[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, String(value).trim());
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
        const value = filtros[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, String(value).trim());
        }
      });
    }
    
    return this.http.get(`${this.apiUrl}/export/pdf`, {
      params,
      responseType: 'blob',
    });
  }
}