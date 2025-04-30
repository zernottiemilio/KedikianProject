// maquinaria.component.ts
import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';

interface Maquina {
  id: number;
  nombre: string;
  estado: boolean;
  horas_uso: number;
}

@Component({
  selector: 'app-maquinaria',
  imports: [CommonModule, NgClass, FormsModule, ReactiveFormsModule], // Aquí puedes importar otros módulos si es necesario
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.css'],
})
export class MaquinariaComponent implements OnInit {
  // Datos de máquinas
  maquinas: Maquina[] = [];
  maquinasFiltradas: Maquina[] = [];

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

  constructor(private fb: FormBuilder) {
    this.maquinaForm = this.fb.group({
      nombre: ['', [Validators.required]],
      estado: [true],
      horas_uso: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    // Cargar datos de ejemplo (en una app real, esto vendría de un servicio)
    this.cargarDatosDePrueba();
    this.filtrarMaquinas();
  }

  // Cargar datos de prueba (simula una llamada a API)
  cargarDatosDePrueba(): void {
    this.maquinas = [
      { id: 1, nombre: 'Excavadora HD500', estado: true, horas_uso: 1250 },
      { id: 2, nombre: 'Tractor T-200', estado: false, horas_uso: 3400 },
      { id: 3, nombre: 'Grúa Móvil G1000', estado: true, horas_uso: 780 },
      { id: 4, nombre: 'Bulldozer B50', estado: true, horas_uso: 2100 },
      {
        id: 5,
        nombre: 'Cargadora Frontal CF300',
        estado: false,
        horas_uso: 4500,
      },
    ];
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
          maquina.id.toString().includes(busqueda)
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
      // Actualizar máquina existente
      const index = this.maquinas.findIndex(
        (m) => m.id === this.maquinaEditando!.id
      );
      if (index !== -1) {
        this.maquinas[index] = {
          ...this.maquinas[index],
          nombre: formData.nombre,
          estado: formData.estado,
          horas_uso: formData.horas_uso,
        };
        this.mostrarMensaje('Máquina actualizada correctamente');
      }
    } else {
      // Crear nueva máquina
      const nuevoId = this.generarNuevoId();
      const nuevaMaquina: Maquina = {
        id: nuevoId,
        nombre: formData.nombre,
        estado: formData.estado,
        horas_uso: formData.horas_uso,
      };

      this.maquinas.unshift(nuevaMaquina);
      this.mostrarMensaje('Máquina agregada correctamente');
    }

    // Actualizar la lista filtrada
    this.filtrarMaquinas();
    this.cerrarModal();
  }

  // Generar un nuevo ID para la máquina
  generarNuevoId(): number {
    return this.maquinas.length > 0
      ? Math.max(...this.maquinas.map((m) => m.id)) + 1
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
      const index = this.maquinas.findIndex(
        (m) => m.id === this.maquinaAEliminar
      );
      if (index !== -1) {
        // Obtener el nombre para el mensaje
        const nombreMaquina = this.maquinas[index].nombre;
        // Eliminar la máquina
        this.maquinas.splice(index, 1);
        this.filtrarMaquinas();
        this.mostrarMensaje(
          `Máquina "${nombreMaquina}" eliminada correctamente`
        );
      }
      // Cerrar el modal de confirmación
      this.cancelarEliminarMaquina();
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
}
