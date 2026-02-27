import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Cliente,
  ClienteOut,
  ServicioPredefinido,
  CotizacionOut,
  CotizacionCreate,
  CotizacionItemCreate,
  EstadoCotizacion
} from '../../../core/models/cotizacion.models';

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css'],
})
export class CotizacionesComponent implements OnInit {
  // Propiedades principales
  clientes: ClienteOut[] = [];
  serviciosPredefinidos: ServicioPredefinido[] = [];
  cotizaciones: CotizacionOut[] = [];

  // Formularios
  cotizacionForm!: FormGroup;
  nuevoClienteForm!: FormGroup;

  // Estados de carga
  cargandoClientes = false;
  cargandoServicios = false;
  cargandoCotizaciones = false;

  // Modales
  mostrarModalNuevoCliente = false;
  mostrarModalDetalleCotizacion = false;

  // Cotización expandida/seleccionada
  cotizacionExpandida: number | null = null;
  cotizacionDetalle: CotizacionOut | null = null;

  // Permisos
  esAdministrador = false;

  // Estados de cotización
  EstadoCotizacion = EstadoCotizacion;

  constructor(
    private cotizacionService: CotizacionService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    // Formulario principal de cotización
    this.cotizacionForm = this.fb.group({
      cliente_id: ['', Validators.required],
      fecha_validez: ['', Validators.required],
      observaciones: [''],
      items: this.fb.array([this.crearItemForm()]) // Inicializar con un item
    });

    // Formulario para nuevo cliente
    this.nuevoClienteForm = this.fb.group({
      nombre: ['', Validators.required],
      email: [''],
      telefono: [''],
      direccion: ['']
    });

    // Configurar fecha por defecto
    this.setFechaValidezPorDefecto();
  }

  ngOnInit(): void {
    this.verificarPermisos();

    // Cargar datos de forma asíncrona sin bloquear
    Promise.resolve().then(() => {
      this.cargarClientes();
      this.cargarServiciosPredefinidos();
      this.cargarCotizaciones();
    });
  }

  // ------------------------
  // Inicialización y permisos
  // ------------------------

  verificarPermisos(): void {
    const usuario = this.authService.obtenerUsuarioActual();
    this.esAdministrador = usuario ? usuario.roles.includes('administrador') : false;
  }

  setFechaValidezPorDefecto(): void {
    // Fecha de validez por defecto: 30 días desde hoy
    const hoy = new Date();
    const treintaDias = new Date(hoy.getTime() + (30 * 24 * 60 * 60 * 1000));
    const fechaFormato = treintaDias.toISOString().split('T')[0];
    this.cotizacionForm.patchValue({ fecha_validez: fechaFormato });
  }

  // ------------------------
  // Gestión de items del FormArray
  // ------------------------

  get items(): FormArray {
    const itemsControl = this.cotizacionForm?.get('items');
    if (!itemsControl) {
      // Retornar un FormArray vacío temporal si no existe
      return this.fb.array([]);
    }
    return itemsControl as FormArray;
  }

  crearItemForm(): FormGroup {
    return this.fb.group({
      nombre_servicio: ['', Validators.required],
      unidad: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]]
    });
  }

  agregarItem(): void {
    this.items.push(this.crearItemForm());
  }

  eliminarItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  /**
   * Cuando se selecciona un servicio predefinido, cargar precio y unidad
   */
  onServicioSeleccionado(index: number, nombreServicio: string): void {
    if (!this.items || !nombreServicio) {
      return;
    }

    const servicio = this.serviciosPredefinidos.find(s => s.nombre === nombreServicio);
    if (servicio && this.items.at(index)) {
      const itemForm = this.items.at(index) as FormGroup;

      // Usar setTimeout para evitar modificar durante change detection
      setTimeout(() => {
        itemForm.patchValue({
          unidad: servicio.unidad,
          precio_unitario: servicio.precio_por_defecto
        });
      }, 0);
    }
  }

  /**
   * Calcula el subtotal de un item específico
   */
  calcularSubtotal(index: number): number {
    if (!this.items || !this.items.at(index)) {
      return 0;
    }

    const item = this.items.at(index).value;
    return (item.cantidad || 0) * (item.precio_unitario || 0);
  }

  /**
   * Calcula el importe total de la cotización
   */
  calcularTotal(): number {
    if (!this.items) {
      return 0;
    }

    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      total += this.calcularSubtotal(i);
    }
    return total;
  }

  // ------------------------
  // Carga de datos
  // ------------------------

  cargarClientes(): void {
    this.cargandoClientes = true;
    this.cotizacionService.getClientes().subscribe({
      next: (data) => {
        console.log('🔍 DIAGNÓSTICO - Datos recibidos del backend:');
        console.log('Total de registros:', data.length);
        console.log('Datos completos:', JSON.stringify(data, null, 2));

        // Contar Claudio Peisina
        const claudios = data.filter(c => c.nombre.includes('Claudio Peisina'));
        console.log('❗ Claudio Peisina aparece:', claudios.length, 'veces');
        console.log('IDs de Claudio Peisina:', claudios.map(c => c.id));

        // Filtrar duplicados basándose en el ID del cliente
        const clientesUnicos = this.filtrarClientesDuplicados(data);
        this.clientes = clientesUnicos;
        this.cargandoClientes = false;

        console.log('✅ Clientes únicos (después de filtrar):', clientesUnicos.length);

        // Log para detectar duplicados
        if (data.length !== clientesUnicos.length) {
          console.warn('⚠️ Se encontraron clientes duplicados:', data.length - clientesUnicos.length);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar clientes:', error);
        this.cargandoClientes = false;
      }
    });
  }

  /**
   * Filtra clientes duplicados basándose en el ID
   */
  private filtrarClientesDuplicados(clientes: ClienteOut[]): ClienteOut[] {
    const clientesMap = new Map<number, ClienteOut>();

    clientes.forEach(cliente => {
      if (!clientesMap.has(cliente.id)) {
        clientesMap.set(cliente.id, cliente);
      }
    });

    return Array.from(clientesMap.values());
  }

  cargarServiciosPredefinidos(): void {
    this.cargandoServicios = true;
    this.cotizacionService.getServiciosPredefinidos().subscribe({
      next: (data) => {
        this.serviciosPredefinidos = data;
        this.cargandoServicios = false;
        console.log('Servicios predefinidos cargados:', data);
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        this.cargandoServicios = false;
      }
    });
  }

  cargarCotizaciones(): void {
    this.cargandoCotizaciones = true;
    this.cotizacionService.getCotizaciones().subscribe({
      next: (data) => {
        this.cotizaciones = data;
        this.cargandoCotizaciones = false;
        console.log('Cotizaciones cargadas:', data);
      },
      error: (error) => {
        console.error('Error al cargar cotizaciones:', error);
        this.cargandoCotizaciones = false;
      }
    });
  }

  // ------------------------
  // Gestión de clientes
  // ------------------------

  abrirModalNuevoCliente(): void {
    this.nuevoClienteForm.reset({
      nombre: '',
      email: '',
      telefono: '',
      direccion: ''
    });
    this.mostrarModalNuevoCliente = true;
  }

  cerrarModalNuevoCliente(): void {
    this.mostrarModalNuevoCliente = false;
  }

  crearCliente(): void {
    if (!this.nuevoClienteForm || !this.nuevoClienteForm.valid) {
      return;
    }

    const nuevoCliente: Cliente = this.nuevoClienteForm.value;
    this.cotizacionService.crearCliente(nuevoCliente).subscribe({
      next: (clienteCreado) => {
        console.log('Cliente creado:', clienteCreado);
        this.clientes.push(clienteCreado);

        // Usar setTimeout para evitar race condition con change detection
        setTimeout(() => {
          if (this.cotizacionForm) {
            this.cotizacionForm.patchValue({ cliente_id: clienteCreado.id });
          }
        }, 0);

        this.cerrarModalNuevoCliente();
        alert('Cliente creado exitosamente');
      },
      error: (error) => {
        console.error('Error al crear cliente:', error);
        alert('Error al crear cliente. Por favor, intente nuevamente.');
      }
    });
  }

  // ------------------------
  // Gestión de cotizaciones
  // ------------------------

  generarCotizacion(): void {
    if (!this.cotizacionForm || !this.cotizacionForm.valid) {
      alert('Por favor, complete todos los campos requeridos');
      return;
    }

    if (!this.items || this.items.length === 0) {
      alert('Debe agregar al menos un servicio o producto');
      return;
    }

    const formValue = this.cotizacionForm.value;

    const items: CotizacionItemCreate[] = formValue.items.map((item: any) => ({
      nombre_servicio: item.nombre_servicio,
      unidad: item.unidad,
      cantidad: parseFloat(item.cantidad),
      precio_unitario: parseFloat(item.precio_unitario)
    }));

    const nuevaCotizacion: CotizacionCreate = {
      cliente_id: formValue.cliente_id,
      fecha_validez: formValue.fecha_validez,
      observaciones: formValue.observaciones || '',
      items: items
    };

    this.cotizacionService.crearCotizacion(nuevaCotizacion).subscribe({
      next: (cotizacionCreada) => {
        console.log('Cotización creada:', cotizacionCreada);
        this.cotizaciones.unshift(cotizacionCreada);

        // Usar setTimeout para evitar race condition
        setTimeout(() => {
          this.resetearFormulario();
        }, 0);

        alert('Cotización generada exitosamente');
      },
      error: (error) => {
        console.error('Error al crear cotización:', error);
        alert('Error al generar cotización. Por favor, intente nuevamente.');
      }
    });
  }

  resetearFormulario(): void {
    if (!this.cotizacionForm) {
      return;
    }

    // Limpiar items de forma segura
    while (this.items && this.items.length > 0) {
      this.items.removeAt(0);
    }

    // Resetear el formulario con valores iniciales
    this.cotizacionForm.reset({
      cliente_id: '',
      fecha_validez: '',
      observaciones: ''
    });

    // Agregar item inicial y configurar fecha
    this.agregarItem();
    this.setFechaValidezPorDefecto();
  }

  expandirCotizacion(cotizacionId: number): void {
    if (this.cotizacionExpandida === cotizacionId) {
      this.cotizacionExpandida = null;
    } else {
      this.cotizacionExpandida = cotizacionId;
      // Cargar detalles si es necesario
      this.cotizacionService.getCotizacion(cotizacionId).subscribe({
        next: (data) => {
          console.log('Detalle de cotización:', data);
        },
        error: (error) => {
          console.error('Error al cargar detalle:', error);
        }
      });
    }
  }

  eliminarCotizacion(cotizacionId: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta cotización?')) {
      this.cotizacionService.eliminarCotizacion(cotizacionId).subscribe({
        next: () => {
          console.log('Cotización eliminada:', cotizacionId);
          this.cotizaciones = this.cotizaciones.filter(c => c.id !== cotizacionId);
          alert('Cotización eliminada exitosamente');
        },
        error: (error) => {
          console.error('Error al eliminar cotización:', error);
          alert('Error al eliminar cotización. Por favor, intente nuevamente.');
        }
      });
    }
  }

  cambiarEstado(cotizacionId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const nuevoEstado = select.value as EstadoCotizacion;

    this.cotizacionService.actualizarCotizacion(cotizacionId, { estado: nuevoEstado }).subscribe({
      next: (cotizacionActualizada) => {
        console.log('Estado actualizado:', cotizacionActualizada);
        // Actualizar la cotización en el array local
        const index = this.cotizaciones.findIndex(c => c.id === cotizacionId);
        if (index !== -1) {
          this.cotizaciones[index] = cotizacionActualizada;
        }
        alert('Estado actualizado exitosamente');
      },
      error: (error) => {
        console.error('Error al actualizar estado:', error);
        alert('Error al actualizar estado. Por favor, intente nuevamente.');
        // Revertir el select al valor anterior
        select.value = this.cotizaciones.find(c => c.id === cotizacionId)?.estado || '';
      }
    });
  }

  // ------------------------
  // Exportación
  // ------------------------

  exportarPDF(cotizacionId: number): void {
    this.cotizacionService.exportarPDF(cotizacionId).subscribe({
      next: (blob) => {
        const cotizacion = this.cotizaciones.find(c => c.id === cotizacionId);
        const nombreCliente = cotizacion?.cliente?.nombre || 'Cliente';
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Cotizacion_${nombreCliente}_${fecha}.pdf`;
        this.cotizacionService.descargarArchivo(blob, nombreArchivo);
        console.log('PDF descargado:', nombreArchivo);
      },
      error: (error) => {
        console.error('Error al exportar PDF:', error);
        alert('Error al generar PDF. Por favor, intente nuevamente.');
      }
    });
  }

  exportarExcel(cotizacionId: number): void {
    this.cotizacionService.exportarExcel(cotizacionId).subscribe({
      next: (blob) => {
        const cotizacion = this.cotizaciones.find(c => c.id === cotizacionId);
        const nombreCliente = cotizacion?.cliente?.nombre || 'Cliente';
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Cotizacion_${nombreCliente}_${fecha}.xlsx`;
        this.cotizacionService.descargarArchivo(blob, nombreArchivo);
        console.log('Excel descargado:', nombreArchivo);
      },
      error: (error) => {
        console.error('Error al exportar Excel:', error);
        alert('Error al generar Excel. Por favor, intente nuevamente.');
      }
    });
  }

  // ------------------------
  // Utilidades
  // ------------------------

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  obtenerClaseEstado(estado: EstadoCotizacion): string {
    switch (estado) {
      case EstadoCotizacion.BORRADOR:
        return 'estado-borrador';
      case EstadoCotizacion.ENVIADA:
        return 'estado-enviada';
      case EstadoCotizacion.APROBADA:
        return 'estado-aprobada';
      default:
        return '';
    }
  }

  obtenerTextoEstado(estado: EstadoCotizacion): string {
    switch (estado) {
      case EstadoCotizacion.BORRADOR:
        return 'Borrador';
      case EstadoCotizacion.ENVIADA:
        return 'Enviada';
      case EstadoCotizacion.APROBADA:
        return 'Aprobada';
      default:
        return estado;
    }
  }

  obtenerIconoEstado(estado: EstadoCotizacion): string {
    switch (estado) {
      case EstadoCotizacion.BORRADOR:
        return 'fas fa-file-alt';
      case EstadoCotizacion.ENVIADA:
        return 'fas fa-paper-plane';
      case EstadoCotizacion.APROBADA:
        return 'fas fa-check-circle';
      default:
        return 'fas fa-file';
    }
  }

  // TrackBy para optimizar ngFor
  trackByIndex(index: number): number {
    return index;
  }

  trackByClienteId(_index: number, cliente: ClienteOut): number {
    return cliente.id;
  }
}
