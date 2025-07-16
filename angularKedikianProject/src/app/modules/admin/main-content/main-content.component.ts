import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import {
  ProjectService,
  Project,
} from '../../../core/services/project.service';

interface Maquina {
  nombre: string;
  horasSemanales: number;
}

interface ProyectoExtendido extends Omit<Project, 'startDate' | 'endDate'> {
  maquinas: Maquina[];
  aridos: string[];
  fechaInicio: Date;
  fechaFin: Date;
  descripcion: string;
}

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [CommonModule, NgClass],
  providers: [ProjectService],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.css'],
})
export class MainContentComponent implements OnInit {
  proyectos: ProyectoExtendido[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = null;
    this.projectService.getProjects().subscribe({
      next: (projects: Project[]) => {
        // Para cada proyecto, obtener máquinas y áridos
        const proyectosExtendidos$ = projects.map((project) => {
          return Promise.all([
            this.projectService.getMaquinasPorProyecto(project.id).toPromise(),
            this.projectService.getAridosPorProyecto(project.id).toPromise(),
          ]).then(([maquinas, aridos]) => ({
            ...project,
            fechaInicio: new Date(project.startDate ?? project.fecha_inicio),
            fechaFin: new Date(project.endDate ?? project.fecha_fin),
            descripcion: project.description ?? project.descripcion,
            maquinas: maquinas || [],
            aridos: aridos || [],
          }));
        });
        Promise.all(proyectosExtendidos$).then((proyectos) => {
          this.proyectos = proyectos;
          this.loading = false;
        });
      },
      error: (err) => {
        this.error = 'Error al cargar los proyectos';
        this.loading = false;
      },
    });
  }

  /**
   * Calcula el total de horas semanales de todas las máquinas de un proyecto
   */
  getTotalHours(maquinas: Maquina[]): number {
    return maquinas.reduce(
      (total, maquina) => total + maquina.horasSemanales,
      0
    );
  }

  /**
   * Determina el estado del proyecto basado en las fechas
   */
  getProjectStatus(fechaInicio: Date, fechaFin: Date): string {
    const hoy = new Date();
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (hoy < inicio) {
      return 'Pendiente';
    } else if (hoy >= inicio && hoy <= fin) {
      return 'En Progreso';
    } else {
      return 'Completado';
    }
  }

  /**
   * Obtiene la clase CSS para el badge de estado
   */
  getStatusClass(fechaInicio: Date, fechaFin: Date): string {
    const status = this.getProjectStatus(fechaInicio, fechaFin);

    switch (status) {
      case 'Pendiente':
        return 'pending';
      case 'En Progreso':
        return 'active';
      case 'Completado':
        return 'completed';
      default:
        return 'pending';
    }
  }
}
