// maquinaria.component.ts - ACTUALIZADO
import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ProjectService, Project } from '../../../core/services/project.service';
import {
  MachinesService,
  Maquina,
} from '../../../core/services/machines.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MantenimientosService, Mantenimiento } from '../../../core/services/mantenimientos.service';

// Interface para el historial de horas
interface HistorialHoras {
  id: number;
  maquina_id: number;
  proyecto_id: number;
  horas_trabajadas: number;
  fecha: string;
  created_at?: string;
  // Campos calculados para mostrar
  nombre_proyecto?: string;
  codigo_maquina?: string;
}

// Interface para registrar horas en proyecto
interface RegistroHoras {
  maquina_id: number;
  proyecto_id: number;
  horas_trabajadas: number;
  fecha: string;
}

@Component({
  selector: 'app-maquinaria',
  imports: [CommonModule, NgClass, FormsModule, ReactiveFormsModule],
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.css'],
})
export class MaquinariaComponent implements OnInit {
  // Datos de máquinas
  maquinas: Maquina[] = [];
  maquinasFiltradas: Maquina[] = [];
  proyectos: Project[] = [];

  // Variables para filtrado
  terminoBusqueda: string = '';
  mostrarSoloActivas: boolean = false;

  // Variables para modal
  modalVisible: boolean = false;
  modoEdicion: boolean = false;
  maquinaEditando: Maquina | null = null;

  // Variable para el modal de confirmación de eliminación
  modalConfirmacionVisible: boolean = false;
  maquinaAEliminar: number | null = null;

  // Formulario
  maquinaForm: FormGroup;
  mantenimientoForm: FormGroup;
  horasForm: FormGroup;
  modalHorasVisible: boolean = false;

  // Variables para historial de horas
  modalHistorialHorasVisible: boolean = false;
  historialHoras: HistorialHoras[] = [];
  historialHorasFiltrado: HistorialHoras[] = [];
  totalHorasHistorial: number = 0;
  proyectosFiltroHistorial: { id: number, nombre: string }[] = [];
  filtroProyectoHistorial: number | null = null;
  fechaInicioFiltro: string = '';
  fechaFinFiltro: string = '';

  constructor(
    private fb: FormBuilder,
    private machinesService: MachinesService,
    private projectService: ProjectService,
    private mantenimientosService: MantenimientosService
  ) {
    this.maquinaForm = this.fb.group({
      nombre: ['', [Validators.required]],
      estado: [true],
      horas_uso: [0, [Validators.required, Validators.min(0)]],
      proyecto_id: [null], // Usar proyecto_id
    });

    this.mantenimientoForm = this.fb.group({
      fecha: [new Date().toISOString().split('T')[0], [Validators.required]],
      tipo: ['preventivo', [Validators.required]],
      descripcion: ['', [Validators.required, Validators.minLength(3)]],
    });

    this.horasForm = this.fb.group({
      proyecto_id: [null, [Validators.required]],
      horas: [null, [Validators.required, Validators.min(0.1), Validators.pattern(/^\d*\.?\d+$/)]],
      fecha: [new Date().toISOString().split('T')[0], [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      maquinas: this.machinesService.obtenerMaquinas(),
      proyectos: this.projectService.getProjects(),
      mantenimientos: this.mantenimientosService.listarTodos()
    }).subscribe(({ maquinas, proyectos, mantenimientos }) => {
      this.maquinas = maquinas;
      this.proyectos = proyectos;
      
      // Procesar el historial de mantenimientos para cada máquina
      this.procesarHistorialMantenimientos(mantenimientos);
      
      this.filtrarMaquinas();
    });
  }

  // Procesar el historial de mantenimientos para calcular el último mantenimiento de cada máquina
  procesarHistorialMantenimientos(mantenimientos: Mantenimiento[]): void {
    // Limpiar datos anteriores
    this.ultimaHoraMantenimientoPorMaquina = {};
    this.historialPorMaquina = {};
    
    // Agrupar mantenimientos por máquina
    mantenimientos.forEach(mantenimiento => {
      const maquinaId = mantenimiento.maquina_id;
      
      if (!this.historialPorMaquina[maquinaId]) {
        this.historialPorMaquina[maquinaId] = [];
      }
      
      this.historialPorMaquina[maquinaId].push(mantenimiento);
    });
    
    // Calcular el último mantenimiento para cada máquina
    Object.keys(this.historialPorMaquina).forEach(maquinaIdStr => {
      const maquinaId = Number(maquinaIdStr);
      const historial = this.historialPorMaquina[maquinaId];
      
      if (historial && historial.length > 0) {
        const ultimoMantenimiento = this.obtenerUltimoMantenimiento(maquinaId, historial);
        if (ultimoMantenimiento && typeof ultimoMantenimiento.horas_maquina === 'number') {
          this.ultimaHoraMantenimientoPorMaquina[maquinaId] = ultimoMantenimiento.horas_maquina;
        }
      }
    });
  }

  // Filtrar máquinas según búsqueda y estado
  filtrarMaquinas(): void {
    let resultado = [...this.maquinas];

    // Filtrar por término de búsqueda
    if (this.terminoBusqueda && this.terminoBusqueda.trim() !== '') {
      const busqueda = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(
        (maquina) =>
          maquina.nombre.toLowerCase().includes(busqueda) ||
          maquina.codigo.toString().includes(busqueda)
      );
    }

    // Filtrar por estado activo si la opción está seleccionada
    if (this.mostrarSoloActivas) {
      resultado = resultado.filter((maquina) => maquina.estado);
    }

    this.maquinasFiltradas = resultado;
  }

  // Abrir modal para agregar nueva máquina
  abrirModalAgregar(): void {
    this.modoEdicion = false;
    this.maquinaEditando = null;
    this.maquinaForm.reset({
      nombre: '',
      estado: true,
      horas_uso: 0,
      proyecto_id: null,
    });
    this.modalVisible = true;
  }

  // Abrir modal para editar máquina existente
  abrirModalEditar(maquina: Maquina): void {
    this.modoEdicion = true;
    this.maquinaEditando = maquina;
    this.maquinaForm.setValue({
      nombre: maquina.nombre,
      estado: maquina.estado,
      horas_uso: maquina.horas_uso,
      proyecto_id: (maquina as any).proyecto_id || null,
    });
    this.modalVisible = true;
  }

  // Cerrar modal
  cerrarModal(): void {
    this.modalVisible = false;
  }

  // Guardar máquina (crear nueva o actualizar existente)
  guardarMaquina(): void {
    if (this.maquinaForm.invalid) {
      this.maquinaForm.markAllAsTouched();
      return;
    }

    const formData = this.maquinaForm.value;

    if (this.modoEdicion && this.maquinaEditando) {
      this.machinesService.actualizarMaquina({
        id: this.maquinaEditando.id,
        codigo: this.maquinaEditando.codigo,
        nombre: formData.nombre,
        estado: formData.estado,
        horas_uso: formData.horas_uso,
        proyecto_id: formData.proyecto_id || null,
      }).subscribe({
        next: () => {
          this.loadData();
          this.mostrarMensaje('Máquina actualizada correctamente');
          this.cerrarModal();
        },
        error: () => {
          this.mostrarMensaje('Error al actualizar la máquina');
        }
      });
    } else {
      const nuevoCodigo = this.generarNuevoCodigo();
      this.machinesService.crearMaquina({
        codigo: nuevoCodigo.toString(),
        nombre: formData.nombre,
        estado: formData.estado,
        horas_uso: formData.horas_uso,
        proyecto_id: formData.proyecto_id || null,
      } as any).subscribe({
        next: (maquinaCreada) => {
          this.loadData();
          this.mostrarMensaje('Máquina agregada correctamente');
          this.cerrarModal();
        },
        error: () => {
          this.mostrarMensaje('Error al agregar la máquina');
        }
      });
    }
  }

  // Generar un nuevo código para la máquina
  generarNuevoCodigo(): number {
    return this.maquinas.length > 0
      ? Math.max(...this.maquinas.map((m) => Number(m.codigo))) + 1
      : 1;
  }

  // Mostrar confirmación antes de eliminar máquina
  eliminarMaquina(id: number): void {
    this.maquinaAEliminar = id;
    this.modalConfirmacionVisible = true;
  }

  // Confirmar eliminación de máquina
  confirmarEliminarMaquina(): void {
    if (this.maquinaAEliminar !== null) {
      this.machinesService.eliminarMaquina(this.maquinaAEliminar).subscribe({
        next: () => {
          this.loadData();
          this.mostrarMensaje('Máquina eliminada correctamente');
          this.cancelarEliminarMaquina();
        },
        error: () => {
          this.mostrarMensaje('Error al eliminar la máquina');
          this.cancelarEliminarMaquina();
        }
      });
    }
  }

  // Cancelar eliminación de máquina
  cancelarEliminarMaquina(): void {
    this.modalConfirmacionVisible = false;
    this.maquinaAEliminar = null;
  }

  // Mostrar mensaje al usuario
  mostrarMensaje(mensaje: string): void {
    // Implementación simple de notificación sin dependencias externas
    const notificacion = document.createElement('div');
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #333;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notificacion);

    // Eliminar después de 3 segundos
    setTimeout(() => {
      document.body.removeChild(notificacion);
    }, 3000);
  }

  // En la tabla, para mostrar el nombre del proyecto, puedes usar una función auxiliar:
  getNombreProyecto(proyecto_id: number | null): string {
    if (!proyecto_id) return 'Sin proyecto asignado';
    const proyecto = this.proyectos.find(p => Number(p.id) === Number(proyecto_id));
    return proyecto ? proyecto.nombre : 'Proyecto no encontrado';
  }

  // ---------- Mantenimiento ----------
  ultimaHoraMantenimientoPorMaquina: Record<number, number> = {};
  historialPorMaquina: Record<number, Mantenimiento[]> = {};
  modalMantVisible: boolean = false;
  modalHistorialVisible: boolean = false;
  maquinaSeleccionada: Maquina | null = null;

  private obtenerUltimoMantenimiento(maquinaId: number, registros: Mantenimiento[]): Mantenimiento | null {
    if (!registros || registros.length === 0) return null;
    
    // Filtrar registros que tengan horas_maquina válidas
    const registrosConHoras = registros.filter(r => r.horas_maquina !== null && r.horas_maquina !== undefined);
    
    if (registrosConHoras.length === 0) return null;
    
    // Ordenar por horas de máquina (de mayor a menor) para obtener el más reciente
    const ordenados = [...registrosConHoras].sort((a, b) => (b.horas_maquina || 0) - (a.horas_maquina || 0));
    return ordenados[0];
  }

  getMantenimientoClass(maquina: Maquina): string {
    const ultima = this.ultimaHoraMantenimientoPorMaquina[maquina.id];
    const horasUso = maquina.horas_uso || 0;
    const horasBase = typeof ultima === 'number' ? horasUso - ultima : horasUso;
    if (horasBase >= 225) return 'mant-red';
    if (horasBase >= 200) return 'mant-yellow';
    return 'mant-green';
  }

  getMantenimientoTexto(maquina: Maquina): string {
    const ultima = this.ultimaHoraMantenimientoPorMaquina[maquina.id];
    const horasUso = maquina.horas_uso || 0;
    const horasDesde = typeof ultima === 'number' ? Math.max(0, horasUso - ultima) : horasUso;
    const restante = Math.max(0, 250 - horasDesde);
    const labelUltimo = typeof ultima === 'number' ? ` | Último: ${ultima} hs` : ' | Sin registro';
    
    if (typeof ultima !== 'number') {
      return `${horasUso} hs sin mant. (${restante} restantes)${labelUltimo}`;
    }
    
    return `${horasDesde} hs desde mant. (${restante} restantes)${labelUltimo}`;
  }

  formatearFecha(fechaISO: string): string {
    if (!fechaISO) return '-';
    
    try {
      const fecha = new Date(fechaISO);
      const opciones: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      };
      
      return fecha.toLocaleDateString('es-AR', opciones);
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return fechaISO;
    }
  }

  abrirModalRegistrarMantenimiento(maquina: Maquina): void {
    this.maquinaSeleccionada = maquina;
    this.mantenimientoForm.reset({
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'preventivo',
      descripcion: `Mantenimiento preventivo a ${maquina.horas_uso} hs`,
    });
    this.modalMantVisible = true;
  }

  cerrarModalMantenimiento(): void {
    this.modalMantVisible = false;
    this.maquinaSeleccionada = null;
  }

  confirmarRegistrarMantenimiento(): void {
    if (!this.maquinaSeleccionada || this.mantenimientoForm.invalid) {
      this.mantenimientoForm.markAllAsTouched();
      return;
    }
    const maquina = this.maquinaSeleccionada;
    const horasActuales = maquina.horas_uso || 0;
    const { fecha, tipo, descripcion } = this.mantenimientoForm.value;
    
    const fechaISO = new Date(fecha).toISOString();
    
    const mantenimientoData = {
      maquina_id: Number(maquina.id),
      tipo_mantenimiento: String(tipo),
      fecha_mantenimiento: String(fechaISO),
      descripcion: String(descripcion),
      horas_maquina: Number(horasActuales),
    };
    
    this.mantenimientosService.crear(mantenimientoData).subscribe({
      next: () => {
        this.ultimaHoraMantenimientoPorMaquina[maquina.id] = Number(horasActuales);
        this.mostrarMensaje('Mantenimiento registrado');
        this.cerrarModalMantenimiento();
        this.loadData();
      },
      error: (error) => {
        console.error('❌ Error al registrar mantenimiento:', error);
        this.mostrarMensaje('Error al registrar mantenimiento');
      },
    });
  }

  abrirModalHistorial(maquina: Maquina): void {
    this.maquinaSeleccionada = maquina;
    this.mantenimientosService.listarPorMaquina(maquina.id).subscribe({
      next: (lista) => {
        this.historialPorMaquina[maquina.id] = lista;
        const ultimo = this.obtenerUltimoMantenimiento(maquina.id, lista);
        if (ultimo && typeof ultimo.horas_maquina === 'number') {
          this.ultimaHoraMantenimientoPorMaquina[maquina.id] = ultimo.horas_maquina;
        }
        this.modalHistorialVisible = true;
      },
      error: () => this.mostrarMensaje('Error al obtener historial'),
    });
  }

  cerrarModalHistorial(): void {
    this.modalHistorialVisible = false;
    this.maquinaSeleccionada = null;
  }

  eliminarMantenimiento(mantenimientoId: number): void {
    if (confirm('¿Está seguro que desea eliminar este mantenimiento?')) {
      this.mantenimientosService.eliminar(mantenimientoId).subscribe({
        next: () => {
          this.mostrarMensaje('Mantenimiento eliminado correctamente');
          if (this.maquinaSeleccionada) {
            this.abrirModalHistorial(this.maquinaSeleccionada);
          }
          this.loadData();
        },
        error: () => {
          this.mostrarMensaje('Error al eliminar el mantenimiento');
        }
      });
    }
  }

  // ========== MÉTODOS PARA HISTORIAL DE HORAS ==========
  
  // Abrir modal para ver historial de horas de una máquina
abrirModalHistorialHoras(maquina: Maquina) {
  this.maquinaSeleccionada = maquina;
  this.machinesService.obtenerHistorialHoras(maquina.id).subscribe({
    next: (data) => {
      console.log('Datos recibidos del servicio:', data); // Para debugging
      
      // Procesar los datos del historial
      this.historialHoras = this.procesarHistorialHoras(data);
      this.historialHorasFiltrado = [...this.historialHoras];
      
      // Obtener proyectos únicos para filtros
      this.obtenerProyectosDelHistorial();
      
      // Calcular total de horas
      this.calcularTotalHoras();
      
      // Mostrar el modal
      this.modalHistorialHorasVisible = true;
    },
    error: (err) => {
      console.error("Error cargando historial de horas:", err);
      this.historialHoras = [];
      this.historialHorasFiltrado = [];
      this.modalHistorialHorasVisible = true;
    }
  });
}


  // Cargar historial de horas desde el servicio
  cargarHistorialHoras(maquinaId: number): void {
    // Aquí deberías llamar a tu servicio para obtener el historial
    this.machinesService.obtenerHistorialHoras(maquinaId).subscribe({
      next: (historial: HistorialHoras[]) => {
        this.historialHoras = this.procesarHistorialHoras(historial);
        this.historialHorasFiltrado = [...this.historialHoras];
        this.obtenerProyectosDelHistorial();
        this.calcularTotalHoras();
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.mostrarMensaje('Error al cargar el historial de horas');
      }
    });
  }

  // Procesar el historial para agregar información adicional
  procesarHistorialHoras(historial: HistorialHoras[]): HistorialHoras[] {
  return historial.map(registro => ({
    ...registro,
    nombre_proyecto: this.getNombreProyecto(registro.proyecto_id),
    codigo_maquina: this.maquinaSeleccionada?.codigo || 'N/A'
  }));
}

  // Aplicar filtros al historial
  aplicarFiltrosHistorial(): void {
    let resultado = [...this.historialHoras];

    // Filtro por proyecto
    if (this.filtroProyectoHistorial) {
      resultado = resultado.filter(h => h.proyecto_id === this.filtroProyectoHistorial);
    }

    // Filtro por fecha de inicio
    if (this.fechaInicioFiltro) {
      resultado = resultado.filter(h => h.fecha >= this.fechaInicioFiltro);
    }

    // Filtro por fecha de fin
    if (this.fechaFinFiltro) {
      resultado = resultado.filter(h => h.fecha <= this.fechaFinFiltro);
    }

    // Ordenar por fecha descendente (más reciente primero)
    resultado.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    this.historialHorasFiltrado = resultado;
    this.calcularTotalHoras();
  }

  // Calcular total de horas del historial filtrado
  calcularTotalHoras(): void {
    this.totalHorasHistorial = this.historialHorasFiltrado.reduce(
      (total, registro) => total + registro.horas_trabajadas, 
      0
    );
  }

  // Obtener lista única de proyectos del historial
  obtenerProyectosDelHistorial(): void {
    const proyectosUnicos = new Set(this.historialHoras.map(h => h.proyecto_id));
    this.proyectosFiltroHistorial = Array.from(proyectosUnicos)
      .map(id => ({
        id,
        nombre: this.getNombreProyecto(id)
      }))
      .filter(p => p.nombre !== 'Proyecto no encontrado');
  }

  // Limpiar filtros del historial
  limpiarFiltrosHistorial(): void {
    this.filtroProyectoHistorial = null;
    this.fechaInicioFiltro = '';
    this.fechaFinFiltro = '';
    this.aplicarFiltrosHistorial();
  }

  // Cerrar modal de historial de horas
  cerrarModalHistorialHoras(): void {
    this.modalHistorialHorasVisible = false;
    this.maquinaSeleccionada = null;
    this.historialHoras = [];
    this.historialHorasFiltrado = [];
    this.limpiarFiltrosHistorial();
  }

  // Exportar historial a CSV (opcional)
  exportarHistorialCSV(): void {
    if (this.historialHorasFiltrado.length === 0) {
      this.mostrarMensaje('No hay datos para exportar');
      return;
    }

    const headers = ['Fecha', 'Proyecto', 'Horas Trabajadas'];
    const csvContent = [
      headers.join(','),
      ...this.historialHorasFiltrado.map(h => 
        `${this.formatearFecha(h.fecha)},${h.nombre_proyecto},${h.horas_trabajadas}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historial-horas-${this.maquinaSeleccionada?.codigo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Métodos existentes para el manejo de horas en proyectos
  abrirModalAgregarHoras(maquina: Maquina): void {
    this.maquinaSeleccionada = maquina;
    this.horasForm.reset({
      proyecto_id: null,
      horas: 0,
      fecha: new Date().toISOString().split('T')[0]
    });
    this.modalHorasVisible = true;
  }

  cerrarModalHoras(): void {
    this.modalHorasVisible = false;
    this.maquinaSeleccionada = null;
    this.horasForm.reset();
  }

  confirmarAgregarHoras(): void {
    if (!this.maquinaSeleccionada || this.horasForm.invalid) {
      this.horasForm.markAllAsTouched();
      this.mostrarMensaje('Por favor complete todos los campos correctamente');
      return;
    }

    const formData = this.horasForm.value;
    const horasData: RegistroHoras = {
      maquina_id: Number(this.maquinaSeleccionada.id),
      proyecto_id: Number(formData.proyecto_id),
      horas_trabajadas: Number(formData.horas),
      fecha: formData.fecha,
    };

    // Validaciones
    if (isNaN(horasData.maquina_id) || isNaN(horasData.proyecto_id) || isNaN(horasData.horas_trabajadas)) {
      this.mostrarMensaje('Error: Datos inválidos');
      return;
    }

    if (horasData.horas_trabajadas <= 0) {
      this.mostrarMensaje('Las horas trabajadas deben ser mayores a 0');
      return;
    }

    this.machinesService.registrarHorasEnProyecto(horasData).subscribe({
      next: () => {
        // Actualizar las horas totales de la máquina
        if (this.maquinaSeleccionada) {
          this.maquinaSeleccionada.horas_uso = (this.maquinaSeleccionada.horas_uso || 0) + horasData.horas_trabajadas;
          const index = this.maquinas.findIndex(m => m.id === this.maquinaSeleccionada!.id);
          if (index !== -1) {
            this.maquinas[index] = { ...this.maquinaSeleccionada };
            this.filtrarMaquinas();
          }
          if (this.modalHistorialHorasVisible) {
            this.cargarHistorialHoras(this.maquinaSeleccionada.id);
          }
        }
        this.mostrarMensaje('Horas registradas correctamente');
        this.cerrarModalHoras();
        this.loadData();
      },
      error: (error: any) => {
        console.error('Error al registrar horas:', error);
        let mensajeError = 'Error al registrar las horas';
        if (error.status) {
          mensajeError += ` (${error.status})`;
        }
        if (error.error) {
          if (typeof error.error === 'object') {
            mensajeError += ': ' + JSON.stringify(error.error);
          } else {
            mensajeError += ': ' + error.error;
          }
        }
        this.mostrarMensaje(mensajeError);
      }
    });
  }
}