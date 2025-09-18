import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ReportesLaboralesService, ReporteLaboral } from '../../../core/services/informes.service';
import { MachinesService } from '../../../core/services/machines.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class InformesComponent implements OnInit {
  reportes: ReporteLaboral[] = [];
  maquinas: any[] = [];
  proyectos: Project[] = [];
  usuarios: any[] = [];

  filtroBusqueda: string = '';
  filtroMaquina: string = '';
  filtroProyecto: string = '';
  filtroUsuario: string = '';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';

  paginaActual: number = 1;
  itemsPorPagina: number = 10;

  modalAbierto: boolean = false;
  reporteEditando: boolean = false;

  formulario: Partial<ReporteLaboral> = {};

  // Estado de carga
  cargandoDatos: boolean = true;

  constructor(
    private reportesService: ReportesLaboralesService,
    private machinesService: MachinesService,
    private projectService: ProjectService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargandoDatos = true;
    
    forkJoin({
      maquinas: this.machinesService.obtenerMaquinas(),
      proyectos: this.projectService.getProjects(),
      usuarios: this.userService.getUsers()
    }).subscribe({
      next: ({ maquinas, proyectos, usuarios }) => {
        this.maquinas = maquinas;
        this.proyectos = proyectos;
        this.usuarios = usuarios;
        
        console.log('Datos cargados:');
        console.log('Máquinas:', this.maquinas);
        console.log('Proyectos:', this.proyectos);
        console.log('Usuarios:', this.usuarios);
        
        // Cargar reportes DESPUÉS de tener los datos de referencia
        this.cargarReportes();
      },
      error: (error) => {
        console.error('Error cargando datos iniciales:', error);
        this.cargandoDatos = false;
      }
    });
  }

  cargarReportes(): void {
    const filtros = {
      busqueda: this.filtroBusqueda,
      maquina_id: this.filtroMaquina,
      proyecto_id: this.filtroProyecto,
      usuario_id: this.filtroUsuario,
      fecha_desde: this.filtroFechaDesde,
      fecha_hasta: this.filtroFechaHasta,
    };

    this.reportesService.getReportes(filtros).subscribe({
      next: (data) => {
        console.log('🔍 Reportes recibidos desde backend:', data);

        // 🔧 SOLUCIÓN: Normalizar los datos para asegurar que todos los campos siempre existan
        const reportesNormalizados = data.map(reporte => ({
          ...reporte,
          // Asegurar que todos los campos críticos estén presentes, aunque sean null
          proyecto_id: reporte.proyecto_id ?? null,
          maquina_id: reporte.maquina_id ?? null,
          usuario_id: reporte.usuario_id ?? null
        }));

        console.group("🔍 DEBUG: Análisis de reportes normalizados");
        console.log("👉 Proyectos disponibles:", this.proyectos.map(p => ({ id: p.id, nombre: p.nombre })));
        
        reportesNormalizados.forEach((r, index) => {
          const proyectoEncontrado = this.proyectos.find(p => String(p.id) === String(r.proyecto_id));
          console.log(`📋 Reporte ${index + 1} (ID: ${r.id}):`, {
            proyecto_id: r.proyecto_id,
            tipo_proyecto_id: typeof r.proyecto_id,
            tiene_proyecto_id: r.hasOwnProperty('proyecto_id'),
            proyecto_encontrado: proyectoEncontrado ? proyectoEncontrado.nombre : '❌ NO ENCONTRADO',
            todas_las_propiedades: Object.keys(r)
          });
        });
        console.groupEnd();

        // Mapear los nombres con mejor manejo de errores
        this.reportes = reportesNormalizados.map(reporte => {
          const reporteConNombres = {
            ...reporte,
            maquina_nombre: this.getNombreMaquina(reporte.maquina_id),
            proyecto_nombre: this.getNombreProyecto(reporte.proyecto_id),
            usuario_nombre: this.getNombreUsuario(reporte.usuario_id),
          };

          // Debug adicional para casos problemáticos
          if (!reporte.proyecto_id && reporte.proyecto_id !== 0) {
            console.warn(`⚠️  Reporte ID ${reporte.id} tiene proyecto_id: ${reporte.proyecto_id} (${typeof reporte.proyecto_id})`);
          }

          return reporteConNombres;
        });

        console.log('✅ Reportes finales con nombres mapeados:', this.reportes);

        this.paginaActual = 1;
        this.cargandoDatos = false;
      },
      error: (error) => {
        console.error('❌ Error cargando reportes:', error);
        this.cargandoDatos = false;
      }
    });
  }

  get reportesPaginados(): ReporteLaboral[] {
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.reportes.slice(start, start + this.itemsPorPagina);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.reportes.length / this.itemsPorPagina));
  }

  abrirModal(): void {
    this.modalAbierto = true;
    this.reporteEditando = false;
    this.formulario = {
      fecha_asignacion: new Date().toISOString().split('T')[0] // Fecha actual por defecto
    };
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.formulario = {};
  }

  editarReporte(reporte: ReporteLaboral): void {
    this.modalAbierto = true;
    this.reporteEditando = true;
    this.formulario = { 
      ...reporte,
      fecha_asignacion: reporte.fecha_asignacion?.split('T')[0] || reporte.fecha_asignacion
    };
  }

  guardarReporte(): void {
    console.log('🔍 Guardando formulario con datos:', this.formulario);

    if (this.reporteEditando && this.formulario.id) {
      this.reportesService.updateReporte(this.formulario).subscribe({
        next: (r) => {
          console.log('✅ Reporte actualizado:', r);
          
          // 🔧 SOLUCIÓN: Normalizar la respuesta del servidor
          const reporteNormalizado = {
            ...r,
            proyecto_id: r.proyecto_id ?? null,
            maquina_id: r.maquina_id ?? null,
            usuario_id: r.usuario_id ?? null
          };

          // Actualizar directamente el reporte en el array
          const index = this.reportes.findIndex(rep => rep.id === r.id);
          if (index > -1) {
            this.reportes[index] = {
              ...reporteNormalizado,
              maquina_nombre: this.getNombreMaquina(reporteNormalizado.maquina_id),
              proyecto_nombre: this.getNombreProyecto(reporteNormalizado.proyecto_id),
              usuario_nombre: this.getNombreUsuario(reporteNormalizado.usuario_id),
            };
          }
          this.cerrarModal();
        },
        error: (error) => {
          console.error('❌ Error actualizando reporte:', error);
          alert('Error al actualizar el reporte');
        }
      });
    } else {
      this.reportesService.createReporte(this.formulario).subscribe({
        next: (r) => {
          console.log('✅ Reporte creado:', r);
          
          // 🔧 SOLUCIÓN: Normalizar la respuesta del servidor
          const reporteNormalizado = {
            ...r,
            proyecto_id: r.proyecto_id ?? null,
            maquina_id: r.maquina_id ?? null,
            usuario_id: r.usuario_id ?? null
          };

          this.reportes.unshift({
            ...reporteNormalizado,
            maquina_nombre: this.getNombreMaquina(reporteNormalizado.maquina_id),
            proyecto_nombre: this.getNombreProyecto(reporteNormalizado.proyecto_id),
            usuario_nombre: this.getNombreUsuario(reporteNormalizado.usuario_id),
          });
          this.cerrarModal();
        },
        error: (error) => {
          console.error('❌ Error creando reporte:', error);
          alert('Error al crear el reporte');
        }
      });
    }
  }

  eliminarReporte(id: number | undefined): void {
    if (!id) return;
    
    if (confirm('¿Estás seguro de eliminar este informe?')) {
      this.reportesService.deleteReporte(id).subscribe({
        next: () => {
          this.reportes = this.reportes.filter(r => r.id !== id);
        },
        error: (error) => {
          console.error('❌ Error eliminando reporte:', error);
          alert('Error al eliminar el reporte');
        }
      });
    }
  }

  // ===== Métodos mejorados para mostrar nombres desde los arrays de referencia =====
  getNombreMaquina(id: number | string | undefined | null): string {
    if (!id && id !== 0) {
      console.log('🔍 Máquina ID es null/undefined:', id);
      return '❌ Sin máquina asignada';
    }
    
    const maquina = this.maquinas.find(m => String(m.id) === String(id));
    if (!maquina) {
      console.warn(`⚠️  Máquina no encontrada para ID: ${id}`, {
        id_buscado: id,
        tipo: typeof id,
        maquinas_disponibles: this.maquinas.map(m => ({ id: m.id, nombre: m.nombre }))
      });
      return `❓ Máquina ID: ${id}`;
    }
    
    return maquina.nombre || `Máquina ${id}`;
  }

  getNombreProyecto(id: number | string | undefined | null): string {
    if (!id && id !== 0) {
      console.log('🔍 Proyecto ID es null/undefined:', id);
      return '❌ Sin proyecto asignado';
    }
    
    const proyecto = this.proyectos.find(p => String(p.id) === String(id));
    if (!proyecto) {
      console.warn(`⚠️  Proyecto no encontrado para ID: ${id}`, {
        id_buscado: id,
        tipo: typeof id,
        proyectos_disponibles: this.proyectos.map(p => ({ id: p.id, nombre: p.nombre }))
      });
      return `❓ Proyecto ID: ${id}`;
    }
    
    return proyecto.nombre || `Proyecto ${id}`;
  }

  getNombreUsuario(id: number | string | undefined | null): string {
    if (!id && id !== 0) {
      console.log('🔍 Usuario ID es null/undefined:', id);
      return '❌ Sin usuario asignado';
    }
    
    const usuario = this.usuarios.find(u => String(u.id) === String(id));
    if (!usuario) {
      console.warn(`⚠️  Usuario no encontrado para ID: ${id}`, {
        id_buscado: id,
        tipo: typeof id,
        usuarios_disponibles: this.usuarios.map(u => ({ id: u.id, nombre: u.nombre }))
      });
      return `❓ Usuario ID: ${id}`;
    }
    
    return usuario.nombre || `Usuario ${id}`;
  }

  trackByReporte(index: number, reporte: ReporteLaboral): any {
    return reporte.id || index;
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroMaquina = '';
    this.filtroProyecto = '';
    this.filtroUsuario = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.cargarReportes();
  }
}