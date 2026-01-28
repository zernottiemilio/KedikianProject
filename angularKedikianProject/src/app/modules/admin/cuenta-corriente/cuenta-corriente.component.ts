import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CuentaCorrienteService } from '../../../core/services/cuenta-corriente.service';
import { ProjectService, Project } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ResumenCuentaCorriente,
  DetalleAridoConPrecio,
  DetalleHorasConTarifa,
  ReporteCuentaCorriente,
  EstadoPago,
  RequestGenerarReporte
} from '../../../core/models/cuenta-corriente.models';

@Component({
  selector: 'app-cuenta-corriente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cuenta-corriente.component.html',
  styleUrls: ['./cuenta-corriente.component.css'],
})
export class CuentaCorrienteComponent implements OnInit {
  // Propiedades principales
  proyectos: Project[] = [];
  proyectoSeleccionado: number | null = null;
  resumen: ResumenCuentaCorriente | null = null;
  reportes: ReporteCuentaCorriente[] = [];

  // Control de período
  periodoActual: 'semana' | 'personalizado' = 'semana';
  fechaInicio: string = '';
  fechaFin: string = '';

  // Estados de carga
  cargandoResumen = false;
  cargandoReportes = false;

  // Modales
  mostrarModalGenerarReporte = false;
  mostrarModalExportar = false;
  reporteSeleccionadoExportar: number | null = null;

  // Formularios
  reporteForm: FormGroup;

  // Edición inline (guardamos el tipo_arido o maquina_id como identificador)
  editandoArido: string | null = null;
  editandoHora: number | null = null;

  // Estados de pago enum
  EstadoPago = EstadoPago;

  // Permisos
  esAdministrador = false;

  constructor(
    private cuentaCorrienteService: CuentaCorrienteService,
    private projectService: ProjectService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.reporteForm = this.fb.group({
      periodo_inicio: ['', Validators.required],
      periodo_fin: ['', Validators.required],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.verificarPermisos();
    this.cargarProyectos();
    this.calcularSemanaActual();
  }

  // ------------------------
  // Inicialización y permisos
  // ------------------------

  verificarPermisos(): void {
    const usuario = this.authService.obtenerUsuarioActual();
    this.esAdministrador = usuario?.roles?.includes('administrador') || false;
  }

  // ------------------------
  // Carga de datos
  // ------------------------

  cargarProyectos(): void {
    const usuario = this.authService.obtenerUsuarioActual();

    if (usuario?.roles?.includes('cliente')) {
      // Si es cliente, filtrar solo sus proyectos
      this.projectService.getProjects().subscribe({
        next: (proyectos) => {
          // Aquí deberías filtrar por usuario_id si el backend lo soporta
          this.proyectos = proyectos.filter(p => p.estado);
          if (this.proyectos.length > 0) {
            this.proyectoSeleccionado = this.proyectos[0].id;
            this.cargarDatos();
          }
        },
        error: (error) => {
          // Manejo de errores silencioso
        }
      });
    } else {
      // Si es administrador, mostrar todos los proyectos activos (filtrados del lado cliente)
      this.projectService.getProjects().subscribe({
        next: (proyectos) => {
          // Filtrar solo proyectos activos
          this.proyectos = proyectos.filter(p => p.estado);
          if (this.proyectos.length > 0) {
            this.proyectoSeleccionado = this.proyectos[0].id;
            this.cargarDatos();
          }
        },
        error: (error) => {
          console.error('Error al cargar proyectos:', error);
        }
      });
    }
  }

  cargarDatos(): void {
    if (!this.proyectoSeleccionado) return;

    this.cargarResumen();
    this.cargarReportes();
  }

  cargarResumen(): void {
    if (!this.proyectoSeleccionado) return;

    this.cargandoResumen = true;

    this.cuentaCorrienteService.getResumenProyecto(
      this.proyectoSeleccionado,
      {
        fecha_inicio: this.fechaInicio,
        fecha_fin: this.fechaFin
      }
    ).subscribe({
      next: (resumen) => {
        this.resumen = resumen;
        this.cargandoResumen = false;
      },
      error: (error) => {
        console.error('Error al cargar resumen:', error);
        this.cargandoResumen = false;
      }
    });
  }

  cargarReportes(): void {
    if (!this.proyectoSeleccionado) return;

    this.cargandoReportes = true;

    this.cuentaCorrienteService.getReportes(this.proyectoSeleccionado).subscribe({
      next: (reportes) => {
        this.reportes = reportes;
        this.cargandoReportes = false;
      },
      error: (error) => {
        console.error('Error al cargar reportes:', error);
        this.cargandoReportes = false;
      }
    });
  }

  // ------------------------
  // Gestión de período
  // ------------------------

  calcularSemanaActual(): void {
    const hoy = new Date();
    const primerDia = new Date(hoy);
    primerDia.setDate(hoy.getDate() - hoy.getDay()); // Domingo

    const ultimoDia = new Date(primerDia);
    ultimoDia.setDate(primerDia.getDate() + 6); // Sábado

    this.fechaInicio = this.formatearFecha(primerDia);
    this.fechaFin = this.formatearFecha(ultimoDia);
  }

  formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  cambiarPeriodo(tipo: 'semana' | 'personalizado'): void {
    this.periodoActual = tipo;

    if (tipo === 'semana') {
      this.calcularSemanaActual();
      this.cargarDatos();
    }
  }

  aplicarFechasPersonalizadas(): void {
    if (this.fechaInicio && this.fechaFin) {
      this.cargarDatos();
    }
  }

  onProyectoChange(): void {
    this.cargarDatos();
  }

  // ------------------------
  // Edición inline
  // ------------------------

  iniciarEdicionArido(arido: DetalleAridoConPrecio): void {
    if (!this.esAdministrador) return;
    this.editandoArido = arido.tipo_arido;
  }

  guardarEdicionArido(arido: DetalleAridoConPrecio): void {
    // Aquí deberías implementar la lógica para guardar los cambios en el backend
    // Los cambios se deberían hacer en los registros de áridos individuales
    // Por ahora solo cerramos la edición
    this.editandoArido = null;
    this.cargarResumen();
  }

  cancelarEdicionArido(): void {
    this.editandoArido = null;
  }

  iniciarEdicionHora(hora: DetalleHorasConTarifa): void {
    if (!this.esAdministrador) return;
    this.editandoHora = hora.maquina_id;
  }

  guardarEdicionHora(hora: DetalleHorasConTarifa): void {
    // Aquí deberías implementar la lógica para guardar los cambios en el backend
    // Los cambios se deberían hacer en los registros de horas individuales
    // Por ahora solo cerramos la edición
    this.editandoHora = null;
    this.cargarResumen();
  }

  cancelarEdicionHora(): void {
    this.editandoHora = null;
  }

  // ------------------------
  // Gestión de reportes
  // ------------------------

  abrirModalGenerarReporte(): void {
    this.reporteForm.patchValue({
      periodo_inicio: this.fechaInicio,
      periodo_fin: this.fechaFin
    });
    this.mostrarModalGenerarReporte = true;
  }

  cerrarModalGenerarReporte(): void {
    this.mostrarModalGenerarReporte = false;
    this.reporteForm.reset();
  }

  generarReporte(): void {
    if (this.reporteForm.invalid || !this.proyectoSeleccionado) return;

    const request: RequestGenerarReporte = {
      proyecto_id: this.proyectoSeleccionado,
      periodo_inicio: this.reporteForm.value.periodo_inicio,
      periodo_fin: this.reporteForm.value.periodo_fin,
      observaciones: this.reporteForm.value.observaciones
    };

    this.cuentaCorrienteService.generarReporte(request).subscribe({
      next: (reporte) => {
        console.log('Reporte generado:', reporte);
        this.cargarReportes();
        this.cerrarModalGenerarReporte();
      },
      error: (error) => {
        console.error('Error al generar reporte:', error);
      }
    });
  }

  cambiarEstadoReporte(reporte: ReporteCuentaCorriente, nuevoEstado: EstadoPago): void {
    if (!this.esAdministrador) return;

    this.cuentaCorrienteService.actualizarEstadoPago(reporte.id, { estado: nuevoEstado }).subscribe({
      next: (reporteActualizado) => {
        console.log('Estado actualizado:', reporteActualizado);
        this.cargarReportes();
      },
      error: (error) => {
        console.error('Error al actualizar estado:', error);
      }
    });
  }

  // ------------------------
  // Exportación
  // ------------------------

  abrirModalExportar(reporteId: number): void {
    this.reporteSeleccionadoExportar = reporteId;
    this.mostrarModalExportar = true;
  }

  cerrarModalExportar(): void {
    this.mostrarModalExportar = false;
    this.reporteSeleccionadoExportar = null;
  }

  exportarPDF(reporteId: number): void {
    this.cuentaCorrienteService.exportarPDF(reporteId).subscribe({
      next: (blob) => {
        const fecha = new Date().toISOString().split('T')[0];
        this.cuentaCorrienteService.descargarArchivo(blob, `reporte_${reporteId}_${fecha}.pdf`);
        this.cerrarModalExportar();
      },
      error: (error) => {
        console.error('Error al exportar PDF:', error);
      }
    });
  }

  exportarExcel(reporteId: number): void {
    this.cuentaCorrienteService.exportarExcel(reporteId).subscribe({
      next: (blob) => {
        const fecha = new Date().toISOString().split('T')[0];
        this.cuentaCorrienteService.descargarArchivo(blob, `reporte_${reporteId}_${fecha}.xlsx`);
        this.cerrarModalExportar();
      },
      error: (error) => {
        console.error('Error al exportar Excel:', error);
      }
    });
  }

  // ------------------------
  // Utilidades
  // ------------------------

  getEstadoBadgeClass(estado: EstadoPago): string {
    switch (estado) {
      case EstadoPago.PAGADO:
        return 'badge-success';
      case EstadoPago.PENDIENTE:
        return 'badge-warning';
      case EstadoPago.PARCIAL:
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  getEstadoTexto(estado: EstadoPago): string {
    switch (estado) {
      case EstadoPago.PAGADO:
        return 'Pagado';
      case EstadoPago.PENDIENTE:
        return 'Pendiente';
      case EstadoPago.PARCIAL:
        return 'Parcial';
      default:
        return estado;
    }
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor);
  }

  formatearFechaLegible(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR');
  }
}
