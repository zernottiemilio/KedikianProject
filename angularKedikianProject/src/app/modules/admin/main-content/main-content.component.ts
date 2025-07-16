import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import {
  ProjectService,
  Project,
} from '../../../core/services/project.service';

interface Maquina {
  nombre: string;
  horasSemanales?: number;
  horas_uso?: number;
  horas_semanales?: number;
  [key: string]: any; // Para propiedades adicionales
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
        
        // Para cada proyecto, obtener máquinas y áridos
        const proyectosExtendidos$ = projects.map((project) => {
          return Promise.all([
            this.projectService.getMaquinasPorProyecto(project.id).toPromise(),
            this.projectService.getAridosPorProyecto(project.id).toPromise(),
          ]).then(([maquinas, aridos]) => {
            console.log(`🔧 Proyecto ${project.nombre}:`);
            console.log('  - Máquinas:', maquinas);
            console.log('  - Áridos:', aridos);
            
            return {
              ...project,
              fechaInicio: new Date(project.startDate ?? project.fecha_inicio),
              fechaFin: new Date(project.endDate ?? project.fecha_fin),
              descripcion: project.description ?? project.descripcion,
              maquinas: maquinas || [],
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
   * Calcula el total de horas semanales de todas las máquinas de un proyecto
   */
  getTotalHours(maquinas: Maquina[]): number {
    console.log('🔧 Calculando horas para máquinas:', maquinas);
    
    const total = maquinas.reduce((total, maquina) => {
      const horas = maquina.horasSemanales || maquina.horas_semanales || maquina.horas_uso || 0;
      console.log(`📊 Máquina ${maquina.nombre}: ${horas} horas`);
      return total + horas;
    }, 0);
    
    console.log(`📈 Total de horas: ${total}`);
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
   * Obtiene las horas de una máquina individual
   */
  getMaquinaHours(maquina: Maquina): number {
    const horas = maquina.horasSemanales || maquina.horas_semanales || maquina.horas_uso || 0;
    return horas;
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
      // Intentar diferentes propiedades comunes
      const possibleNames = ['nombre', 'tipo', 'tipo_arido', 'name', 'type', 'descripcion', 'description'];
      
      for (const prop of possibleNames) {
        if (arido[prop] && typeof arido[prop] === 'string') {
          console.log(`✅ Árido ${index} - usando propiedad '${prop}': ${arido[prop]}`);
          return arido[prop];
        }
      }
      
      // Si no encontramos una propiedad de nombre, mostrar las propiedades disponibles
      console.log(`⚠️ Árido ${index} - propiedades disponibles:`, Object.keys(arido));
      return `Árido ${index + 1}`;
    }
    
    return 'Árido desconocido';
  }
}
