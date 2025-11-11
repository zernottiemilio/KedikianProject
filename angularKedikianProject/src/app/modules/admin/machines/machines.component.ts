import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  MachinesService,
  Maquina,
  RegistroHoras,
  NotaMaquina,
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

// 🆕 Extender la interfaz Maquina con horómetro inicial
interface MaquinaExtendida extends Maquina {
  horometro_inicial?: number;
}

@Component({
  selector: 'app-maquinaria',
  imports: [CommonModule, NgClass, FormsModule, ReactiveFormsModule],
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.css'],
})
export class MaquinariaComponent implements OnInit {
  maquinas: MaquinaExtendida[] = [];
  maquinasFiltradas: MaquinaExtendida[] = [];
  terminoBusqueda: string = '';

  modalVisible: boolean = false;
  modoEdicion: boolean = false;
  maquinaEditando: MaquinaExtendida | null = null;
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
  maquinaSeleccionada: MaquinaExtendida | null = null;

  ultimaHoraMantenimientoPorMaquina: Record<number, number> = {};
  historialPorMaquina: Record<number, Mantenimiento[]> = {};
  proximoMantenimientoPorMaquina: Record<number, number> = {};
  notasPorMaquina: Record<number, NotaMaquina[]> = {};

  constructor(
    private fb: FormBuilder,
    private machinesService: MachinesService,
    private mantenimientosService: MantenimientosService
  ) {
    // ✅ CAMBIO: Solo pedir nombre al crear máquina
    this.maquinaForm = this.fb.group({
      nombre: ['', [Validators.required]],
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
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      maquinas: this.machinesService.obtenerMaquinas(),
      mantenimientos: this.mantenimientosService.listarTodos(),
      horometros: this.machinesService.obtenerHorasIniciales()
    }).subscribe(({ maquinas, mantenimientos, horometros }) => {
      console.log('🔍 Horómetros recibidos:', horometros);
      
      // 🆕 Extender las máquinas con horómetro inicial
      this.maquinas = maquinas.map(m => {
        const horometroInicial = horometros[m.id] !== undefined ? horometros[m.id] : 0;
        console.log(`Máquina ${m.nombre} (ID: ${m.id}): horometro_inicial = ${horometroInicial}`);
        return {
          ...m,
          horometro_inicial: horometroInicial
        };
      });

      console.log('✅ Máquinas con horómetro:', this.maquinas);
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

  // ✅ CAMBIO: Reset solo con nombre
  abrirModalAgregar(): void {
    this.modoEdicion = false;
    this.maquinaEditando = null;
    this.maquinaForm.reset({
      nombre: '',
    });
    this.modalVisible = true;
  }

  // ✅ CAMBIO: Set solo nombre al editar
  abrirModalEditar(maquina: MaquinaExtendida): void {
    this.modoEdicion = true;
    this.maquinaEditando = maquina;
    this.maquinaForm.setValue({
      nombre: maquina.nombre,
    });
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
  }

  // ✅ CAMBIO: Backend solo acepta nombre (genera código automáticamente)
  guardarMaquina(): void {
  if (this.maquinaForm.invalid) {
    this.maquinaForm.markAllAsTouched();
    return;
  }
  
  const formData = this.maquinaForm.value;
  console.log('📝 Datos del formulario:', formData);
  console.log('📝 Claves del formulario:', Object.keys(formData));

  if (this.modoEdicion && this.maquinaEditando) {
    // Al editar, enviamos solo los campos necesarios
    const maquinaActualizada: Maquina = {
      id: this.maquinaEditando.id,
      codigo: this.maquinaEditando.codigo,
      nombre: formData.nombre.trim(),
      horas_uso: this.maquinaEditando.horas_uso,
    };
    
    console.log('✏️ Actualizando máquina:', maquinaActualizada);
    
    this.machinesService.actualizarMaquina(maquinaActualizada).subscribe({
      next: () => {
        this.loadData();
        this.mostrarMensaje('Máquina actualizada correctamente');
        this.cerrarModal();
      },
      error: (error) => {
        console.error('❌ Error al actualizar:', error);
        const errorMsg = error.error?.message || error.error?.detail || 'Error al actualizar la máquina';
        this.mostrarMensaje(`Error: ${errorMsg}`);
      }
    });
  } else {
    // ✅ CREAR: Enviar SOLO el nombre, nada más
    // Importante: crear un objeto completamente nuevo
    const nuevaMaquina = {
      nombre: formData.nombre.trim()
    };
    
    console.log('➕ Creando nueva máquina');
    console.log('📤 Objeto a enviar:', nuevaMaquina);
    console.log('📤 Claves:', Object.keys(nuevaMaquina));
    console.log('📤 JSON:', JSON.stringify(nuevaMaquina));
    console.log('📤 Tiene "estado"?:', 'estado' in nuevaMaquina);
    console.log('📤 Tiene "horas_uso"?:', 'horas_uso' in nuevaMaquina);
    console.log('📤 Tiene "codigo"?:', 'codigo' in nuevaMaquina);
    
    this.machinesService.crearMaquina(nuevaMaquina as Omit<Maquina, 'id'>).subscribe({
      next: (maquinaCreada) => {
        console.log('✅ Máquina creada exitosamente:', maquinaCreada);
        this.loadData();
        this.mostrarMensaje('Máquina agregada correctamente');
        this.cerrarModal();
      },
      error: (error) => {
        console.error('❌ Error completo al crear:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error.error:', error.error);
        console.error('❌ Headers:', error.headers);
        
        // Mostrar el error completo del backend
        let errorMsg = 'Error al agregar la máquina';
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.error?.detail) {
          errorMsg = error.error.detail;
        } else if (typeof error.error === 'string') {
          errorMsg = error.error;
        }
        
        console.error('❌ Mensaje de error final:', errorMsg);
        this.mostrarMensaje(`Error: ${errorMsg}`);
      }
    });
  }
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

  getUltimoMantenimiento(maquina: MaquinaExtendida): number {
    const ultima = this.ultimaHoraMantenimientoPorMaquina[maquina.id];
    return typeof ultima === 'number' ? ultima : 0;
  }

  getHorasTrabajadas(maquina: MaquinaExtendida): number {
    const horasActuales = maquina.horas_uso || 0;
    const horasUltimoMant = this.getUltimoMantenimiento(maquina);
    return Math.max(0, horasActuales - horasUltimoMant);
  }

  getProximoMantenimiento(maquina: MaquinaExtendida): number {
    // Prioridad 1: Valor personalizado del backend
    if (maquina.proximo_mantenimiento !== null && maquina.proximo_mantenimiento !== undefined) {
      return maquina.proximo_mantenimiento;
    }
    // Prioridad 2: Valor del cache local (para ediciones no guardadas)
    if (this.proximoMantenimientoPorMaquina[maquina.id]) {
      return this.proximoMantenimientoPorMaquina[maquina.id];
    }
    // Prioridad 3: Cálculo automático por defecto
    const horasUltimoMant = this.getUltimoMantenimiento(maquina);
    return horasUltimoMant + 250;
  }

  getHorasRestantes(maquina: MaquinaExtendida): number {
    const horometroInicial = this.getHorometroInicial(maquina);
    const proximoMant = this.getProximoMantenimiento(maquina);
    const restantes = proximoMant - horometroInicial;
    return Math.max(0, restantes);
  }

  getColorHorasRestantes(maquina: MaquinaExtendida): string {
    const horasRestantes = this.getHorasRestantes(maquina);
    
    if (horasRestantes <= 0) {
      return 'text-danger'; // Rojo fuerte - Ya pasó el mantenimiento
    } else if (horasRestantes <= 20) {
      return 'text-danger'; // Rojo fuerte - 20 horas o menos
    } else if (horasRestantes <= 100) {
      return 'text-warning'; // Amarillo - 100 horas o menos
    }
    return 'text-success'; // Verde - Más de 100 horas
  }

  getColorHorasTrabajadas(maquina: MaquinaExtendida): string {
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

  getEstadoMantenimiento(maquina: MaquinaExtendida): string {
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

  // 🆕 NUEVO MÉTODO: Obtener horómetro inicial para mostrar en la tabla
  getHorometroInicial(maquina: MaquinaExtendida): number {
    const valor = maquina.horometro_inicial ?? 0;
    console.log(`getHorometroInicial para ${maquina.nombre}: ${valor}`);
    return valor;
  }

  // ========== MÉTODOS PARA EDITAR HORAS DEL PRÓXIMO MANTENIMIENTO ==========

  abrirModalEditarHorasMantenimiento(maquina: MaquinaExtendida): void {
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

    // Actualizar en el backend
    this.machinesService.actualizarProximoMantenimiento(this.maquinaSeleccionada.id, nuevasHorasProxMant).subscribe({
      next: (maquinaActualizada) => {
        // Actualizar la máquina en el array local
        const index = this.maquinas.findIndex(m => m.id === this.maquinaSeleccionada!.id);
        if (index !== -1) {
          this.maquinas[index] = { ...this.maquinas[index], proximo_mantenimiento: maquinaActualizada.proximo_mantenimiento };
          this.filtrarMaquinas();
        }

        const horasRestantes = nuevasHorasProxMant - horasActuales;
        this.mostrarMensaje(`Próximo mantenimiento actualizado a ${nuevasHorasProxMant} horas (faltan ${horasRestantes} hs)`);
        this.cerrarModalEditarHorasMantenimiento();
      },
      error: (error) => {
        console.error('Error al actualizar próximo mantenimiento:', error);
        this.mostrarMensaje('Error al actualizar el próximo mantenimiento');
      }
    });
  }

  // ========== MÉTODOS DE MANTENIMIENTO ==========

  abrirModalRegistrarMantenimiento(maquina: MaquinaExtendida): void {
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
    const horasActuales = this.getHorometroInicial(maquina);
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

  abrirModalHistorial(maquina: MaquinaExtendida): void {
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

  abrirModalAgregarHoras(maquina: MaquinaExtendida): void {
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

  abrirModalNotas(maquina: MaquinaExtendida): void {
    this.maquinaSeleccionada = maquina;
    this.notaForm.reset({
      texto: ''
    });

    // Cargar notas desde el backend
    this.machinesService.obtenerNotasMaquina(maquina.id).subscribe({
      next: (notas) => {
        this.notasPorMaquina[maquina.id] = notas;
        this.modalNotasVisible = true;
      },
      error: (error) => {
        console.error('Error al cargar notas:', error);
        // Aún así abrir el modal, pero sin notas
        this.notasPorMaquina[maquina.id] = [];
        this.modalNotasVisible = true;
      }
    });
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

    const texto = this.notaForm.value.texto;

    // Crear nota en el backend
    this.machinesService.crearNota(this.maquinaSeleccionada.id, texto).subscribe({
      next: (notaCreada) => {
        // Actualizar el array local con la nota creada por el backend
        if (!this.notasPorMaquina[this.maquinaSeleccionada!.id]) {
          this.notasPorMaquina[this.maquinaSeleccionada!.id] = [];
        }
        this.notasPorMaquina[this.maquinaSeleccionada!.id].unshift(notaCreada);

        this.mostrarMensaje('Nota agregada correctamente');
        this.notaForm.reset({ texto: '' });
      },
      error: (error) => {
        console.error('Error al crear nota:', error);
        this.mostrarMensaje('Error al agregar la nota');
      }
    });
  }

  eliminarNota(notaId: number): void {
    if (!this.maquinaSeleccionada) return;

    if (confirm('¿Está seguro que desea eliminar esta nota?')) {
      // Eliminar nota en el backend
      this.machinesService.eliminarNota(notaId).subscribe({
        next: () => {
          // Actualizar el array local solo si la eliminación fue exitosa
          const maquinaId = this.maquinaSeleccionada!.id;
          this.notasPorMaquina[maquinaId] = this.notasPorMaquina[maquinaId].filter(
            nota => nota.id !== notaId
          );
          this.mostrarMensaje('Nota eliminada correctamente');
        },
        error: (error) => {
          console.error('Error al eliminar nota:', error);
          this.mostrarMensaje('Error al eliminar la nota');
        }
      });
    }
  }

  getNotasMaquina(maquinaId: number): NotaMaquina[] {
    return this.notasPorMaquina[maquinaId] || [];
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