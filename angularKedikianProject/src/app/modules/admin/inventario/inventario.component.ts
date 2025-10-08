import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { InventarioService, Producto, MovimientoProducto, FiltrosProducto, RespuestaPaginada } from '../../../core/services/inventario.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css'],
})
export class InventarioComponent implements OnInit {
  // Listas de datos
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  movimientos: MovimientoProducto[] = [];

  // Formularios
  movimientoForm: FormGroup;
  busquedaForm: FormGroup;
  productoForm: FormGroup;

  // Estado del componente
  productoSeleccionado: Producto | null = null;
  mostrarModalNuevoProducto = false;
  mostrarModalEditar = false;
  mostrarHistorial = false;
  mostrarConfirmacionEliminar = false;
  productoAEliminar: Producto | null = null;

  // Mensajes
  mensajeExito: string | null = null;

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  totalItems = 0;
  Math = Math;

  // Imagen
  imagenSeleccionada: File | null = null;

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    private authService: AuthService
  ) {
    // Formulario de movimientos
    this.movimientoForm = this.fb.group({
      producto_id: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      tipo_transaccion: ['entrada', Validators.required],
    });

    // Formulario de búsqueda
    this.busquedaForm = this.fb.group({
      termino: ['']
    });

    // Formulario para nuevo producto
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      codigo_producto: ['', [Validators.required, Validators.pattern('[A-Z]+-[0-9]{3}')]],
      inventario: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.cargarProductosBackend();
    this.busquedaForm.valueChanges.subscribe(() => {
      this.paginaActual = 1;
      this.cargarProductosBackend();
    });
  }

  // Cargar productos del backend
  cargarProductosBackend(): void {
    const filtros: FiltrosProducto = {
      termino: this.busquedaForm.value.termino,
      tipo_filtro: 'todos',
      pagina: this.paginaActual,
      limite: this.itemsPorPagina
    };

    this.inventarioService.obtenerProductos(filtros).subscribe({
      next: (resp: RespuestaPaginada<Producto>) => {
        this.productos = resp.data;
        this.productosFiltrados = [...this.productos];
        this.totalItems = resp.pagination ? resp.pagination.total : this.productos.length;
      },
      error: () => {
        this.productos = [];
        this.productosFiltrados = [];
        this.totalItems = 0;
      }
    });
  }

  // Modal nuevo producto
  abrirModalNuevoProducto(): void {
    this.mostrarModalNuevoProducto = true;
    this.productoForm.reset({ inventario: 0 });
    this.imagenSeleccionada = null;
  }

  cerrarModalNuevoProducto(): void {
    this.mostrarModalNuevoProducto = false;
    this.productoForm.reset();
    this.imagenSeleccionada = null;
  }

  // Modal editar producto
  abrirModalEditar(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.mostrarModalEditar = true;
    this.mostrarHistorial = false;
    this.movimientoForm.patchValue({
      producto_id: producto.id,
      cantidad: 1,
      tipo_transaccion: 'entrada'
    });
    this.cargarMovimientosProducto(producto.id);
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.productoSeleccionado = null;
    this.movimientoForm.reset({ tipo_transaccion: 'entrada', cantidad: 1 });
  }

  // Generar código automático
  generarCodigoProducto(): void {
    const nombreControl = this.productoForm.get('nombre');
    if (!nombreControl) return;
    
    const nombre = nombreControl.value?.trim();
    if (!nombre) return;

    const prefijo = nombre.split(' ')[0].substring(0, 3).toUpperCase();
    let maxNum = 0;

    this.productos.forEach((producto) => {
      if (producto.codigo_producto.startsWith(prefijo)) {
        const num = parseInt(producto.codigo_producto.split('-')[1]);
        if (num > maxNum) maxNum = num;
      }
    });

    const nuevoNumero = (maxNum + 1).toString().padStart(3, '0');
    this.productoForm.patchValue({ codigo_producto: `${prefijo}-${nuevoNumero}` });
  }

  // Seleccionar imagen
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
    }
  }

  // Agregar producto
  agregarNuevoProducto(): void {
    if (this.productoForm.invalid) {
      Object.keys(this.productoForm.controls).forEach((key) => {
        this.productoForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.productoForm.value;
    const formData = new FormData();
    formData.append('nombre', formValue.nombre);
    formData.append('codigo_producto', formValue.codigo_producto);
    formData.append('inventario', formValue.inventario.toString());

    if (this.imagenSeleccionada) {
      formData.append('imagen', this.imagenSeleccionada);
    }

    this.inventarioService.crearProducto(formData).subscribe({
      next: (resp: any) => {
        this.cerrarModalNuevoProducto();
        this.paginaActual = 1;
        this.cargarProductosBackend();
        this.mostrarMensajeExito(`Producto "${resp.nombre || resp.data?.nombre}" agregado con éxito.`);
      },
      error: (err) => {
        alert(err?.error?.message || 'Error al agregar el producto.');
      }
    });
  }

  // Eliminar producto
  eliminarProducto(producto: Producto, event: Event): void {
    event.stopPropagation();
    this.productoAEliminar = producto;
    this.mostrarConfirmacionEliminar = true;
  }

  confirmarEliminarProducto(): void {
    if (!this.productoAEliminar) return;

    this.inventarioService.eliminarProducto(this.productoAEliminar.id).subscribe({
      next: () => {
        this.mostrarMensajeExito('Producto eliminado correctamente.');
        this.cargarProductosBackend();
        this.mostrarConfirmacionEliminar = false;
        this.productoAEliminar = null;
      },
      error: () => {
        alert('Error al eliminar el producto.');
        this.mostrarConfirmacionEliminar = false;
        this.productoAEliminar = null;
      }
    });
  }

  cancelarEliminarProducto(): void {
    this.mostrarConfirmacionEliminar = false;
    this.productoAEliminar = null;
  }

  // Cargar movimientos de un producto
  cargarMovimientosProducto(productoId: number): void {
    this.inventarioService.obtenerMovimientosProducto(productoId).subscribe({
      next: (resp: RespuestaPaginada<MovimientoProducto>) => {
        this.movimientos = resp.data;
      },
      error: () => {
        this.movimientos = [];
      }
    });
  }

  // Registrar movimiento
  registrarMovimiento(): void {
    if (this.movimientoForm.invalid || !this.productoSeleccionado) return;

    const formValue = this.movimientoForm.value;
    const usuarioActual = this.authService.obtenerUsuarioActual();

    if (!usuarioActual || !usuarioActual.id) {
      alert('Error: No se pudo obtener el usuario autenticado.');
      return;
    }

    const nuevoMovimiento: any = {
      producto_id: formValue.producto_id,
      cantidad: formValue.cantidad,
      tipo_transaccion: formValue.tipo_transaccion,
      usuario_id: usuarioActual.id,
      fecha: new Date().toISOString()
    };

    this.inventarioService.registrarMovimiento(nuevoMovimiento).subscribe({
      next: () => {
        this.cargarProductosBackend();
        this.cargarMovimientosProducto(formValue.producto_id);
        this.movimientoForm.patchValue({ cantidad: 1 });
        this.mostrarMensajeExito('Movimiento registrado con éxito.');
      },
      error: () => {
        alert('Error al registrar el movimiento.');
      }
    });
  }

  // Obtener movimientos de un producto
  obtenerMovimientosProducto(productoId: number): MovimientoProducto[] {
    return this.movimientos.filter(m => m.producto_id === productoId);
  }

  // Paginación
  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.obtenerTotalPaginas()) return;
    this.paginaActual = pagina;
    this.cargarProductosBackend();
  }

  obtenerProductosPaginados(): Producto[] {
    return this.productosFiltrados;
  }

  obtenerTotalPaginas(): number {
    return Math.ceil(this.totalItems / this.itemsPorPagina);
  }

  // Formatear fecha
  formatearFecha(fecha: string | Date): string {
    const dateObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Exportar inventario
  exportarInventarioCSV(): void {
    let csv = 'ID,Código,Nombre,Stock\n';

    this.productos.forEach((producto) => {
      csv += `${producto.id},${producto.codigo_producto},"${producto.nombre}",${producto.inventario}\n`;
    });

    this.descargarCSV(csv, `inventario_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // Descargar CSV
  private descargarCSV(contenido: string, nombreArchivo: string): void {
    const blob = new Blob([contenido], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', nombreArchivo);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Mostrar mensaje de éxito
  private mostrarMensajeExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    setTimeout(() => this.mensajeExito = null, 3000);
  }
}