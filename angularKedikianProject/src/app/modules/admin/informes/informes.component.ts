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
        this.cargarReportes();
      },
      error: (error) => {
        console.error('Error cargando datos iniciales:', error);
        this.cargandoDatos = false;
      }
    });
  }

  cargarReportes(): void {
    // 🔹 Construir filtros solo con valores válidos
    const filtros: any = {};
    
    if (this.filtroBusqueda?.trim()) {
      filtros.busqueda = this.filtroBusqueda.trim();
    }
    if (this.filtroMaquina) {
      filtros.maquina_id = this.filtroMaquina;
    }
    if (this.filtroProyecto) {
      filtros.proyecto_id = this.filtroProyecto;
    }
    if (this.filtroUsuario) {
      filtros.usuario_id = this.filtroUsuario;
    }
    if (this.filtroFechaDesde) {
      filtros.fecha_desde = this.filtroFechaDesde;
    }
    if (this.filtroFechaHasta) {
      filtros.fecha_hasta = this.filtroFechaHasta;
    }

    console.log('🔍 Filtros aplicados:', filtros); // Debug temporal

    this.reportesService.getReportes(filtros).subscribe({
      next: (data) => {
        const reportesNormalizados = data.map(reporte => ({
          ...reporte,
          proyecto_id: reporte.proyecto_id ?? null,
          maquina_id: reporte.maquina_id ?? null,
          usuario_id: reporte.usuario_id ?? null
        }));

        this.reportes = reportesNormalizados.map(reporte => ({
          ...reporte,
          maquina_nombre: this.getNombreMaquina(reporte.maquina_id),
          proyecto_nombre: this.getNombreProyecto(reporte.proyecto_id),
          usuario_nombre: this.getNombreUsuario(reporte.usuario_id),
        }));

        this.paginaActual = 1;
        this.cargandoDatos = false;
        
        console.log(`✅ ${this.reportes.length} reportes cargados`); // Debug temporal
      },
      error: (error) => {
        console.error('❌ Error cargando reportes:', error);
        this.cargandoDatos = false;
      }
    });
  }

  // ===== REFLEJAR NOMBRES =====
  getNombreMaquina(id: number | string | undefined | null): string {
    if (!id && id !== 0) return '❌ Sin máquina asignada';
    const maquina = this.maquinas.find(m => String(m.id) === String(id));
    return maquina ? maquina.nombre : `❓ Máquina ID: ${id}`;
  }

  getNombreProyecto(id: number | string | undefined | null): string {
    if (!id && id !== 0) return '❌ Sin proyecto asignado';
    const proyecto = this.proyectos.find(p => String(p.id) === String(id));
    return proyecto ? proyecto.nombre : `❓ Proyecto ID: ${id}`;
  }

  getNombreUsuario(id: number | string | undefined | null): string {
    if (!id && id !== 0) return '❌ Sin usuario asignado';
    const usuario = this.usuarios.find(u => String(u.id) === String(id));
    return usuario ? usuario.nombre : `❓ Usuario ID: ${id}`;
  }

  // ===== CRUD DE REPORTES =====
  abrirModal(): void {
    this.modalAbierto = true;
    this.reporteEditando = false;
    this.formulario = { fecha_asignacion: new Date().toISOString().split('T')[0] };
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
    if (this.reporteEditando && this.formulario.id) {
      this.reportesService.updateReporte(this.formulario).subscribe(r => {
        this.machinesService.obtenerMaquinas().subscribe(maquinasActualizadas => {
          this.maquinas = maquinasActualizadas;
          this.cargarReportes();
          this.cerrarModal();
        });
      });
    } else {
      this.reportesService.createReporte(this.formulario).subscribe(r => {
        this.machinesService.obtenerMaquinas().subscribe(maquinasActualizadas => {
          this.maquinas = maquinasActualizadas;
          this.cargarReportes();
          this.cerrarModal();
        });
      });
    }
  }

  eliminarReporte(id: number | undefined): void {
    if (!id) return;
    if (confirm('¿Estás seguro de eliminar este informe?')) {
      this.reportesService.deleteReporte(id).subscribe(() => this.cargarReportes());
    }
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

  // ===== PAGINACIÓN =====
  get reportesPaginados(): ReporteLaboral[] {
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.reportes.slice(start, start + this.itemsPorPagina);
  }

  paginaAnterior(): void { if (this.paginaActual > 1) this.paginaActual--; }
  paginaSiguiente(): void { if (this.paginaActual < this.totalPaginas) this.paginaActual++; }
  get totalPaginas(): number { return Math.max(1, Math.ceil(this.reportes.length / this.itemsPorPagina)); }
  trackByReporte(index: number, reporte: ReporteLaboral): any { return reporte.id || index; }
}