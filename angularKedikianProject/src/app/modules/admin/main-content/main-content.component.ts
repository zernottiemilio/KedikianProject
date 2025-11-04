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
  horasAcumuladas?: number;
  [key: string]: any;
}

// Nueva interfaz para áridos agrupados
interface AridoAgrupado {
  nombre: string;
  cantidad: number; // en m³
  registros: number; // cantidad de veces que se registró
}

interface ProyectoExtendido extends Omit<Project, 'startDate' | 'endDate'> {
  maquinas: Maquina[];
  aridos: any[];
  aridosAgrupados: AridoAgrupado[]; // Nueva propiedad
  fechaInicio: Date;
  fechaFin?: Date;
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
            
            const maquinasConHoras = this.calcularHorasPorMaquina(
              maquinas || [],
              reportes || []
            );
            
            // Agrupar áridos por tipo y sumar cantidades
            const aridosAgrupados = this.agruparAridos(aridos || []);
            
            return {
              ...project,
              fechaInicio: new Date(project.startDate ?? project.fecha_inicio),
              fechaFin: project.endDate ? new Date(project.endDate) : 
                       project.fecha_fin ? new Date(project.fecha_fin) : undefined,
              descripcion: project.description ?? project.descripcion,
              maquinas: maquinasConHoras,
              aridos: aridos || [],
              aridosAgrupados: aridosAgrupados,
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
   * Agrupa los áridos por tipo y suma las cantidades en m³
   */
  private agruparAridos(aridos: any[]): AridoAgrupado[] {
    console.log('📦 Agrupando áridos:', aridos);
    
    const aridosMap = new Map<string, AridoAgrupado>();
    
    aridos.forEach((arido, index) => {
      // Obtener el nombre del árido
      const nombre = this.extractAridoName(arido, index);
      
      // Obtener la cantidad en m³
      const cantidad = this.extractAridoCantidad(arido);
      
      console.log(`  - Procesando: ${nombre}, cantidad: ${cantidad} m³`);
      
      // Si ya existe este tipo de árido, sumar la cantidad
      if (aridosMap.has(nombre)) {
        const existente = aridosMap.get(nombre)!;
        existente.cantidad += cantidad;
        existente.registros += 1;
      } else {
        // Si es nuevo, crear la entrada
        aridosMap.set(nombre, {
          nombre: nombre,
          cantidad: cantidad,
          registros: 1,
        });
      }
    });
    
    // Convertir el Map a array y ordenar por nombre
    const resultado = Array.from(aridosMap.values()).sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );
    
    console.log('✅ Áridos agrupados:', resultado);
    return resultado;
  }

  /**
   * Extrae el nombre del árido desde diferentes posibles estructuras
   */
  private extractAridoName(arido: any, index: number): string {
    if (typeof arido === 'string') {
      return arido;
    }
    
    if (typeof arido === 'object' && arido !== null) {
      const possibleNames = [
        'nombre', 
        'tipo', 
        'tipo_arido', 
        'name', 
        'type', 
        'descripcion', 
        'description'
      ];
      
      for (const prop of possibleNames) {
        if (arido[prop] && typeof arido[prop] === 'string') {
          return arido[prop];
        }
      }
    }
    
    return `Árido ${index + 1}`;
  }

  /**
   * Extrae la cantidad en m³ del árido
   */
  private extractAridoCantidad(arido: any): number {
    if (typeof arido === 'object' && arido !== null) {
      const possibleProps = [
        'cantidad',
        'cantidad_m3',
        'volumen',
        'volumen_m3',
        'm3',
        'metros_cubicos',
        'cantidadM3',
        'volume'
      ];
      
      for (const prop of possibleProps) {
        if (arido[prop] !== undefined && arido[prop] !== null) {
          const valor = parseFloat(arido[prop]);
          if (!isNaN(valor)) {
            return valor;
          }
        }
      }
    }
    
    console.warn('⚠️ No se encontró cantidad para árido:', arido);
    return 0;
  }

  /**
   * Calcula las horas acumuladas por máquina desde los reportes laborales
   */
  private calcularHorasPorMaquina(
    maquinas: Maquina[],
    reportes: ReporteLaboral[]
  ): Maquina[] {
    return maquinas.map((maquina) => {
      const reportesMaquina = reportes.filter(
        (reporte) => reporte.maquina_id === maquina.id
      );
      
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
   * Calcula el total de m³ de áridos en un proyecto
   */
  getTotalAridos(aridosAgrupados: AridoAgrupado[]): number {
    return aridosAgrupados.reduce((total, arido) => total + arido.cantidad, 0);
  }

  /**
   * Determina el estado del proyecto basado en las fechas
   */
  getProjectStatus(fechaInicio: Date, fechaFin?: Date): string {
    const hoy = new Date();
    const inicio = new Date(fechaInicio);

    if (hoy < inicio) {
      return 'Pendiente';
    } else if (fechaFin) {
      const fin = new Date(fechaFin);
      if (hoy >= inicio && hoy <= fin) {
        return 'En Progreso';
      } else {
        return 'Completado';
      }
    } else {
      return 'En Progreso';
    }
  }

  /**
   * Obtiene la clase CSS para el badge de estado
   */
  getStatusClass(fechaInicio: Date, fechaFin?: Date): string {
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
   * Formatea la cantidad de áridos con 2 decimales
   */
  formatCantidad(cantidad: number): string {
    return cantidad.toFixed(2);
  }
}