import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  NgModel,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

interface Producto {
  id: number;
  nombre: string;
  codigo_producto: string;
  inventario: number;
}

interface MovimientoProducto {
  id: number;
  producto_id: number;
  usuario_id: number;
  cantidad: number;
  fecha: Date;
  tipo_transaccion: 'entrada' | 'salida';
  // Campos adicionales para mostrar en la UI
  nombre_producto?: string;
  codigo_producto?: string;
}

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

  constructor(private fb: FormBuilder) {
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
    // Cargar datos simulados para el desarrollo
    this.cargarDatosSimulados();

    // Configurar suscripción a cambios en el formulario de búsqueda
    this.busquedaForm.valueChanges.subscribe(() => {
      this.filtrarProductos();
    });

    // Asignar Math para poder usarlo en la plantilla
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

  agregarNuevoProducto(): void {
    if (this.productoForm.invalid) {
      // Marcar todos los campos como tocados para mostrar validaciones
      Object.keys(this.productoForm.controls).forEach((key) => {
        const control = this.productoForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const formValue = this.productoForm.value;

    // Crear nuevo producto
    const nuevoProducto: Producto = {
      id: this.obtenerSiguienteIdProducto(),
      nombre: formValue.nombre,
      codigo_producto: formValue.codigo_producto,
      inventario: formValue.inventario,
    };

    // Agregar a la lista de productos
    this.productos.unshift(nuevoProducto);

    // Actualizar lista filtrada
    this.filtrarProductos();

    // Si hay inventario inicial, registrar como entrada
    if (formValue.inventario > 0) {
      const movimientoInicial: MovimientoProducto = {
        id: this.movimientos.length + 1,
        producto_id: nuevoProducto.id,
        usuario_id: 1,
        cantidad: formValue.inventario,
        fecha: new Date(),
        tipo_transaccion: 'entrada',
        nombre_producto: nuevoProducto.nombre,
        codigo_producto: nuevoProducto.codigo_producto,
      };

      this.movimientos.unshift(movimientoInicial);
    }

    // Cerrar el modal y mostrar mensaje de éxito
    this.cerrarModalNuevoProducto();

    // Seleccionar el nuevo producto
    this.seleccionarProducto(nuevoProducto);

    alert(`Producto "${nuevoProducto.nombre}" agregado con éxito.`);
  }

  obtenerSiguienteIdProducto(): number {
    // Encontrar el ID más alto y sumar 1
    let maxId = 0;
    this.productos.forEach((producto) => {
      if (producto.id > maxId) {
        maxId = producto.id;
      }
    });
    return maxId + 1;
  }

  // Aquí irían todos los métodos existentes...
  cargarDatosSimulados(): void {
    // Productos de ejemplo
    this.productos = [
      {
        id: 1,
        nombre: 'Laptop Dell XPS 13',
        codigo_producto: 'LAP-001',
        inventario: 15,
      },
      {
        id: 2,
        nombre: 'Monitor Samsung 27"',
        codigo_producto: 'MON-002',
        inventario: 23,
      },
      {
        id: 3,
        nombre: 'Teclado Mecánico Logitech',
        codigo_producto: 'KEY-003',
        inventario: 42,
      },
      {
        id: 4,
        nombre: 'Mouse Inalámbrico HP',
        codigo_producto: 'MOU-004',
        inventario: 31,
      },
      {
        id: 5,
        nombre: 'Disco SSD 1TB Samsung',
        codigo_producto: 'SSD-005',
        inventario: 7,
      },
      {
        id: 6,
        nombre: 'Memoria RAM 16GB Kingston',
        codigo_producto: 'RAM-006',
        inventario: 19,
      },
      {
        id: 7,
        nombre: 'Tarjeta Gráfica NVIDIA RTX 3080',
        codigo_producto: 'GPU-007',
        inventario: 3,
      },
      {
        id: 8,
        nombre: 'Tablet iPad Pro',
        codigo_producto: 'TAB-008',
        inventario: 11,
      },
      {
        id: 9,
        nombre: 'Audífonos Sony WH-1000XM4',
        codigo_producto: 'AUD-009',
        inventario: 27,
      },
      {
        id: 10,
        nombre: 'Router WiFi 6 TP-Link',
        codigo_producto: 'NET-010',
        inventario: 14,
      },
    ];

    // Movimientos de ejemplo
    this.movimientos = [
      {
        id: 1,
        producto_id: 1,
        usuario_id: 1,
        cantidad: 5,
        fecha: new Date('2025-04-20'),
        tipo_transaccion: 'entrada',
        nombre_producto: 'Laptop Dell XPS 13',
        codigo_producto: 'LAP-001',
      },
      {
        id: 2,
        producto_id: 1,
        usuario_id: 2,
        cantidad: 2,
        fecha: new Date('2025-04-21'),
        tipo_transaccion: 'salida',
        nombre_producto: 'Laptop Dell XPS 13',
        codigo_producto: 'LAP-001',
      },
      {
        id: 3,
        producto_id: 2,
        usuario_id: 1,
        cantidad: 8,
        fecha: new Date('2025-04-18'),
        tipo_transaccion: 'entrada',
        nombre_producto: 'Monitor Samsung 27"',
        codigo_producto: 'MON-002',
      },
      {
        id: 4,
        producto_id: 3,
        usuario_id: 3,
        cantidad: 10,
        fecha: new Date('2025-04-19'),
        tipo_transaccion: 'entrada',
        nombre_producto: 'Teclado Mecánico Logitech',
        codigo_producto: 'KEY-003',
      },
      {
        id: 5,
        producto_id: 4,
        usuario_id: 2,
        cantidad: 3,
        fecha: new Date('2025-04-22'),
        tipo_transaccion: 'salida',
        nombre_producto: 'Mouse Inalámbrico HP',
        codigo_producto: 'MOU-004',
      },
    ];

    // Inicializar productos filtrados
    this.productosFiltrados = [...this.productos];
    this.totalItems = this.productos.length;
  }

  // Método para filtrar productos según término de búsqueda
  filtrarProductos(): void {
    const { termino, tipoFiltro } = this.busquedaForm.value;

    if (!termino.trim()) {
      this.productosFiltrados = [...this.productos];
    } else {
      const terminoLower = termino.toLowerCase();

      this.productosFiltrados = this.productos.filter((producto) => {
        switch (tipoFiltro) {
          case 'nombre':
            return producto.nombre.toLowerCase().includes(terminoLower);
          case 'codigo':
            return producto.codigo_producto
              .toLowerCase()
              .includes(terminoLower);
          case 'stock_bajo':
            return (
              producto.inventario < 10 &&
              (producto.nombre.toLowerCase().includes(terminoLower) ||
                producto.codigo_producto.toLowerCase().includes(terminoLower))
            );
          default: // 'todos'
            return (
              producto.nombre.toLowerCase().includes(terminoLower) ||
              producto.codigo_producto.toLowerCase().includes(terminoLower)
            );
        }
      });
    }

    this.totalItems = this.productosFiltrados.length;
    this.paginaActual = 1; // Resetear a primera página después de filtrar
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
  }

  // Método para registrar un movimiento (entrada o salida)
  registrarMovimiento(): void {
    if (this.movimientoForm.invalid || !this.productoSeleccionado) {
      return;
    }

    const formValue = this.movimientoForm.value;
    const nuevoMovimiento: MovimientoProducto = {
      id: this.movimientos.length + 1, // Temporal, el backend asignará el ID real
      producto_id: formValue.producto_id,
      usuario_id: 1, // Temporal, se obtendrá del usuario logueado
      cantidad: formValue.cantidad,
      fecha: new Date(),
      tipo_transaccion: formValue.tipo_transaccion,
      nombre_producto: this.productoSeleccionado.nombre,
      codigo_producto: this.productoSeleccionado.codigo_producto,
    };

    // Actualizar inventario local (simulación)
    const productoIndex = this.productos.findIndex(
      (p) => p.id === formValue.producto_id
    );
    if (productoIndex !== -1) {
      if (formValue.tipo_transaccion === 'entrada') {
        this.productos[productoIndex].inventario += formValue.cantidad;
      } else if (formValue.tipo_transaccion === 'salida') {
        // Validar que hay suficiente stock
        if (this.productos[productoIndex].inventario >= formValue.cantidad) {
          this.productos[productoIndex].inventario -= formValue.cantidad;
        } else {
          alert('No hay suficiente stock para realizar esta salida.');
          return;
        }
      }

      // Actualizar producto seleccionado para mostrar cambios inmediatos
      this.productoSeleccionado = { ...this.productos[productoIndex] };
    }

    // Agregar movimiento al historial
    this.movimientos.unshift(nuevoMovimiento);

    // Actualizar lista filtrada
    this.filtrarProductos();

    // Resetear formulario
    this.movimientoForm.patchValue({
      cantidad: 1,
    });

    // Mostrar mensaje de éxito
    alert(
      `${
        formValue.tipo_transaccion === 'entrada' ? 'Entrada' : 'Salida'
      } registrada con éxito.`
    );
  }

  // Método para obtener movimientos de un producto específico
  obtenerMovimientosProducto(productoId: number): MovimientoProducto[] {
    return this.movimientos
      .filter((m) => m.producto_id === productoId)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime()); // Ordenar por fecha descendente
  }

  // Métodos para paginación
  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
  }

  obtenerProductosPaginados(): Producto[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.productosFiltrados.slice(inicio, fin);
  }

  obtenerTotalPaginas(): number {
    return Math.ceil(this.totalItems / this.itemsPorPagina);
  }

  // Métodos auxiliares para formatear datos
  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
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
}
