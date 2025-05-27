// maquinaria.component.ts
import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../../core/services/project.service';
import {
  MachinesService,
  Maquina,
  ProyectoAsignado,
} from '../../../core/services/machines.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';

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

  constructor(
    private fb: FormBuilder,
    private machinesService: MachinesService,
    private projectService: ProjectService
  ) {
    this.maquinaForm = this.fb.group({
      nombre: ['', [Validators.required]],
      estado: [true],
      horas_uso: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.loadMachines();
    this.cargarDatosDePrueba();
  }

  loadMachines(): void {
    this.machinesService.obtenerMaquinas().subscribe((maquinas) => {
      this.maquinas = maquinas;
      this.maquinas.forEach((maquina) => {
        this.loadMachineProjects(maquina);
      });
      this.filtrarMaquinas();
    });
  }

  loadMachineProjects(maquina: Maquina): void {
    this.projectService.findByIdMaquina(maquina.id).subscribe((proyectos) => {
      maquina.proyectos = Array.from(
        proyectos.map((proyecto) => ({
          id: proyecto.id,
          nombre: proyecto.nombre,
          fechaAsignacion: new Date(proyecto.fechaAsignacion),
        }))
      );
    });
  }

  // Cargar datos de prueba (simula una llamada a API)
  cargarDatosDePrueba(): void {
    this.maquinas = [
      {
        id: 1,
        codigo: 'EXC001',
        nombre: 'Excavadora HD500',
        estado: true,
        horas_uso: 1250,
        proyectos: [],
      },
      {
        id: 2,
        codigo: 'TRC001',
        nombre: 'Tractor T-200',
        estado: false,
        horas_uso: 3400,
        proyectos: [],
      },
      {
        id: 3,
        codigo: 'GRU001',
        nombre: 'Grúa Móvil G1000',
        estado: true,
        horas_uso: 780,
        proyectos: [
          {
            id: 1,
            nombre: 'Puente Villa Maria',
            fechaAsignacion: new Date(),
          },
        ],
      },
      {
        id: 4,
        codigo: 'BUL001',
        nombre: 'Bulldozer B50',
        estado: true,
        horas_uso: 2100,
        proyectos: [],
      },
      {
        id: 5,
        codigo: 'CAR001',
        nombre: 'Cargadora Frontal CF300',
        estado: false,
        horas_uso: 4500,
        proyectos: [],
      },
    ];
    this.filtrarMaquinas();
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
        (m) => m.codigo === this.maquinaEditando!.codigo
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
      const nuevoCodigo = this.generarNuevoCodigo();
      const nuevaMaquina: Maquina = {
        id: this.generarNuevoCodigo(),
        codigo: nuevoCodigo.toString(),
        nombre: formData.nombre,
        estado: formData.estado,
        horas_uso: formData.horas_uso,
        proyectos: [],
      };

      this.maquinas.unshift(nuevaMaquina);
      this.mostrarMensaje('Máquina agregada correctamente');
    }

    // Actualizar la lista filtrada
    this.filtrarMaquinas();
    this.cerrarModal();
  }

  // Generar un nuevo código para la máquina
  generarNuevoCodigo(): number {
    return this.maquinas.length > 0
      ? Math.max(...this.maquinas.map((m) => Number(m.codigo))) + 1
      : 1;
  }

  // Mostrar confirmación antes de eliminar máquina
  eliminarMaquina(codigo: number): void {
    this.maquinaAEliminar = codigo;
    this.modalConfirmacionVisible = true;
  }

  // Confirmar eliminación de máquina
  confirmarEliminarMaquina(): void {
    if (this.maquinaAEliminar !== null) {
      const index = this.maquinas.findIndex(
        (m) => Number(m.codigo) === this.maquinaAEliminar
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
