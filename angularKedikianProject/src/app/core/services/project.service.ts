// src/app/services/project.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, tap, map } from 'rxjs/operators';

export interface Project {
  id: number;
  nombre: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  daysRemaining?: number;
  estado: boolean;
  progress?: number;
  manager: string;
  fecha_creacion: Date;
  contrato_id?: number;
  contrato_file?: File;
  contrato_url?: string; // URL del contrato almacenado en el servidor
  contrato_nombre?: string; // Nombre del archivo de contrato
  contrato_tipo?: string; // Tipo MIME del contrato
  ubicacion: string;
  images?: string[];
  isOverdue?: boolean;
  
  // Campos del backend
  descripcion?: string;
  fecha_inicio?: string | Date;
  fecha_fin?: string | Date;
  gerente?: string;
  progreso?: number;
}

export interface CantidadProyectosActivos {
  cantidad_activos: number;
}

export interface ProyectosPaginadosResponse {
  proyectos: Project[];
  total: number;
  skip: number;
  limit: number;
  items?: Project[];
  count?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/proyectos`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getAuthHeadersForFiles(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // NO incluir Content-Type para que el browser lo configure automáticamente con boundary
    });
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  getLastProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/ultimos`);
  }

  findByIdMaquina(id: number): Observable<Project[]> {
    return new Observable<Project[]>(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  getActiveProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/activos`);
  }

  getCantidadProyectosActivos(): Observable<CantidadProyectosActivos> {
    return this.http.get<CantidadProyectosActivos>(`${this.apiUrl}/activos/cantidad`).pipe(
      tap((response) => {
        console.log('Cantidad de proyectos activos obtenida:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener cantidad de proyectos activos:', error);
        return throwError(() => error);
      })
    );
  }

  getProyectosPaginados(skip: number = 0, limit: number = 15): Observable<ProyectosPaginadosResponse> {
    const params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    return this.http.get<ProyectosPaginadosResponse>(`${this.apiUrl}/paginado`, { params }).pipe(
      tap((response) => {
        console.log('Proyectos paginados obtenidos:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener proyectos paginados:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Crear proyecto con archivo de contrato opcional
   */
  createProject(project: any, contratoFile?: File): Observable<any> {
    console.log('=== CREANDO PROYECTO CON ARCHIVO ===');
    
    const formData = new FormData();
    
    // Agregar datos del proyecto
    formData.append('nombre', project.nombre);
    formData.append('fecha_inicio', project.fecha_inicio);
    formData.append('estado', project.estado.toString());
    formData.append('gerente', project.gerente);
    formData.append('ubicacion', project.ubicacion);
    formData.append('descripcion', project.descripcion);
    formData.append('fecha_creacion', new Date().toISOString().split('T')[0]);
    
    // Agregar archivo de contrato si existe
    if (contratoFile) {
      formData.append('contrato', contratoFile, contratoFile.name);
      console.log('Archivo de contrato adjuntado:', contratoFile.name);
    }
    
    console.log('FormData preparado para enviar');
    
    return this.http.post<any>(this.apiUrl, formData, {
      headers: this.getAuthHeadersForFiles()
    }).pipe(
      tap((response) => {
        console.log('=== RESPUESTA EXITOSA DEL BACKEND ===');
        console.log('Respuesta completa:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('=== ERROR DEL BACKEND ===');
        console.error('Error detallado:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar proyecto con archivo de contrato opcional
   */
  updateProject(updatedProject: Project, contratoFile?: File): Observable<Project> {
    console.log('=== ACTUALIZANDO PROYECTO ===');
    
    const formData = new FormData();
    
    // Agregar datos del proyecto
    formData.append('nombre', updatedProject.nombre);
    
    // Manejar fecha_inicio de forma segura
    let fechaInicioStr: string;
    if (typeof updatedProject.startDate === 'string') {
      fechaInicioStr = updatedProject.startDate;
    } else if (updatedProject.startDate instanceof Date && !isNaN(updatedProject.startDate.getTime())) {
      fechaInicioStr = updatedProject.startDate.toISOString().split('T')[0];
    } else {
      // Si la fecha no es válida, usar fecha actual
      fechaInicioStr = new Date().toISOString().split('T')[0];
    }
    formData.append('fecha_inicio', fechaInicioStr);
    
    formData.append('estado', updatedProject.estado.toString());
    formData.append('gerente', updatedProject.manager);
    formData.append('ubicacion', updatedProject.ubicacion);
    formData.append('descripcion', updatedProject.description);
    
    // Agregar archivo de contrato si existe
    if (contratoFile) {
      formData.append('contrato', contratoFile, contratoFile.name);
      console.log('Nuevo archivo de contrato adjuntado:', contratoFile.name);
    }
    
    return this.http.put<Project>(`${this.apiUrl}/${updatedProject.id}`, formData, {
      headers: this.getAuthHeadersForFiles()
    }).pipe(
      tap((response) => {
        console.log('Proyecto actualizado exitosamente:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al actualizar proyecto:', error);
        return throwError(() => error);
      })
    );
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Descargar archivo de contrato
   */
  downloadContrato(proyectoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${proyectoId}/contrato`, {
      responseType: 'blob',
      headers: this.getAuthHeadersForFiles()
    }).pipe(
      tap(() => {
        console.log(`Descargando contrato del proyecto ${proyectoId}`);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al descargar contrato:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener URL del contrato (si el backend lo proporciona)
   */
  getContratoUrl(proyectoId: number): string {
    return `${this.apiUrl}/${proyectoId}/contrato`;
  }

  getMaquinasPorProyecto(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/maquinas`);
  }

  getAridosPorProyecto(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/aridos`);
  }

  getReportesLaboralesPorProyecto(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/reportes-laborales`).pipe(
      tap((response) => {
        console.log(`📊 Reportes laborales del proyecto ${id}:`, response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`❌ Error al obtener reportes laborales del proyecto ${id}:`, error);
        return new Observable<any[]>(observer => {
          observer.next([]);
          observer.complete();
        });
      })
    );
  }
}