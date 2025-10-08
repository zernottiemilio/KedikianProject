// machines.component.ts - Con correcciones de errores 422
import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  MachinesService,
  Maquina,
  RegistroHoras,
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

interface NotaMaquina {
  id: number;
  maquina_id: number;
  texto: string;
  fecha: string;
  usuario: string;
}

@Component({
  selector: 'app-maquinaria',
  imports: [CommonModule, NgClass, FormsModule, ReactiveFormsModule],
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.css'],
})
export class MaquinariaComponent implements OnInit {
  maquinas: Maquina[] = [];
  maquinasFiltradas: Maquina[] = [];
  terminoBusqueda: string = '';

  modalVisible: boolean = false;
  modoEdicion: boolean = false;
  maquinaEditando: Maquina | null = null;
  modalConfirmacionVisible: boolean = false;
  maquinaAEliminar: number | null = null;

  maquinaForm: FormGroup;
  mantenimientoForm: FormGroup;
  horasForm: FormGroup;
  horasMantenimientoForm: FormGroup;
  notaForm: FormGroup;

  modalHorasVisible: boolean = false;
  modalMantVisible: boolean = false;
  modalHistorialVisible: boolean = false;
  modalEditarHorasMantenimientoVisible: boolean = false;
  modalNotasVisible: boolean = false;
  maquinaSeleccionada: Maquina | null = null;

  ultimaHoraMantenimientoPorMaquina: Record<number, number> = {};
  historialPorMaquina: Record<number, Mantenimiento[]> = {};
  proximoMantenimientoPorMaquina: Record<number, number> = {};
  notasPorMaquina: Record<number, NotaMaquina[]> = {};

  constructor(
    private fb: FormBuilder,
    private machinesService: MachinesService,
    private mantenimientosService: MantenimientosService
  ) {
    this.maquinaForm = this.fb.group({
      nombre: ['', [Validators.required]],
      horas_uso: [0, [Validators.required, Validators.min(0)]],
    });

    this.mantenimientoForm = this.fb.group({
      fecha: [new Date().toISOString().split('T')[0], [Validators.required]],
      tipo: ['preventivo', [Validators.required]],
      descripcion: ['', [Validators.required, Validators.minLength(3)]],
    });

    this.horasForm = this.fb.group({
      horas: [null, [Validators.required, Validators.min(0.1), Validators.pattern(/^\d*\.?\d+$/)]],
      fecha: [new Date().toISOString().split('T')[0], [Validators.required]],
      descripcion: ['']
    });

    this.horasMantenimientoForm = this.fb.group({
      horas_proximo_mantenimiento: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]]
    });

    this.notaForm = this.fb.group({
      texto: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    this.cargarProximosMantenimientos();
    this.cargarNotas();
    this.loadData();
  }

  loadData(): void {
  forkJoin({
    maquinas: this.machinesService.obtenerMaquinas(),
    mantenimientos: this.mantenimientosService.listarTodos(),
    horometros: this.machinesService.obtenerHorasIniciales()
  }).subscribe(({ maquinas, mantenimientos, horometros }) => {
    this.maquinas = maquinas;

    // Actualizar horas_uso con el horómetro actual desde reportes
    this.maquinas.forEach(m => {
      if (horometros[m.id] !== undefined) {
        m.horas_uso = horometros[m.id];
      }
    });

    this.procesarHistorialMantenimientos(mantenimientos);
    this.filtrarMaquinas();
  });
}

  filtrarMaquinas(): void {
    let resultado = [...this.maquinas];
    if (this.terminoBusqueda && this.terminoBusqueda.trim() !== '') {
      const busqueda = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(
        (maquina) =>
          maquina.nombre.toLowerCase().includes(busqueda) ||
          maquina.codigo.toString().includes(busqueda)
      );
    }
    this.maquinasFiltradas = resultado;
  }

  abrirModalAgregar(): void {
    this.modoEdicion = false;
    this.maquinaEditando = null;
    this.maquinaForm.reset({
      nombre: '',
      horas_uso: 0,
    });
    this.modalVisible = true;
  }

  abrirModalEditar(maquina: Maquina): void {
    this.modoEdicion = true;
    this.maquinaEditando = maquina;
    this.maquinaForm.setValue({
      nombre: maquina.nombre,
      horas_uso: maquina.horas_uso,
    });
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
  }

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
        estado: true,
        horas_uso: formData.horas_uso,
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
        estado: true,
        horas_uso: formData.horas_uso,
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

  generarNuevoCodigo(): number {
    return this.maquinas.length > 0
      ? Math.max(...this.maquinas.map((m) => Number(m.codigo))) + 1
      : 1;
  }

  eliminarMaquina(id: number): void {
    this.maquinaAEliminar = id;
    this.modalConfirmacionVisible = true;
  }

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

  cancelarEliminarMaquina(): void {
    this.modalConfirmacionVisible = false;
    this.maquinaAEliminar = null;
  }
  
  // ========== MÉTODOS SIMPLIFICADOS DE MANTENIMIENTO ==========
  
  procesarHistorialMantenimientos(mantenimientos: Mantenimiento[]): void {
    this.ultimaHoraMantenimientoPorMaquina = {};
    this.historialPorMaquina = {};

    mantenimientos.forEach(mantenimiento => {
      const maquinaId = mantenimiento.maquina_id;
      if (!this.historialPorMaquina[maquinaId]) {
        this.historialPorMaquina[maquinaId] = [];
      }
      this.historialPorMaquina[maquinaId].push(mantenimiento);
    });

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

  private obtenerUltimoMantenimiento(maquinaId: number, registros: Mantenimiento[]): Mantenimiento | null {
    if (!registros || registros.length === 0) return null;
    const registrosConHoras = registros.filter(r => r.horas_maquina !== null && r.horas_maquina !== undefined);
    if (registrosConHoras.length === 0) return null;
    const ordenados = [...registrosConHoras].sort((a, b) => (b.horas_maquina || 0) - (a.horas_maquina || 0));
    return ordenados[0];
  }

  getUltimoMantenimiento(maquina: Maquina): number {
    const ultima = this.ultimaHoraMantenimientoPorMaquina[maquina.id];
    return typeof ultima === 'number' ? ultima : 0;
  }

  getHorasTrabajadas(maquina: Maquina): number {
    const horasActuales = maquina.horas_uso || 0;
    const horasUltimoMant = this.getUltimoMantenimiento(maquina);
    return Math.max(0, horasActuales - horasUltimoMant);
  }

  getProximoMantenimiento(maquina: Maquina): number {
    if (this.proximoMantenimientoPorMaquina[maquina.id]) {
      return this.proximoMantenimientoPorMaquina[maquina.id];
    }
    const horasUltimoMant = this.getUltimoMantenimiento(maquina);
    return horasUltimoMant + 250;
  }

  getHorasRestantes(maquina: Maquina): number {
    const horasActuales = maquina.horas_uso || 0;
    const proximoMant = this.getProximoMantenimiento(maquina);
    return Math.max(0, proximoMant - horasActuales);
  }

  getColorHorasRestantes(maquina: Maquina): string {
    const horasRestantes = this.getHorasRestantes(maquina);
    const horasActuales = maquina.horas_uso || 0;
    const proximoMant = this.getProximoMantenimiento(maquina);
    const totalHoras = proximoMant - this.getUltimoMantenimiento(maquina);
    const porcentajeRestante = totalHoras > 0 ? (horasRestantes / totalHoras) * 100 : 0;
    
    if (horasRestantes <= 0 || horasActuales >= proximoMant) {
      return 'text-danger';
    } else if (porcentajeRestante <= 10) {
      return 'text-warning-bold';
    } else if (porcentajeRestante <= 20) {
      return 'text-warning';
    }
    return 'text-success';
  }

  getColorHorasTrabajadas(maquina: Maquina): string {
    const horasTrabajadas = this.getHorasTrabajadas(maquina);
    const proximoMant = this.getProximoMantenimiento(maquina);
    const totalHoras = proximoMant - this.getUltimoMantenimiento(maquina);
    const porcentajeTrabajado = totalHoras > 0 ? (horasTrabajadas / totalHoras) * 100 : 0;
    
    if (porcentajeTrabajado >= 100) {
      return 'text-danger';
    } else if (porcentajeTrabajado >= 90) {
      return 'text-warning-bold';
    } else if (porcentajeTrabajado >= 80) {
      return 'text-warning';
    }
    return 'text-success';
  }

  getEstadoMantenimiento(maquina: Maquina): string {
    const horasActuales = maquina.horas_uso || 0;
    const proximoMant = this.getProximoMantenimiento(maquina);
    const restantes = this.getHorasRestantes(maquina);
    
    if (horasActuales >= proximoMant) {
      return `¡URGENTE! Pasó ${horasActuales - proximoMant} hs del límite`;
    } else if (restantes <= 25) {
      return `Faltan ${restantes} hs - Programar pronto`;
    } else if (restantes <= 50) {
      return `Faltan ${restantes} hs`;
    }
    return `Todo OK - Faltan ${restantes} hs`;
  }

  // ========== MÉTODOS PARA EDITAR HORAS DEL PRÓXIMO MANTENIMIENTO ==========

  abrirModalEditarHorasMantenimiento(maquina: Maquina): void {
    this.maquinaSeleccionada = maquina;
    const proximoMant = this.getProximoMantenimiento(maquina);
    this.horasMantenimientoForm.setValue({
      horas_proximo_mantenimiento: proximoMant
    });
    this.modalEditarHorasMantenimientoVisible = true;
  }

  cerrarModalEditarHorasMantenimiento(): void {
    this.modalEditarHorasMantenimientoVisible = false;
    this.maquinaSeleccionada = null;
  }

  guardarHorasMantenimiento(): void {
    if (!this.maquinaSeleccionada || this.horasMantenimientoForm.invalid) {
      this.horasMantenimientoForm.markAllAsTouched();
      return;
    }

    const nuevasHorasProxMant = this.horasMantenimientoForm.value.horas_proximo_mantenimiento;
    const horasActuales = this.maquinaSeleccionada.horas_uso || 0;
    
    if (nuevasHorasProxMant <= horasActuales) {
      this.mostrarMensaje('El próximo mantenimiento debe ser mayor a las horas actuales de la máquina');
      return;
    }
    
    this.proximoMantenimientoPorMaquina[this.maquinaSeleccionada.id] = nuevasHorasProxMant;
    this.guardarProximosMantenimientos();
    
    const horasRestantes = nuevasHorasProxMant - horasActuales;
    this.mostrarMensaje(`Próximo mantenimiento actualizado a ${nuevasHorasProxMant} horas (faltan ${horasRestantes} hs)`);
    this.cerrarModalEditarHorasMantenimiento();
    this.filtrarMaquinas();
  }

  private guardarProximosMantenimientos(): void {
    try {
      localStorage.setItem('proximos_mantenimientos', JSON.stringify(this.proximoMantenimientoPorMaquina));
    } catch (error) {
      console.error('Error al guardar próximos mantenimientos:', error);
    }
  }

  private cargarProximosMantenimientos(): void {
    try {
      const guardado = localStorage.getItem('proximos_mantenimientos');
      if (guardado) {
        this.proximoMantenimientoPorMaquina = JSON.parse(guardado);
      }
    } catch (error) {
      console.error('Error al cargar próximos mantenimientos:', error);
      this.proximoMantenimientoPorMaquina = {};
    }
  }

  // ========== MÉTODOS DE MANTENIMIENTO ==========

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
        console.error('Error al registrar mantenimiento:', error);
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

  // ========== MÉTODOS PARA AGREGAR HORAS ==========

  abrirModalAgregarHoras(maquina: Maquina): void {
    this.maquinaSeleccionada = maquina;
    this.horasForm.reset({
      horas: 0,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: ''
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
      horas_trabajadas: Number(formData.horas),
      fecha: formData.fecha,
      descripcion: formData.descripcion || ''
    };

    console.log('Enviando datos de horas:', horasData);

    this.machinesService.registrarHoras(horasData).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        
        if (this.maquinaSeleccionada) {
          this.maquinaSeleccionada.horas_uso = (this.maquinaSeleccionada.horas_uso || 0) + horasData.horas_trabajadas;
          const index = this.maquinas.findIndex(m => m.id === this.maquinaSeleccionada!.id);
          if (index !== -1) {
            this.maquinas[index] = { ...this.maquinaSeleccionada };
            this.filtrarMaquinas();
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
        if (error.error && typeof error.error === 'string') {
          mensajeError += ': ' + error.error;
        }
        this.mostrarMensaje(mensajeError);
      }
    });
  }

  // ========== MÉTODOS PARA NOTAS ==========

  abrirModalNotas(maquina: Maquina): void {
    this.maquinaSeleccionada = maquina;
    this.notaForm.reset({
      texto: ''
    });
    this.modalNotasVisible = true;
  }

  cerrarModalNotas(): void {
    this.modalNotasVisible = false;
    this.maquinaSeleccionada = null;
    this.notaForm.reset();
  }

  agregarNota(): void {
    if (!this.maquinaSeleccionada || this.notaForm.invalid) {
      this.notaForm.markAllAsTouched();
      return;
    }

    const nuevaNota: NotaMaquina = {
      id: Date.now(),
      maquina_id: this.maquinaSeleccionada.id,
      texto: this.notaForm.value.texto,
      fecha: new Date().toISOString(),
      usuario: 'Usuario'
    };

    if (!this.notasPorMaquina[this.maquinaSeleccionada.id]) {
      this.notasPorMaquina[this.maquinaSeleccionada.id] = [];
    }

    this.notasPorMaquina[this.maquinaSeleccionada.id].unshift(nuevaNota);
    this.guardarNotas();
    this.mostrarMensaje('Nota agregada correctamente');
    this.notaForm.reset({ texto: '' });
  }

  eliminarNota(notaId: number): void {
    if (!this.maquinaSeleccionada) return;
    
    if (confirm('¿Está seguro que desea eliminar esta nota?')) {
      const maquinaId = this.maquinaSeleccionada.id;
      this.notasPorMaquina[maquinaId] = this.notasPorMaquina[maquinaId].filter(
        nota => nota.id !== notaId
      );
      this.guardarNotas();
      this.mostrarMensaje('Nota eliminada correctamente');
    }
  }

  getNotasMaquina(maquinaId: number): NotaMaquina[] {
    return this.notasPorMaquina[maquinaId] || [];
  }

  private guardarNotas(): void {
    try {
      localStorage.setItem('notas_maquinas', JSON.stringify(this.notasPorMaquina));
    } catch (error) {
      console.error('Error al guardar notas:', error);
    }
  }

  private cargarNotas(): void {
    try {
      const guardado = localStorage.getItem('notas_maquinas');
      if (guardado) {
        this.notasPorMaquina = JSON.parse(guardado);
      }
    } catch (error) {
      console.error('Error al cargar notas:', error);
      this.notasPorMaquina = {};
    }
  }

  // ========== UTILIDADES ==========

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

  mostrarMensaje(mensaje: string): void {
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

    setTimeout(() => {
      if (document.body.contains(notificacion)) {
        document.body.removeChild(notificacion);
      }
    }, 3000);
  }

  getHistorialMaquina(maquinaId: number): Mantenimiento[] {
    return this.historialPorMaquina[maquinaId] || [];
  }
}