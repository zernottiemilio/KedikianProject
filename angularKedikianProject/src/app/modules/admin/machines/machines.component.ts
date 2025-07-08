// maquinaria.component.ts
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

  constructor(
    private fb: FormBuilder,
    private machinesService: MachinesService,
    private projectService: ProjectService
  ) {
    this.maquinaForm = this.fb.group({
      nombre: ['', [Validators.required]],
      estado: [true],
      horas_uso: [0, [Validators.required, Validators.min(0)]],
      proyecto_id: [null], // Usar proyecto_id
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      maquinas: this.machinesService.obtenerMaquinas(),
      proyectos: this.projectService.getProjects()
    }).subscribe(({ maquinas, proyectos }) => {
      this.maquinas = maquinas;
      this.proyectos = proyectos;
      this.filtrarMaquinas();
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
}
