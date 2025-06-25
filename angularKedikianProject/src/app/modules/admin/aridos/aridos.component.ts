import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AridosService } from '../../../core/services/aridos.service';

// Interfaces
export interface Arido {
  id: number;
  nombre: string;
  tipo: string;
  unidadMedida: string;
  descripcion?: string;
}

export interface RegistroArido {
  id: number;
  proyectoId: number;
  proyectoNombre: string;
  aridoId: number;
  aridoNombre: string;
  cantidad: number;
  fechaEntrega: Date;
  operario: string;
  observaciones?: string;
}

export interface Proyecto {
  id: number;
  nombre: string;
  ubicacion: string;
  estado: 'activo' | 'pausado' | 'completado';
}

@Component({
  selector: 'app-aridos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './aridos.component.html',
  styleUrls: ['./aridos.component.css'],
})
export class AridosComponent implements OnInit {
  registroForm: FormGroup;
  registros: RegistroArido[] = [];
  registrosFiltrados: RegistroArido[] = [];
  proyectos: Proyecto[] = [];
  aridos: Arido[] = [];

  // Estado de los modales
  mostrarModal = false;
  mostrarModalConfirmacion = false;
  modoEdicion = false;
  registroEditandoId: number | null = null;
  registroAEliminar: RegistroArido | null = null;

  constructor(private fb: FormBuilder, private aridosService: AridosService) {
    this.registroForm = this.fb.group({
      proyectoId: ['', Validators.required],
      aridoId: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(0.1)]],
      fechaEntrega: [
        new Date().toISOString().split('T')[0],
        Validators.required,
      ],
      operario: ['', Validators.required],
      observaciones: [''],
    });
  }

  ngOnInit(): void {
    this.cargarDatosReales();
  }

  cargarDatosReales(): void {
    // Cargar proyectos
    this.aridosService.getProyectos().subscribe({
      next: (proyectos) => {
        this.proyectos = proyectos;
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        this.mostrarMensaje('Error al cargar proyectos');
      }
    });

    // Cargar áridos
    this.aridosService.getAridos().subscribe({
      next: (aridos) => {
        this.aridos = aridos;
      },
      error: (error) => {
        console.error('Error al cargar áridos:', error);
        this.mostrarMensaje('Error al cargar áridos');
      }
    });

    // Cargar registros
    this.aridosService.getRegistrosAridos().subscribe({
      next: (registros) => {
        this.registros = registros;
        this.actualizarRegistrosFiltrados();
      },
      error: (error) => {
        console.error('Error al cargar registros:', error);
        this.mostrarMensaje('Error al cargar registros');
      }
    });
  }

  actualizarRegistrosFiltrados(): void {
    this.registrosFiltrados = [...this.registros];
  }

  // Métodos para el modal de registro/edición
  abrirModalAgregar(): void {
    this.modoEdicion = false;
    this.registroEditandoId = null;
    this.registroForm.reset({
      fechaEntrega: new Date().toISOString().split('T')[0],
    });
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.registroForm.reset();
    this.modoEdicion = false;
    this.registroEditandoId = null;
  }

  editarRegistro(registro: RegistroArido): void {
    this.modoEdicion = true;
    this.registroEditandoId = registro.id;
    this.registroForm.patchValue({
      proyectoId: registro.proyectoId,
      aridoId: registro.aridoId,
      cantidad: registro.cantidad,
      fechaEntrega: new Date(registro.fechaEntrega).toISOString().split('T')[0],
      operario: registro.operario,
      observaciones: registro.observaciones || '',
    });
    this.mostrarModal = true;
  }

  // Métodos para el modal de confirmación de eliminación
  confirmarEliminar(registro: RegistroArido): void {
    this.registroAEliminar = registro;
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminar(): void {
    this.registroAEliminar = null;
    this.mostrarModalConfirmacion = false;
  }

  eliminarRegistro(): void {
    if (this.registroAEliminar) {
      this.aridosService.eliminarRegistroArido(this.registroAEliminar.id).subscribe({
        next: () => {
          this.cargarDatosReales();
          this.mostrarMensaje('Registro eliminado correctamente');
          this.mostrarModalConfirmacion = false;
          this.registroAEliminar = null;
        },
        error: (error) => {
          console.error('Error al eliminar registro:', error);
          this.mostrarMensaje('Error al eliminar el registro');
          this.mostrarModalConfirmacion = false;
          this.registroAEliminar = null;
        }
      });
    }
  }

  // Método para guardar/actualizar registro
  agregarRegistro(): void {
    if (this.registroForm.valid) {
      const formData = this.registroForm.value;
      const proyecto = this.proyectos.find(
        (p) => p.id === +formData.proyectoId
      );
      const arido = this.aridos.find((a) => a.id === +formData.aridoId);

      if (!proyecto || !arido) {
        this.mostrarMensaje('Error: Proyecto o árido no encontrado');
        return;
      }

      const nuevoRegistro: Omit<RegistroArido, 'id'> = {
        proyectoId: +formData.proyectoId,
        proyectoNombre: proyecto.nombre,
        aridoId: +formData.aridoId,
        aridoNombre: arido.nombre,
        cantidad: +formData.cantidad,
        fechaEntrega: new Date(formData.fechaEntrega),
        operario: formData.operario,
        observaciones: formData.observaciones,
      };

      if (this.modoEdicion && this.registroEditandoId) {
        // Actualizar registro existente
        const registroActualizado: RegistroArido = {
          ...nuevoRegistro,
          id: this.registroEditandoId
        };
        
        this.aridosService.actualizarRegistroArido(registroActualizado).subscribe({
          next: () => {
            this.cargarDatosReales();
            this.mostrarMensaje('Registro actualizado correctamente');
            this.cerrarModal();
          },
          error: (error) => {
            console.error('Error al actualizar registro:', error);
            this.mostrarMensaje('Error al actualizar el registro');
          }
        });
      } else {
        // Crear nuevo registro
        this.aridosService.crearRegistroArido(nuevoRegistro).subscribe({
          next: () => {
            this.cargarDatosReales();
            this.mostrarMensaje('Registro creado correctamente');
            this.cerrarModal();
          },
          error: (error) => {
            console.error('Error al crear registro:', error);
            this.mostrarMensaje('Error al crear el registro');
          }
        });
      }
    }
  }

  getUnidadMedida(aridoId: number): string {
    const arido = this.aridos.find((a) => a.id === aridoId);
    return arido ? arido.unidadMedida : '';
  }

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
      if (document.body.contains(notificacion)) {
        document.body.removeChild(notificacion);
      }
    }, 3000);
  }
}
