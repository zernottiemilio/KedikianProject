import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
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
  RequestGenerarReporte,
  RequestRegistrarPago,
  PagoReporte,
  RequestActualizarReporte
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
  periodoActual: 'semana' | 'mes' | 'anual' | 'personalizado' = 'semana';
  fechaInicio: string = '';
  fechaFin: string = '';

  // Selección de items para reporte personalizado
  aridosSeleccionados: Set<string> = new Set(); // Set de tipo_arido
  horasSeleccionadas: Set<number> = new Set(); // Set de maquina_id

  // Estados de carga
  cargandoResumen = false;
  cargandoReportes = false;

  // Modales
  mostrarModalGenerarReporte = false;
  mostrarModalExportar = false;
  reporteSeleccionadoExportar: number | null = null;

  // Modal de pago parcial
  mostrarModalPagoParcial = false;
  reportePagoParcial: ReporteCuentaCorriente | null = null;
  cargandoPagoDetalle = false;
  pagosAridos: { tipo_arido: string; importe: number; pagado: boolean }[] = [];
  pagosHoras: { maquina_id: number; maquina_nombre: string; importe: number; pagado: boolean }[] = [];

  // Reporte expandido
  reporteExpandido: number | null = null;

  // Detalles de reportes expandidos (cacheo)
  reportesConDetalle: Map<number, ReporteCuentaCorriente> = new Map();

  // Formularios
  reporteForm: FormGroup;
  pagoForm: FormGroup;

  // Edición inline (guardamos el tipo_arido o maquina_id como identificador)
  editandoArido: string | null = null;
  editandoHora: number | null = null;

  // Backup de valores originales para poder revertir
  backupAridoOriginal: DetalleAridoConPrecio | null = null;
  backupHoraOriginal: DetalleHorasConTarifa | null = null;

  // Modal de confirmación de cambios
  mostrarModalConfirmacion = false;
  confirmacionData: any = null;
  tipoConfirmacion: 'arido' | 'maquina' | null = null;

  // Estados de pago enum
  EstadoPago = EstadoPago;

  // Permisos
  esAdministrador = false;

  // Vista de pendientes
  mostrandoPendientes = false;
  reportesPendientes: ReporteCuentaCorriente[] = [];
  todosLosProyectos: Project[] = [];
  cargandoPendientes = false;

  // Modal de registro de pago
  mostrarModalRegistrarPago = false;
  reporteParaPago: ReporteCuentaCorriente | null = null;
  cargandoHistorialPagos = false;

  // Modal de edición de reporte
  mostrarModalEditarReporte = false;
  reporteParaEditar: ReporteCuentaCorriente | null = null;
  editarReporteForm: FormGroup;

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

    // Inicializar formulario de pago con fecha actual por defecto
    const hoy = new Date().toISOString().split('T')[0];
    this.pagoForm = this.fb.group({
      monto: ['', [Validators.required, Validators.min(0.01)]],
      fecha: [hoy, Validators.required],
      observaciones: ['']
    });

    // Inicializar formulario de edición de reporte
    this.editarReporteForm = this.fb.group({
      observaciones: [''],
      numero_factura: [''],
      fecha_pago: ['']
    });
  }

  ngOnInit(): void {
    this.verificarPermisos();
    this.restaurarEstado();
    this.cargarProyectos();
    this.cargarReportesPendientes();
    if (!this.fechaInicio || !this.fechaFin) {
      this.calcularSemanaActual();
    }
  }

  // ------------------------
  // Inicialización y permisos
  // ------------------------

  verificarPermisos(): void {
    // Solo el administrador tiene acceso a este panel
    this.esAdministrador = true;
  }

  // ------------------------
  // Persistencia de estado
  // ------------------------

  guardarEstado(): void {
    const estado = {
      proyectoSeleccionado: this.proyectoSeleccionado,
      periodoActual: this.periodoActual,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      reporteExpandido: this.reporteExpandido,
      editandoArido: this.editandoArido,
      editandoHora: this.editandoHora,
      backupAridoOriginal: this.backupAridoOriginal,
      backupHoraOriginal: this.backupHoraOriginal
    };
    localStorage.setItem('cuentaCorriente_estado', JSON.stringify(estado));
  }

  restaurarEstado(): void {
    const estadoStr = localStorage.getItem('cuentaCorriente_estado');
    if (estadoStr) {
      try {
        const estado = JSON.parse(estadoStr);
        this.proyectoSeleccionado = estado.proyectoSeleccionado;
        this.periodoActual = estado.periodoActual || 'semana';
        this.fechaInicio = estado.fechaInicio;
        this.fechaFin = estado.fechaFin;
        this.reporteExpandido = estado.reporteExpandido;
        this.editandoArido = estado.editandoArido;
        this.editandoHora = estado.editandoHora;
        this.backupAridoOriginal = estado.backupAridoOriginal;
        this.backupHoraOriginal = estado.backupHoraOriginal;
      } catch (error) {
        console.error('Error al restaurar estado:', error);
      }
    }
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
        error: () => {
          // Manejo de errores silencioso
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
        // Limpiar selecciones previas al cargar nuevo resumen
        this.aridosSeleccionados.clear();
        this.horasSeleccionadas.clear();
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

  calcularMesActual(): void {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    this.fechaInicio = this.formatearFecha(primerDia);
    this.fechaFin = this.formatearFecha(ultimoDia);
  }

  calcularAnualActual(): void {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), 0, 1); // 1 de enero
    const ultimoDia = new Date(hoy.getFullYear(), 11, 31); // 31 de diciembre

    this.fechaInicio = this.formatearFecha(primerDia);
    this.fechaFin = this.formatearFecha(ultimoDia);
  }

  formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  cambiarPeriodo(tipo: 'semana' | 'mes' | 'anual' | 'personalizado'): void {
    this.periodoActual = tipo;

    if (tipo === 'semana') {
      this.calcularSemanaActual();
      this.cargarDatos();
    } else if (tipo === 'mes') {
      this.calcularMesActual();
      this.cargarDatos();
    } else if (tipo === 'anual') {
      this.calcularAnualActual();
      this.cargarDatos();
    } else if (tipo === 'personalizado') {
      // Pre-llenar con las fechas actuales si están vacías
      if (!this.fechaInicio || !this.fechaFin) {
        this.calcularMesActual(); // Usar mes actual como punto de partida
      }
    }

    this.guardarEstado();
  }

  onFechaChange(): void {
    // Aplicar filtro automáticamente cuando ambas fechas estén completas
    if (this.fechaInicio && this.fechaFin) {
      this.cargarDatos();
    }
    this.guardarEstado();
  }

  onProyectoChange(): void {
    this.cargarDatos();
    this.guardarEstado();
  }

  // ------------------------
  // Edición inline
  // ------------------------

  iniciarEdicionArido(arido: DetalleAridoConPrecio): void {
    if (!this.esAdministrador) return;

    // Guardar copia solo del precio original (la cantidad no se edita)
    this.backupAridoOriginal = {
      tipo_arido: arido.tipo_arido,
      cantidad: arido.cantidad,
      precio_unitario: arido.precio_unitario,
      importe: arido.importe
    };

    this.editandoArido = arido.tipo_arido;
  }

  guardarEdicionArido(arido: DetalleAridoConPrecio): void {
    if (!this.proyectoSeleccionado || !this.backupAridoOriginal) return;

    console.log('Guardando árido:', {
      tipo: arido.tipo_arido,
      precio_unitario: arido.precio_unitario
    });

    // Guardar los datos para el modal de confirmación
    this.confirmacionData = {
      tipo: 'árido',
      descripcion: arido.tipo_arido,
      valorAnterior: this.backupAridoOriginal.precio_unitario,
      valorNuevo: arido.precio_unitario,
      proyectoId: this.proyectoSeleccionado,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin
    };

    this.tipoConfirmacion = 'arido';
    this.mostrarModalConfirmacion = true;
  }

  cancelarEdicionArido(): void {
    // Revertir cambios del precio si hay un backup
    if (this.backupAridoOriginal && this.resumen) {
      const arido = this.resumen.aridos.find(a => a.tipo_arido === this.editandoArido);
      if (arido) {
        arido.precio_unitario = this.backupAridoOriginal.precio_unitario;
        arido.importe = this.backupAridoOriginal.importe;
      }
    }

    this.editandoArido = null;
    this.backupAridoOriginal = null;
  }

  recalcularImporteArido(arido: DetalleAridoConPrecio): void {
    // Recalcular el importe cuando cambia el precio unitario
    arido.importe = arido.cantidad * arido.precio_unitario;
  }

  iniciarEdicionHora(hora: DetalleHorasConTarifa): void {
    if (!this.esAdministrador) return;

    // Guardar copia solo de la tarifa original (las horas no se editan)
    this.backupHoraOriginal = {
      maquina_id: hora.maquina_id,
      maquina_nombre: hora.maquina_nombre,
      total_horas: hora.total_horas,
      tarifa_hora: hora.tarifa_hora,
      importe: hora.importe
    };

    this.editandoHora = hora.maquina_id;
  }

  guardarEdicionHora(hora: DetalleHorasConTarifa): void {
    if (!this.proyectoSeleccionado || !this.backupHoraOriginal) return;

    console.log('Guardando hora máquina:', {
      maquina_id: hora.maquina_id,
      maquina_nombre: hora.maquina_nombre,
      tarifa_hora: hora.tarifa_hora
    });

    // Guardar los datos para el modal de confirmación
    this.confirmacionData = {
      tipo: 'máquina',
      descripcion: hora.maquina_nombre,
      maquinaId: hora.maquina_id,
      valorAnterior: this.backupHoraOriginal.tarifa_hora,
      valorNuevo: hora.tarifa_hora,
      proyectoId: this.proyectoSeleccionado,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin
    };

    this.tipoConfirmacion = 'maquina';
    this.mostrarModalConfirmacion = true;
  }

  cancelarEdicionHora(): void {
    // Revertir cambios de la tarifa si hay un backup
    if (this.backupHoraOriginal && this.resumen) {
      const hora = this.resumen.horas_maquinas.find(h => h.maquina_id === this.editandoHora);
      if (hora) {
        hora.tarifa_hora = this.backupHoraOriginal.tarifa_hora;
        hora.importe = this.backupHoraOriginal.importe;
      }
    }

    this.editandoHora = null;
    this.backupHoraOriginal = null;
  }

  recalcularImporteMaquina(hora: DetalleHorasConTarifa): void {
    // Recalcular el importe cuando cambia la tarifa por hora
    hora.importe = hora.total_horas * hora.tarifa_hora;
  }

  // ------------------------
  // Confirmación de cambios
  // ------------------------

  confirmarActualizacion(): void {
    if (!this.confirmacionData) return;

    console.log('Confirmando actualización:', this.confirmacionData);

    if (this.tipoConfirmacion === 'arido') {
      // Actualizar precio de árido
      console.log('Enviando actualización de precio árido:', {
        proyectoId: this.confirmacionData.proyectoId,
        tipoArido: this.confirmacionData.descripcion,
        nuevoPrecio: this.confirmacionData.valorNuevo,
        periodoInicio: this.confirmacionData.fechaInicio,
        periodoFin: this.confirmacionData.fechaFin
      });

      this.cuentaCorrienteService.actualizarPrecioArido(
        this.confirmacionData.proyectoId,
        this.confirmacionData.descripcion,
        this.confirmacionData.valorNuevo,
        this.confirmacionData.fechaInicio,
        this.confirmacionData.fechaFin
      ).subscribe({
        next: (response) => {
          console.log('Precio actualizado exitosamente:', response);
          // Cerrar modal y edición
          this.mostrarModalConfirmacion = false;
          this.editandoArido = null;
          this.backupAridoOriginal = null;
          this.confirmacionData = null;
          this.tipoConfirmacion = null;
          // Recargar datos
          this.cargarResumen();
        },
        error: (error) => {
          console.error('Error al actualizar precio:', error);
          this.mostrarModalConfirmacion = false;
          this.editandoArido = null;
          this.backupAridoOriginal = null;
          this.confirmacionData = null;
          this.tipoConfirmacion = null;

          let mensajeError = 'Error al actualizar el precio. ';
          if (error.status === 404) {
            mensajeError += 'El endpoint no existe en el servidor. Contacte al administrador del sistema.';
          } else if (error.status === 401) {
            mensajeError += 'No tiene permisos para realizar esta acción.';
          } else if (error.status === 500) {
            mensajeError += 'Error interno del servidor.';
          } else {
            mensajeError += 'Por favor, intente nuevamente.';
          }

          alert(mensajeError);
          // Recargar para revertir cambios visuales
          this.cargarResumen();
        }
      });
    } else if (this.tipoConfirmacion === 'maquina') {
      // Actualizar tarifa de máquina
      console.log('Enviando actualización de tarifa máquina:', {
        proyectoId: this.confirmacionData.proyectoId,
        maquinaId: this.confirmacionData.maquinaId,
        nuevaTarifa: this.confirmacionData.valorNuevo,
        periodoInicio: this.confirmacionData.fechaInicio,
        periodoFin: this.confirmacionData.fechaFin
      });

      this.cuentaCorrienteService.actualizarTarifaMaquina(
        this.confirmacionData.proyectoId,
        this.confirmacionData.maquinaId,
        this.confirmacionData.valorNuevo,
        this.confirmacionData.fechaInicio,
        this.confirmacionData.fechaFin
      ).subscribe({
        next: (response) => {
          console.log('Tarifa actualizada exitosamente:', response);
          // Cerrar modal y edición
          this.mostrarModalConfirmacion = false;
          this.editandoHora = null;
          this.backupHoraOriginal = null;
          this.confirmacionData = null;
          this.tipoConfirmacion = null;
          // Recargar datos
          this.cargarResumen();
        },
        error: (error) => {
          console.error('Error al actualizar tarifa:', error);
          this.mostrarModalConfirmacion = false;
          this.editandoHora = null;
          this.backupHoraOriginal = null;
          this.confirmacionData = null;
          this.tipoConfirmacion = null;

          let mensajeError = 'Error al actualizar la tarifa. ';
          if (error.status === 404) {
            mensajeError += 'El endpoint no existe en el servidor. Contacte al administrador del sistema.';
          } else if (error.status === 401) {
            mensajeError += 'No tiene permisos para realizar esta acción.';
          } else if (error.status === 500) {
            mensajeError += 'Error interno del servidor.';
          } else {
            mensajeError += 'Por favor, intente nuevamente.';
          }

          alert(mensajeError);
          // Recargar para revertir cambios visuales
          this.cargarResumen();
        }
      });
    }
  }

  cancelarActualizacion(): void {
    this.mostrarModalConfirmacion = false;
    this.confirmacionData = null;
    this.tipoConfirmacion = null;
    // Recargar para revertir cambios visuales
    this.cargarResumen();
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
      observaciones: this.reporteForm.value.observaciones,
      // Incluir solo los items seleccionados
      aridos_seleccionados: Array.from(this.aridosSeleccionados),
      maquinas_seleccionadas: Array.from(this.horasSeleccionadas)
    };

    console.log('Generando reporte con selección:', {
      aridos: request.aridos_seleccionados,
      maquinas: request.maquinas_seleccionadas,
      total_items: (request.aridos_seleccionados?.length || 0) + (request.maquinas_seleccionadas?.length || 0)
    });

    this.cuentaCorrienteService.generarReporte(request).subscribe({
      next: (reporte) => {
        console.log('Reporte generado exitosamente:', reporte);
        this.cargarReportes();
        this.cerrarModalGenerarReporte();
        // Limpiar selecciones después de generar el reporte
        this.limpiarSelecciones();
        alert('Reporte generado exitosamente con los items seleccionados.');
      },
      error: (error) => {
        console.error('Error al generar reporte:', error);
        let mensajeError = 'Error al generar el reporte. ';
        if (error.status === 400) {
          mensajeError += 'Verifique que haya seleccionado al menos un item.';
        } else if (error.status === 404) {
          mensajeError += 'El endpoint no existe en el servidor.';
        } else {
          mensajeError += 'Por favor, intente nuevamente.';
        }
        alert(mensajeError);
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

  eliminarReporte(reporteId: number): void {
    if (!this.esAdministrador) return;

    const confirmacion = confirm('¿Está seguro que desea eliminar este reporte? Esta acción no se puede deshacer.');

    if (!confirmacion) return;

    this.cuentaCorrienteService.eliminarReporte(reporteId).subscribe({
      next: () => {
        console.log('Reporte eliminado exitosamente:', reporteId);
        this.cargarReportes();
      },
      error: (error) => {
        console.error('Error al eliminar reporte:', error);
        alert('Error al eliminar el reporte. Por favor, intente nuevamente.');
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

  toggleReporte(reporteId: number): void {
    if (this.reporteExpandido === reporteId) {
      // Contraer
      this.reporteExpandido = null;
    } else {
      // Expandir y cargar detalle si no está cacheado
      this.reporteExpandido = reporteId;
      if (!this.reportesConDetalle.has(reporteId)) {
        this.cargarDetalleReporte(reporteId);
      }
    }
    this.guardarEstado();
  }

  isReporteExpandido(reporteId: number): boolean {
    return this.reporteExpandido === reporteId;
  }

  cargarDetalleReporte(reporteId: number): void {
    this.cuentaCorrienteService.getReporteDetalle(reporteId).subscribe({
      next: (reporte) => {
        this.reportesConDetalle.set(reporteId, reporte);
        // Actualizar también en la lista principal
        const index = this.reportes.findIndex(r => r.id === reporteId);
        if (index !== -1) {
          this.reportes[index] = { ...this.reportes[index], ...reporte };
        }
      },
      error: (error) => {
        console.error('Error al cargar detalle del reporte:', error);
      }
    });
  }

  getReporteConDetalle(reporteId: number): ReporteCuentaCorriente | undefined {
    return this.reportesConDetalle.get(reporteId) || this.reportes.find(r => r.id === reporteId);
  }

  marcarTodosItemsPagados(reporteId: number): void {
    if (!this.esAdministrador) return;

    this.cambiarEstadoReporte(
      this.reportes.find(r => r.id === reporteId)!,
      EstadoPago.PAGADO
    );
  }

  marcarTodosItemsPendientes(reporteId: number): void {
    if (!this.esAdministrador) return;

    this.cambiarEstadoReporte(
      this.reportes.find(r => r.id === reporteId)!,
      EstadoPago.PENDIENTE
    );
  }

  // ------------------------
  // Selección de items en resumen
  // ------------------------

  toggleAridoSeleccionado(tipoArido: string): void {
    if (this.aridosSeleccionados.has(tipoArido)) {
      this.aridosSeleccionados.delete(tipoArido);
    } else {
      this.aridosSeleccionados.add(tipoArido);
    }
    this.aridosSeleccionados = new Set(this.aridosSeleccionados); // Trigger change detection
  }

  toggleHoraSeleccionada(maquinaId: number): void {
    if (this.horasSeleccionadas.has(maquinaId)) {
      this.horasSeleccionadas.delete(maquinaId);
    } else {
      this.horasSeleccionadas.add(maquinaId);
    }
    this.horasSeleccionadas = new Set(this.horasSeleccionadas); // Trigger change detection
  }

  isAridoSeleccionado(tipoArido: string): boolean {
    return this.aridosSeleccionados.has(tipoArido);
  }

  isHoraSeleccionada(maquinaId: number): boolean {
    return this.horasSeleccionadas.has(maquinaId);
  }

  toggleSeleccionarTodosAridos(): void {
    if (!this.resumen) return;

    if (this.todosAridosSeleccionados()) {
      // Deseleccionar todos
      this.aridosSeleccionados.clear();
    } else {
      // Seleccionar todos
      this.resumen.aridos.forEach(arido => {
        this.aridosSeleccionados.add(arido.tipo_arido);
      });
    }
    this.aridosSeleccionados = new Set(this.aridosSeleccionados);
  }

  toggleSeleccionarTodasHoras(): void {
    if (!this.resumen) return;

    if (this.todasHorasSeleccionadas()) {
      // Deseleccionar todas
      this.horasSeleccionadas.clear();
    } else {
      // Seleccionar todas
      this.resumen.horas_maquinas.forEach(hora => {
        this.horasSeleccionadas.add(hora.maquina_id);
      });
    }
    this.horasSeleccionadas = new Set(this.horasSeleccionadas);
  }

  todosAridosSeleccionados(): boolean {
    if (!this.resumen || this.resumen.aridos.length === 0) return false;
    return this.resumen.aridos.every(arido => this.aridosSeleccionados.has(arido.tipo_arido));
  }

  todasHorasSeleccionadas(): boolean {
    if (!this.resumen || this.resumen.horas_maquinas.length === 0) return false;
    return this.resumen.horas_maquinas.every(hora => this.horasSeleccionadas.has(hora.maquina_id));
  }

  // Totales de selección
  getTotalAridosSeleccionados(): number {
    if (!this.resumen) return 0;
    return this.resumen.aridos
      .filter(arido => this.aridosSeleccionados.has(arido.tipo_arido))
      .reduce((sum, arido) => sum + arido.cantidad, 0);
  }

  getTotalImporteAridosSeleccionados(): number {
    if (!this.resumen) return 0;
    return this.resumen.aridos
      .filter(arido => this.aridosSeleccionados.has(arido.tipo_arido))
      .reduce((sum, arido) => sum + arido.importe, 0);
  }

  getTotalHorasSeleccionadas(): number {
    if (!this.resumen) return 0;
    return this.resumen.horas_maquinas
      .filter(hora => this.horasSeleccionadas.has(hora.maquina_id))
      .reduce((sum, hora) => sum + hora.total_horas, 0);
  }

  getTotalImporteHorasSeleccionadas(): number {
    if (!this.resumen) return 0;
    return this.resumen.horas_maquinas
      .filter(hora => this.horasSeleccionadas.has(hora.maquina_id))
      .reduce((sum, hora) => sum + hora.importe, 0);
  }

  getTotalGeneralSeleccionado(): number {
    return this.getTotalImporteAridosSeleccionados() + this.getTotalImporteHorasSeleccionadas();
  }

  haySeleccion(): boolean {
    return this.aridosSeleccionados.size > 0 || this.horasSeleccionadas.size > 0;
  }

  limpiarSelecciones(): void {
    this.aridosSeleccionados.clear();
    this.horasSeleccionadas.clear();
  }

  // ------------------------
  // Modal de pago parcial
  // ------------------------

  abrirModalPagoParcial(reporte: ReporteCuentaCorriente): void {
    this.reportePagoParcial = reporte;
    this.mostrarModalPagoParcial = true;
    this.pagosAridos = [];
    this.pagosHoras = [];

    const detalle = this.getReporteConDetalle(reporte.id);
    if (detalle?.items_aridos !== undefined && detalle?.items_horas !== undefined) {
      this.inicializarPagosModal(detalle);
    } else {
      this.cargandoPagoDetalle = true;
      this.cuentaCorrienteService.getReporteDetalle(reporte.id).subscribe({
        next: (det) => {
          this.reportesConDetalle.set(reporte.id, det);
          this.inicializarPagosModal(det);
          this.cargandoPagoDetalle = false;
        },
        error: () => {
          this.cargandoPagoDetalle = false;
        }
      });
    }
  }

  inicializarPagosModal(reporte: ReporteCuentaCorriente): void {
    // Agrupar áridos por tipo_arido
    const aridosMap = new Map<string, { importe: number; pagado: boolean }>();
    (reporte.items_aridos || []).forEach(item => {
      if (!aridosMap.has(item.tipo_arido)) {
        aridosMap.set(item.tipo_arido, { importe: 0, pagado: true });
      }
      const entry = aridosMap.get(item.tipo_arido)!;
      entry.importe += item.importe;
      if (!item.pagado) entry.pagado = false;
    });
    this.pagosAridos = Array.from(aridosMap.entries()).map(([tipo_arido, data]) => ({
      tipo_arido,
      importe: data.importe,
      pagado: data.pagado
    }));

    // Agrupar horas por maquina_id
    const horasMap = new Map<number, { maquina_nombre: string; importe: number; pagado: boolean }>();
    (reporte.items_horas || []).forEach(item => {
      if (!horasMap.has(item.maquina_id)) {
        horasMap.set(item.maquina_id, { maquina_nombre: item.maquina_nombre, importe: 0, pagado: true });
      }
      const entry = horasMap.get(item.maquina_id)!;
      entry.importe += item.importe;
      if (!item.pagado) entry.pagado = false;
    });
    this.pagosHoras = Array.from(horasMap.entries()).map(([maquina_id, data]) => ({
      maquina_id,
      maquina_nombre: data.maquina_nombre,
      importe: data.importe,
      pagado: data.pagado
    }));
  }

  cerrarModalPagoParcial(): void {
    this.mostrarModalPagoParcial = false;
    this.reportePagoParcial = null;
    this.pagosAridos = [];
    this.pagosHoras = [];
  }

  getTotalReporteModal(): number {
    return [...this.pagosAridos, ...this.pagosHoras].reduce((sum, i) => sum + i.importe, 0);
  }

  getTotalPagadoModal(): number {
    const aridos = this.pagosAridos.filter(i => i.pagado).reduce((sum, i) => sum + i.importe, 0);
    const horas = this.pagosHoras.filter(i => i.pagado).reduce((sum, i) => sum + i.importe, 0);
    return aridos + horas;
  }

  getTotalPendienteModal(): number {
    return this.getTotalReporteModal() - this.getTotalPagadoModal();
  }

  guardarPagoParcial(): void {
    if (!this.reportePagoParcial) return;

    // Calcular nuevo estado según los conceptos seleccionados
    const totalItems = this.pagosAridos.length + this.pagosHoras.length;
    const pagados = this.pagosAridos.filter(i => i.pagado).length
                  + this.pagosHoras.filter(i => i.pagado).length;

    let nuevoEstado: EstadoPago;
    if (pagados === 0) nuevoEstado = EstadoPago.PENDIENTE;
    else if (pagados === totalItems) nuevoEstado = EstadoPago.PAGADO;
    else nuevoEstado = EstadoPago.PARCIAL;

    const reporteId = this.reportePagoParcial.id;

    // Intentar actualizar el estado a nivel de ítems (fire-and-forget)
    this.cuentaCorrienteService.actualizarItemsPago(reporteId, {
      aridos: this.pagosAridos.map(i => ({ tipo_arido: i.tipo_arido, pagado: i.pagado })),
      horas: this.pagosHoras.map(i => ({ maquina_id: i.maquina_id, pagado: i.pagado }))
    }).subscribe({ next: () => {}, error: () => {} });

    // Actualizar el estado general del reporte (siempre)
    this.cuentaCorrienteService.actualizarEstadoPago(reporteId, { estado: nuevoEstado }).subscribe({
      next: () => {
        this.cerrarModalPagoParcial();
        this.reportesConDetalle.delete(reporteId);
        this.cargarReportes();
        if (this.mostrandoPendientes) {
          this.cargarReportesPendientes();
        }
      },
      error: (error) => {
        console.error('Error al actualizar estado del reporte:', error);
      }
    });
  }

  getImportePagadoReporte(reporteId: number): number {
    const det = this.getReporteConDetalle(reporteId);
    if (!det) return 0;
    const aridos = (det.items_aridos || []).filter(i => i.pagado).reduce((s, i) => s + i.importe, 0);
    const horas = (det.items_horas || []).filter(i => i.pagado).reduce((s, i) => s + i.importe, 0);
    return aridos + horas;
  }

  getImportePendienteReporte(reporteId: number): number {
    const reporte = this.reportes.find(r => r.id === reporteId);
    return (reporte?.importe_total || 0) - this.getImportePagadoReporte(reporteId);
  }

  // ------------------------
  // Vista de pendientes
  // ------------------------

  togglePendientes(): void {
    this.mostrandoPendientes = !this.mostrandoPendientes;
    if (this.mostrandoPendientes) {
      this.cargarReportesPendientes();
    }
  }

  cargarReportesPendientes(): void {
    this.cargandoPendientes = true;
    forkJoin({
      reportes: this.cuentaCorrienteService.getReportes(),
      proyectos: this.projectService.getProjects()
    }).subscribe({
      next: ({ reportes, proyectos }) => {
        this.todosLosProyectos = proyectos;
        this.reportesPendientes = reportes.filter(r => r.estado === EstadoPago.PENDIENTE);
        this.cargandoPendientes = false;
      },
      error: () => {
        this.cargandoPendientes = false;
      }
    });
  }

  getProyectosConPendientes(): { proyecto_id: number; proyecto_nombre: string; reportes: ReporteCuentaCorriente[]; total: number }[] {
    const grupos = new Map<number, { proyecto_id: number; proyecto_nombre: string; reportes: ReporteCuentaCorriente[]; total: number }>();

    this.reportesPendientes.forEach(reporte => {
      if (!grupos.has(reporte.proyecto_id)) {
        const proyecto = this.todosLosProyectos.find(p => p.id === reporte.proyecto_id);
        grupos.set(reporte.proyecto_id, {
          proyecto_id: reporte.proyecto_id,
          proyecto_nombre: proyecto?.nombre || `Proyecto #${reporte.proyecto_id}`,
          reportes: [],
          total: 0
        });
      }
      const grupo = grupos.get(reporte.proyecto_id)!;
      grupo.reportes.push(reporte);
      grupo.total += reporte.importe_total;
    });

    return Array.from(grupos.values());
  }

  getTotalPendientes(): number {
    return this.reportesPendientes.reduce((sum, r) => sum + r.importe_total, 0);
  }

  marcarPagadoDesdePendientes(reporte: ReporteCuentaCorriente): void {
    if (!this.esAdministrador) return;
    this.cuentaCorrienteService.actualizarEstadoPago(reporte.id, { estado: EstadoPago.PAGADO }).subscribe({
      next: () => {
        this.cargarReportesPendientes();
      },
      error: (error) => {
        console.error('Error al actualizar estado:', error);
      }
    });
  }

  irAProyecto(proyectoId: number): void {
    this.proyectoSeleccionado = proyectoId;
    this.mostrandoPendientes = false;
    this.cargarDatos();
    this.guardarEstado();
  }

  // ------------------------
  // Registro de Pagos Parciales
  // ------------------------

  abrirModalRegistrarPago(reporte: ReporteCuentaCorriente): void {
    this.reporteParaPago = reporte;
    this.mostrarModalRegistrarPago = true;

    // Resetear formulario con fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    this.pagoForm.patchValue({
      monto: '',
      fecha: hoy,
      observaciones: ''
    });

    // Cargar historial de pagos si no está cargado
    if (!reporte.pagos) {
      this.cargarHistorialPagos(reporte.id);
    }
  }

  cerrarModalRegistrarPago(): void {
    this.mostrarModalRegistrarPago = false;
    this.reporteParaPago = null;
    this.pagoForm.reset();
  }

  cargarHistorialPagos(reporteId: number): void {
    this.cargandoHistorialPagos = true;
    this.cuentaCorrienteService.getPagosReporte(reporteId).subscribe({
      next: (pagos) => {
        // Actualizar el reporte con el historial
        const reporteEnLista = this.reportes.find(r => r.id === reporteId);
        if (reporteEnLista) {
          reporteEnLista.pagos = pagos;
          reporteEnLista.monto_pagado = pagos.reduce((sum, p) => sum + p.monto, 0);
          reporteEnLista.saldo_pendiente = reporteEnLista.importe_total - reporteEnLista.monto_pagado;
        }

        // Actualizar también en cache de detalle
        const reporteEnCache = this.reportesConDetalle.get(reporteId);
        if (reporteEnCache) {
          reporteEnCache.pagos = pagos;
          reporteEnCache.monto_pagado = pagos.reduce((sum, p) => sum + p.monto, 0);
          reporteEnCache.saldo_pendiente = reporteEnCache.importe_total - reporteEnCache.monto_pagado;
        }

        // Actualizar reporteParaPago si está abierto
        if (this.reporteParaPago && this.reporteParaPago.id === reporteId) {
          this.reporteParaPago.pagos = pagos;
          this.reporteParaPago.monto_pagado = pagos.reduce((sum, p) => sum + p.monto, 0);
          this.reporteParaPago.saldo_pendiente = this.reporteParaPago.importe_total - this.reporteParaPago.monto_pagado;
        }

        this.cargandoHistorialPagos = false;
      },
      error: (error) => {
        console.error('Error al cargar historial de pagos:', error);
        this.cargandoHistorialPagos = false;
      }
    });
  }

  registrarPago(): void {
    if (this.pagoForm.invalid || !this.reporteParaPago) return;

    const request: RequestRegistrarPago = {
      monto: this.pagoForm.value.monto,
      fecha: this.pagoForm.value.fecha,
      observaciones: this.pagoForm.value.observaciones || undefined
    };

    // Validar que el monto no exceda el saldo pendiente
    const saldoPendiente = this.getSaldoPendienteReporte();
    if (request.monto > saldoPendiente) {
      alert(`El monto no puede exceder el saldo pendiente (${this.formatearMoneda(saldoPendiente)})`);
      return;
    }

    this.cuentaCorrienteService.registrarPago(this.reporteParaPago.id, request).subscribe({
      next: (pago) => {
        console.log('Pago registrado exitosamente:', pago);

        // Recargar historial de pagos
        this.cargarHistorialPagos(this.reporteParaPago!.id);

        // Recargar lista de reportes para actualizar estados
        this.cargarReportes();

        // Recargar pendientes si está activa esa vista
        if (this.mostrandoPendientes) {
          this.cargarReportesPendientes();
        }

        // Resetear formulario
        const hoy = new Date().toISOString().split('T')[0];
        this.pagoForm.patchValue({
          monto: '',
          fecha: hoy,
          observaciones: ''
        });

        alert('Pago registrado exitosamente');
      },
      error: (error) => {
        console.error('Error al registrar pago:', error);
        let mensajeError = 'Error al registrar el pago. ';
        if (error.status === 400) {
          mensajeError += 'El monto excede el saldo pendiente o los datos son inválidos.';
        } else if (error.status === 404) {
          mensajeError += 'El reporte no existe.';
        } else {
          mensajeError += 'Por favor, intente nuevamente.';
        }
        alert(mensajeError);
      }
    });
  }

  getSaldoPendienteReporte(): number {
    if (!this.reporteParaPago) return 0;
    const montoPagado = this.reporteParaPago.monto_pagado || 0;
    return this.reporteParaPago.importe_total - montoPagado;
  }

  getTotalPagadoReporte(): number {
    if (!this.reporteParaPago) return 0;
    return this.reporteParaPago.monto_pagado || 0;
  }

  puedeRegistrarPago(reporte: ReporteCuentaCorriente): boolean {
    return this.esAdministrador && reporte.estado !== EstadoPago.PAGADO;
  }

  // ------------------------
  // Edición de Reporte
  // ------------------------

  abrirModalEditarReporte(reporte: ReporteCuentaCorriente): void {
    // Advertencia para reportes PAGADOS
    if (reporte.estado === EstadoPago.PAGADO) {
      const confirmacion = confirm(
        '⚠️ ADVERTENCIA: Este reporte está PAGADO.\n\n' +
        'Editar un reporte pagado puede afectar la contabilidad.\n' +
        '¿Está seguro de que desea continuar?'
      );
      if (!confirmacion) return;
    }

    this.reporteParaEditar = reporte;
    this.editarReporteForm.patchValue({
      observaciones: reporte.observaciones || '',
      numero_factura: reporte.numero_factura || '',
      fecha_pago: reporte.fecha_pago || ''
    });
    this.mostrarModalEditarReporte = true;
  }

  cerrarModalEditarReporte(): void {
    this.mostrarModalEditarReporte = false;
    this.reporteParaEditar = null;
    this.editarReporteForm.reset();
  }

  guardarEdicionReporte(): void {
    if (this.editarReporteForm.invalid || !this.reporteParaEditar) return;

    const datosActualizacion: RequestActualizarReporte = {
      observaciones: this.editarReporteForm.value.observaciones,
      numero_factura: this.editarReporteForm.value.numero_factura,
      fecha_pago: this.editarReporteForm.value.fecha_pago || undefined
    };

    this.cuentaCorrienteService.actualizarReporte(
      this.reporteParaEditar.id,
      datosActualizacion
    ).subscribe({
      next: (reporteActualizado) => {
        const index = this.reportes.findIndex(r => r.id === reporteActualizado.id);
        if (index !== -1) {
          this.reportes[index] = { ...this.reportes[index], ...reporteActualizado };
        }
        this.reportesConDetalle.set(reporteActualizado.id, reporteActualizado);
        this.cerrarModalEditarReporte();
        alert('Reporte actualizado exitosamente');
      },
      error: (error) => {
        console.error('Error al actualizar reporte:', error);
        alert('Error al actualizar el reporte. Por favor, intente nuevamente.');
      }
    });
  }
}
