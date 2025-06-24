// src/app/services/project.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
    return this.http.get<Project[]>(`${this.apiUrl}/maquinas/${id}`);
  }

  getActiveProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/activos`);
  }

  addProject(project: Project): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  updateProject(updatedProject: Project): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${updatedProject.id}`, updatedProject);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
