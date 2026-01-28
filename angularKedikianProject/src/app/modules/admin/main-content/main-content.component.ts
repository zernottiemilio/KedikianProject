import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import {
  ProjectService,
  Project,
  ProyectoConDetalles,
  MaquinaConHoras,
  AridoDetallado,
} from '../../../core/services/project.service';

// Interfaz para áridos agrupados (usada en la vista)
interface AridoAgrupado {
  nombre: string;
  cantidad: number; // en m³
  registros: number; // cantidad de veces que se registró
}

interface ProyectoExtendido extends ProyectoConDetalles {
  maquinas: MaquinaConHoras[];
  aridosAgrupados: AridoAgrupado[];
  fechaInicio: Date;
  fechaFin?: Date;
  descripcion: string;
}

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainContentComponent implements OnInit, OnDestroy {
  proyectos: ProyectoExtendido[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Subject para limpiar suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = null;

    // Usar el nuevo endpoint optimizado que retorna todo en una sola llamada
    this.projectService
      .getProyectosConDetalles(true)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (proyectos: ProyectoConDetalles[]) => {
          // Transformar los proyectos para agregar campos calculados
          this.proyectos = proyectos.map((proyecto) => {
            // Agrupar áridos por tipo
            const aridosAgrupados = this.agruparAridos(proyecto.aridos || []);

            return {
              ...proyecto,
              fechaInicio: new Date(proyecto.startDate ?? proyecto.fecha_inicio),
              fechaFin: proyecto.endDate
                ? new Date(proyecto.endDate)
                : proyecto.fecha_fin
                  ? new Date(proyecto.fecha_fin)
                  : undefined,
              descripcion: proyecto.description ?? proyecto.descripcion ?? '',
              aridosAgrupados,
            };
          });

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Error al cargar los proyectos';
          console.error('Error al cargar proyectos:', err);
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Agrupa los áridos por tipo y suma las cantidades
   */
  private agruparAridos(aridos: AridoDetallado[]): AridoAgrupado[] {
    const aridosMap = new Map<string, AridoAgrupado>();

    aridos.forEach((arido) => {
      const nombre = arido.nombre || arido.tipo_arido || arido.tipo || 'Sin especificar';
      const cantidad = arido.cantidad || 0;

      if (aridosMap.has(nombre)) {
        const existente = aridosMap.get(nombre)!;
        existente.cantidad += cantidad;
        existente.registros += 1;
      } else {
        aridosMap.set(nombre, {
          nombre,
          cantidad,
          registros: 1,
        });
      }
    });

    return Array.from(aridosMap.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }

  /**
   * Calcula el total de horas acumuladas de todas las máquinas de un proyecto
   */
  getTotalHours(maquinas: MaquinaConHoras[]): number {
    return maquinas.reduce((total, maquina) => {
      return total + (maquina.horas_totales || maquina.horas_trabajadas || 0);
    }, 0);
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
   * Obtiene las horas trabajadas de una máquina individual
   */
  getMaquinaHours(maquina: MaquinaConHoras): number {
    return maquina.horas_totales || maquina.horas_trabajadas || 0;
  }

  /**
   * Formatea la cantidad de áridos con 2 decimales
   */
  formatCantidad(cantidad: number): string {
    return cantidad.toFixed(2);
  }

  /**
   * TrackBy functions para optimizar ngFor
   */
  trackByProyectoId(index: number, proyecto: ProyectoExtendido): number {
    return proyecto.id;
  }

  trackByMaquinaId(index: number, maquina: MaquinaConHoras): number {
    return maquina.id;
  }

  trackByAridoNombre(index: number, arido: AridoAgrupado): string {
    return arido.nombre;
  }
}