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
  periodoActual: 'semana' | 'mes' | 'anual' | 'personalizado' = 'semana';
  fechaInicio: string = '';
  fechaFin: string = '';

  // Estados de carga
  cargandoResumen = false;
  cargandoReportes = false;

  // Modales
  mostrarModalGenerarReporte = false;
  mostrarModalExportar = false;
  reporteSeleccionadoExportar: number | null = null;

  // Reporte expandido
  reporteExpandido: number | null = null;

  // Detalles de reportes expandidos (cacheo)
  reportesConDetalle: Map<number, ReporteCuentaCorriente> = new Map();

  // Formularios
  reporteForm: FormGroup;

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
    this.restaurarEstado();
    this.cargarProyectos();
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

  toggleItemAridoPagado(reporteId: number, tipoArido: string): void {
    // El valor de item.pagado ya fue cambiado por [(ngModel)]
    // Solo necesitamos guardar en el backend
    this.guardarItemsPagoEnBackend(reporteId);
  }

  toggleItemHoraPagado(reporteId: number, maquinaId: number): void {
    // El valor de item.pagado ya fue cambiado por [(ngModel)]
    // Solo necesitamos guardar en el backend
    this.guardarItemsPagoEnBackend(reporteId);
  }

  guardarItemsPagoEnBackend(reporteId: number): void {
    const reporte = this.getReporteConDetalle(reporteId);
    if (!reporte) return;

    // Calcular el nuevo estado basado en items pagados
    const aridosPagados = reporte.items_aridos?.filter(a => a.pagado).length || 0;
    const aridosTotales = reporte.items_aridos?.length || 0;
    const horasPagadas = reporte.items_horas?.filter(h => h.pagado).length || 0;
    const horasTotales = reporte.items_horas?.length || 0;

    const totalItems = aridosTotales + horasTotales;
    const itemsPagados = aridosPagados + horasPagadas;

    let nuevoEstado: EstadoPago;
    if (itemsPagados === 0) {
      nuevoEstado = EstadoPago.PENDIENTE;
    } else if (itemsPagados === totalItems) {
      nuevoEstado = EstadoPago.PAGADO;
    } else {
      nuevoEstado = EstadoPago.PARCIAL;
    }

    // Guardar estado previo para poder revertir en caso de error
    const estadoPrevio = reporte.estado;

    // Actualizar estado localmente
    reporte.estado = nuevoEstado;

    // SIEMPRE enviar al backend para persistir los checkboxes
    const itemsActualizados = {
      aridos: reporte.items_aridos?.map(a => ({ tipo_arido: a.tipo_arido, pagado: a.pagado })),
      horas: reporte.items_horas?.map(h => ({ maquina_id: h.maquina_id, pagado: h.pagado }))
    };

    this.cuentaCorrienteService.actualizarItemsPago(reporteId, itemsActualizados).subscribe({
      next: (reporteActualizado) => {
        console.log('Items de pago guardados exitosamente en backend:', reporteActualizado);
        // Actualizar el estado en la lista principal de reportes
        const index = this.reportes.findIndex(r => r.id === reporteId);
        if (index !== -1) {
          this.reportes[index].estado = reporteActualizado.estado;
        }
      },
      error: (error) => {
        console.error('Error al guardar items de pago:', error);
        // Revertir al estado previo
        reporte.estado = estadoPrevio;
        // Recargar el detalle del reporte desde el backend para revertir todos los cambios
        this.cargarDetalleReporte(reporteId);
        alert('Error al guardar el estado de pago. Los cambios no se guardaron. Por favor, intente nuevamente.');
      }
    });
  }

  actualizarEstadoReportePorItems(reporteId: number): void {
    // Método legacy mantenido para compatibilidad
    // Ahora delega todo a guardarItemsPagoEnBackend
    this.guardarItemsPagoEnBackend(reporteId);
  }

  marcarTodosItemsPagados(reporteId: number): void {
    const reporte = this.getReporteConDetalle(reporteId);
    if (!reporte) return;

    // Marcar todos los items como pagados
    reporte.items_aridos?.forEach(a => a.pagado = true);
    reporte.items_horas?.forEach(h => h.pagado = true);

    // Guardar en backend
    this.guardarItemsPagoEnBackend(reporteId);
  }

  marcarTodosItemsPendientes(reporteId: number): void {
    const reporte = this.getReporteConDetalle(reporteId);
    if (!reporte) return;

    // Marcar todos los items como pendientes
    reporte.items_aridos?.forEach(a => a.pagado = false);
    reporte.items_horas?.forEach(h => h.pagado = false);

    // Guardar en backend
    this.guardarItemsPagoEnBackend(reporteId);
  }
}
