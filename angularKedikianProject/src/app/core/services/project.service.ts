// src/app/services/project.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';

export interface Project {
  id: number;
  nombre: string;
  description: string;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  estado: boolean; // true = activo, false = inactivo
  progress: number;
  manager: string;
  fecha_creacion: Date;
  contrato_id: number;
  ubicacion: string;
  images?: string[]; // URLs de las imágenes
  isOverdue?: boolean; // true = proyecto atrasado
  
  // Campos del backend (opcionales para compatibilidad)
  descripcion?: string;
  fecha_inicio?: string | Date;
  fecha_fin?: string | Date;
  gerente?: string;
  progreso?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/proyectos`;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  getLastProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/ultimos`);
  }

  findByIdMaquina(id: number): Observable<Project[]> {
    // TODO: Implementar cuando el backend tenga el endpoint correspondiente
    // Por ahora, retornamos un observable vacío para evitar errores 404
    return new Observable<Project[]>(observer => {
      observer.next([]);
      observer.complete();
    });
    
    // Cuando el backend esté listo, descomentar esta línea:
    // return this.http.get<Project[]>(`${this.apiUrl}/maquinas/${id}`);
  }

  getActiveProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/activos`);
  }

  createProject(project: any): Observable<any> {
    console.log('=== CREANDO PROYECTO ===');
    console.log('Datos originales del proyecto:', project);
    
    // Agregar fecha_creacion al proyecto
    const projectData = {
      ...project,
      fecha_creacion: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
    };
    
    console.log('Datos finales a enviar al backend:', projectData);
    console.log('URL de la petición:', this.apiUrl);
    console.log('JSON que se enviará:', JSON.stringify(projectData, null, 2));
    
    return this.http.post<any>(this.apiUrl, projectData).pipe(
      tap((response) => {
        console.log('=== RESPUESTA EXITOSA DEL BACKEND ===');
        console.log('Respuesta completa:', response);
        console.log('Campos en la respuesta:', Object.keys(response));
        console.log('fecha_inicio en respuesta:', response.fecha_inicio);
        console.log('fecha_fin en respuesta:', response.fecha_fin);
        console.log('descripcion en respuesta:', response.descripcion);
        console.log('gerente en respuesta:', response.gerente);
        console.log('progreso en respuesta:', response.progreso);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('=== ERROR DEL BACKEND ===');
        console.error('Error detallado del backend:', error);
        console.error('Response body:', error.error);
        if (error.error && error.error.detail) {
          console.error('Detail array:', error.error.detail);
          error.error.detail.forEach((err: any, index: number) => {
            console.error(`Error ${index + 1}:`, err);
            console.error(`Error ${index + 1} - Location:`, err.loc);
            console.error(`Error ${index + 1} - Input:`, err.input);
          });
        }
        return throwError(() => error);
      })
    );
  }

  updateProject(updatedProject: Project): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${updatedProject.id}`, updatedProject);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
