import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  NgModel,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { InventarioService, Producto, MovimientoProducto, NuevoProducto, NuevoMovimiento, FiltrosProducto, RespuestaPaginada, RespuestaAPI } from '../../../core/services/inventario.service';

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
  productoForm: FormGroup; // Nuevo formulario para agregar productos

  // Estado del componente
  productoSeleccionado: Producto | null = null;
  modoVisualizacion: 'tabla' | 'tarjetas' = 'tabla';
  cargando = false;
  mostrarHistorial = false;
  mostrarModalNuevoProducto = false; // Controla la visibilidad del modal

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  totalItems = 0;
  Math: any;

  imagenSeleccionada: File | null = null;

  constructor(private fb: FormBuilder, private inventarioService: InventarioService) {
    // Inicializar formulario de movimientos
    this.movimientoForm = this.fb.group({
      producto_id: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      tipo_transaccion: ['entrada', Validators.required],
    });

    // Inicializar formulario de búsqueda
    this.busquedaForm = this.fb.group({
      termino: [''],
      tipoFiltro: ['todos'],
    });

    // Inicializar formulario para nuevo producto
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      codigo_producto: [
        '',
        [Validators.required, Validators.pattern('[A-Z]+-[0-9]{3}')],
      ],
      inventario: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.cargarProductosBackend();
    this.busquedaForm.valueChanges.subscribe(() => {
      this.filtrarProductos();
    });
    this.Math = Math;
  }

  // Métodos para el nuevo producto
  abrirModalNuevoProducto(): void {
    this.mostrarModalNuevoProducto = true;
    this.productoForm.reset({ inventario: 0 });
  }

  cerrarModalNuevoProducto(): void {
    this.mostrarModalNuevoProducto = false;
  }

  generarCodigoProducto(): void {
    // Genera un código de producto basado en el nombre
    if (this.productoForm.get('nombre')?.value) {
      const nombre = this.productoForm.get('nombre')?.value.trim();
      if (nombre) {
        // Tomar las primeras letras y convertirlas a mayúsculas
        const prefijo = nombre.split(' ')[0].substring(0, 3).toUpperCase();

        // Encontrar el último número usado para este prefijo
        let maxNum = 0;
        this.productos.forEach((producto) => {
          if (producto.codigo_producto.startsWith(prefijo)) {
            const num = parseInt(producto.codigo_producto.split('-')[1]);
            if (num > maxNum) maxNum = num;
          }
        });

        // Formatear el nuevo código
        const nuevoNumero = (maxNum + 1).toString().padStart(3, '0');
        const codigo = `${prefijo}-${nuevoNumero}`;

        this.productoForm.patchValue({ codigo_producto: codigo });
      }
    }
  }

  cargarProductosBackend(): void {
    this.cargando = true;
    const filtros: FiltrosProducto = {
      termino: this.busquedaForm.value.termino,
      tipo_filtro: this.busquedaForm.value.tipoFiltro,
      pagina: this.paginaActual,
      limite: this.itemsPorPagina
    };
    this.inventarioService.obtenerProductos(filtros).subscribe({
      next: (resp: RespuestaPaginada<Producto>) => {
        this.productos = resp.data;
        this.productosFiltrados = [...this.productos];
        this.totalItems = resp.pagination.total;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.productos = [];
        this.productosFiltrados = [];
        this.totalItems = 0;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
    }
  }

  agregarNuevoProducto(): void {
    if (this.productoForm.invalid) {
      Object.keys(this.productoForm.controls).forEach((key) => {
        const control = this.productoForm.get(key);
        control?.markAsTouched();
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
      next: (resp: RespuestaAPI<Producto>) => {
        console.log('Respuesta del backend al crear producto:', resp);
        if (resp && resp.data && resp.data.nombre) {
          this.cerrarModalNuevoProducto();
          this.cargarProductosBackend();
          alert(`Producto "${resp.data.nombre}" agregado con éxito.`);
        } else {
          alert('Producto creado, pero la respuesta del servidor no es válida.');
        }
        this.imagenSeleccionada = null;
      },
      error: (err) => {
        let msg = 'Error al agregar el producto.';
        if (err && err.error && err.error.message) {
          msg += `\n${err.error.message}`;
        }
        alert(msg);
        this.imagenSeleccionada = null;
      }
    });
  }

  filtrarProductos(): void {
    this.cargarProductosBackend();
  }

  // Método para cambiar entre vista de tabla y tarjetas
  cambiarModoVisualizacion(modo: 'tabla' | 'tarjetas'): void {
    this.modoVisualizacion = modo;
  }

  // Método para seleccionar un producto
  seleccionarProducto(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.movimientoForm.patchValue({
      producto_id: producto.id,
    });
    this.cargarMovimientosProducto(producto.id);
  }

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

  registrarMovimiento(): void {
    if (this.movimientoForm.invalid || !this.productoSeleccionado) {
      return;
    }
    const formValue = this.movimientoForm.value;
    const nuevoMovimiento: NuevoMovimiento = {
      producto_id: formValue.producto_id,
      cantidad: formValue.cantidad,
      tipo_transaccion: formValue.tipo_transaccion,
    };
    this.inventarioService.registrarMovimiento(nuevoMovimiento).subscribe({
      next: () => {
        this.cargarProductosBackend();
        this.cargarMovimientosProducto(formValue.producto_id);
        this.movimientoForm.patchValue({ cantidad: 1 });
        alert(`Movimiento registrado con éxito.`);
      },
      error: () => {
        alert('Error al registrar el movimiento.');
      }
    });
  }

  // Métodos para paginación
  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.cargarProductosBackend();
  }

  obtenerProductosPaginados(): Producto[] {
    return this.productosFiltrados;
  }

  obtenerTotalPaginas(): number {
    return Math.ceil(this.totalItems / this.itemsPorPagina);
  }

  // Métodos auxiliares para formatear datos
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

  // Método para exportar el inventario actual a CSV
  exportarInventarioCSV(): void {
    // Crear encabezados
    let csv = 'ID,Código,Nombre,Stock\n';

    // Agregar datos
    this.productos.forEach((producto) => {
      csv += `${producto.id},${producto.codigo_producto},"${producto.nombre}",${producto.inventario}\n`;
    });

    // Crear blob y descargar
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute(
      'download',
      `inventario_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Método para exportar movimientos a CSV
  exportarMovimientosCSV(): void {
    // Crear encabezados
    let csv = 'ID,Producto,Código,Cantidad,Tipo,Fecha\n';

    // Agregar datos
    this.movimientos.forEach((mov) => {
      csv += `${mov.id},"${mov.nombre_producto}",${mov.codigo_producto},${
        mov.cantidad
      },${mov.tipo_transaccion},"${this.formatearFecha(mov.fecha)}"\n`;
    });

    // Crear blob y descargar
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute(
      'download',
      `movimientos_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Método para cerrar el formulario de movimiento
  cerrarFormularioMovimiento(): void {
    this.productoSeleccionado = null;
    this.movimientoForm.reset({
      tipo_transaccion: 'entrada',
      cantidad: 1,
    });
  }

  obtenerMovimientosProducto(productoId: number): MovimientoProducto[] {
    return this.movimientos.filter(m => m.producto_id === productoId);
  }
}
