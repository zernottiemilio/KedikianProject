// src/app/services/project.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  // Datos simulados de proyectos
  private projects: Project[] = [
    {
      id: 1,
      nombre: 'Construcción Carretera Norte',
      description:
        'Proyecto de construcción y ampliación de la carretera norte para mejorar la conectividad entre poblaciones rurales.',
      startDate: new Date(2025, 3, 1),
      endDate: new Date(2025, 5, 6),
      daysRemaining: 12,
      estado: true,
      progress: 75,
      manager: 'Carlos Rodríguez',
      fecha_creacion: new Date(2025, 2, 15),
      contrato_id: 1,
      ubicacion: 'Sector Norte, Km 45',
      images: [
        'https://via.placeholder.com/800x600?text=Imagen+Carretera+1',
        'https://via.placeholder.com/800x600?text=Imagen+Carretera+2',
      ],
    },
    {
      id: 2,
      nombre: 'Urbanización Los Pinos',
      description:
        'Desarrollo urbano en el sector sur con 120 viviendas y áreas verdes comunitarias.',
      startDate: new Date(2025, 2, 15),
      endDate: new Date(2025, 6, 20),
      daysRemaining: 25,
      estado: true,
      progress: 50,
      manager: 'María González',
      fecha_creacion: new Date(2025, 1, 10),
      contrato_id: 3,
      ubicacion: 'Sector Sur, Parcela 23',
      images: [
        'https://via.placeholder.com/800x600?text=Urbanización+1',
        'https://via.placeholder.com/800x600?text=Urbanización+2',
        'https://via.placeholder.com/800x600?text=Urbanización+3',
      ],
    },
    {
      id: 3,
      nombre: 'Canalización Río Sur',
      description:
        'Obras de canalización y protección del cauce del río para prevenir inundaciones en la zona.',
      startDate: new Date(2025, 3, 10),
      endDate: new Date(2025, 4, 30),
      daysRemaining: 5,
      estado: true,
      progress: 90,
      manager: 'Juan Pérez',
      fecha_creacion: new Date(2025, 2, 5),
      contrato_id: 2,
      ubicacion: 'Cuenca del Río Sur, Sección B4',
      images: ['https://via.placeholder.com/800x600?text=Río+Sur+1'],
    },
    {
      id: 4,
      nombre: 'Renovación Edificio Municipal',
      description:
        'Proyecto de renovación y modernización de las instalaciones del edificio municipal central.',
      startDate: new Date(2024, 10, 12),
      endDate: new Date(2025, 3, 15),
      daysRemaining: -10,
      estado: false,
      progress: 100,
      manager: 'Laura Martínez',
      fecha_creacion: new Date(2024, 9, 30),
      contrato_id: 4,
      ubicacion: 'Centro de la Ciudad, Plaza Principal',
      images: [
        'https://via.placeholder.com/800x600?text=Edificio+1',
        'https://via.placeholder.com/800x600?text=Edificio+2',
      ],
    },
  ];

  private projectsSubject = new BehaviorSubject<Project[]>(this.projects);

  constructor() {
    this.calculateDaysRemaining();
  }

  calculateDaysRemaining(): void {
    const today = new Date();
    this.projects.forEach((project) => {
      const diffTime = project.endDate.getTime() - today.getTime();
      project.daysRemaining = Math.ceil(diffTime / (1000 * 3600 * 24));
    });
    this.projectsSubject.next([...this.projects]);
  }

  getProjects(): Observable<Project[]> {
    return this.projectsSubject.asObservable();
  }

  getActiveProjects(): Observable<Project[]> {
    const activeProjects = this.projects.filter(
      (project) => project.estado === true
    );
    return new BehaviorSubject<Project[]>(activeProjects).asObservable();
  }

  addProject(project: Project): void {
    this.projects.push(project);
    this.projectsSubject.next([...this.projects]);
  }

  updateProject(updatedProject: Project): void {
    const index = this.projects.findIndex((p) => p.id === updatedProject.id);
    if (index !== -1) {
      this.projects[index] = updatedProject;
      this.projectsSubject.next([...this.projects]);
    }
  }

  deleteProject(id: number): void {
    this.projects = this.projects.filter((project) => project.id !== id);
    this.projectsSubject.next([...this.projects]);
  }
}
