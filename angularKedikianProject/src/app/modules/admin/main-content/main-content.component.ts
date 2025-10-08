import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import {
  ProjectService,
  Project,
} from '../../../core/services/project.service';

interface ReporteLaboral {
  id: number;
  maquina_id: number;
  usuario_id: number;
  proyecto_id: number;
  fecha_asignacion: string;
  horas_turno: number;
  horometro_inicial: number;
  created: string;
  updated: string;
}

interface Maquina {
  id?: number;
  nombre: string;
  horasAcumuladas?: number; // Horas totales de reportes laborales
  [key: string]: any;
}

interface ProyectoExtendido extends Omit<Project, 'startDate' | 'endDate'> {
  maquinas: Maquina[];
  aridos: any[];
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
        console.log('📋 Proyectos obtenidos:', projects);
        
        // Para cada proyecto, obtener máquinas, áridos y reportes laborales
        const proyectosExtendidos$ = projects.map((project) => {
          return Promise.all([
            this.projectService.getMaquinasPorProyecto(project.id).toPromise(),
            this.projectService.getAridosPorProyecto(project.id).toPromise(),
            this.projectService.getReportesLaboralesPorProyecto(project.id).toPromise(),
          ]).then(([maquinas, aridos, reportes]) => {
            console.log(`🔧 Proyecto ${project.nombre}:`);
            console.log('  - Máquinas:', maquinas);
            console.log('  - Áridos:', aridos);
            console.log('  - Reportes:', reportes);
            
            // Calcular horas acumuladas por máquina
            const maquinasConHoras = this.calcularHorasPorMaquina(
              maquinas || [],
              reportes || []
            );
            
            return {
              ...project,
              fechaInicio: new Date(project.startDate ?? project.fecha_inicio),
              fechaFin: new Date(project.endDate ?? project.fecha_fin),
              descripcion: project.description ?? project.descripcion,
              maquinas: maquinasConHoras,
              aridos: aridos || [],
            };
          });
        });
        
        Promise.all(proyectosExtendidos$).then((proyectos) => {
          this.proyectos = proyectos;
          this.loading = false;
          console.log('✅ Proyectos extendidos cargados:', this.proyectos);
        });
      },
      error: (err) => {
        this.error = 'Error al cargar los proyectos';
        this.loading = false;
        console.error('❌ Error al cargar proyectos:', err);
      },
    });
  }

  /**
   * Calcula las horas acumuladas por máquina desde los reportes laborales
   */
  private calcularHorasPorMaquina(
    maquinas: Maquina[],
    reportes: ReporteLaboral[]
  ): Maquina[] {
    return maquinas.map((maquina) => {
      // Filtrar reportes de esta máquina
      const reportesMaquina = reportes.filter(
        (reporte) => reporte.maquina_id === maquina.id
      );
      
      // Sumar todas las horas_turno
      const horasAcumuladas = reportesMaquina.reduce(
        (total, reporte) => total + (reporte.horas_turno || 0),
        0
      );
      
      console.log(`⏱️ Máquina ${maquina.nombre} (ID: ${maquina.id}): ${horasAcumuladas} horas acumuladas`);
      
      return {
        ...maquina,
        horasAcumuladas,
      };
    });
  }

  /**
   * Calcula el total de horas acumuladas de todas las máquinas de un proyecto
   */
  getTotalHours(maquinas: Maquina[]): number {
    const total = maquinas.reduce((total, maquina) => {
      return total + (maquina.horasAcumuladas || 0);
    }, 0);
    
    console.log(`📈 Total de horas acumuladas: ${total}`);
    return total;
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

  /**
   * Obtiene las horas acumuladas de una máquina individual
   */
  getMaquinaHours(maquina: Maquina): number {
    return maquina.horasAcumuladas || 0;
  }

  /**
   * Obtiene el nombre de visualización para un árido
   */
  getAridoDisplayName(arido: any, index: number): string {
    console.log(`🔍 Árido ${index}:`, arido);
    
    if (typeof arido === 'string') {
      return arido;
    }
    
    if (typeof arido === 'object' && arido !== null) {
      const possibleNames = ['nombre', 'tipo', 'tipo_arido', 'name', 'type', 'descripcion', 'description'];
      
      for (const prop of possibleNames) {
        if (arido[prop] && typeof arido[prop] === 'string') {
          console.log(`✅ Árido ${index} - usando propiedad '${prop}': ${arido[prop]}`);
          return arido[prop];
        }
      }
      
      console.log(`⚠️ Árido ${index} - propiedades disponibles:`, Object.keys(arido));
      return `Árido ${index + 1}`;
    }
    
    return 'Árido desconocido';
  }
}