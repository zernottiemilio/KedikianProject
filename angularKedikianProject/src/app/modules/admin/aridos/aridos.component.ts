import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(private fb: FormBuilder) {
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
    this.cargarDatosDePrueba();
    this.actualizarRegistrosFiltrados();
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
      const index = this.registros.findIndex(
        (r) => r.id === this.registroAEliminar!.id
      );
      if (index !== -1) {
        this.registros.splice(index, 1);
        this.actualizarRegistrosFiltrados();
      }
      this.mostrarModalConfirmacion = false;
      this.registroAEliminar = null;
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

      if (!proyecto || !arido) return;

      const nuevoRegistro: RegistroArido = {
        id: this.modoEdicion ? this.registroEditandoId! : this.generarNuevoId(),
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
        const index = this.registros.findIndex(
          (r) => r.id === this.registroEditandoId
        );
        if (index !== -1) {
          this.registros[index] = nuevoRegistro;
        }
      } else {
        this.registros.unshift(nuevoRegistro);
      }

      this.actualizarRegistrosFiltrados();
      this.cerrarModal();
    }
  }

  private generarNuevoId(): number {
    return this.registros.length > 0
      ? Math.max(...this.registros.map((r) => r.id)) + 1
      : 1;
  }

  getUnidadMedida(aridoId: number): string {
    const arido = this.aridos.find((a) => a.id === aridoId);
    return arido ? arido.unidadMedida : '';
  }

  cargarDatosDePrueba(): void {
    // Proyectos de ejemplo
    this.proyectos = [
      {
        id: 1,
        nombre: 'Edificio Residencial Aurora',
        ubicacion: 'Av. Principal 123',
        estado: 'activo',
      },
      {
        id: 2,
        nombre: 'Centro Comercial Plaza Norte',
        ubicacion: 'Ruta 25 km 14',
        estado: 'activo',
      },
      {
        id: 3,
        nombre: 'Puente Costanera',
        ubicacion: 'Sector Costanera Sur',
        estado: 'pausado',
      },
    ];

    // Áridos de ejemplo
    this.aridos = [
      { id: 1, nombre: 'Arena Fina', tipo: 'Arena', unidadMedida: 'm³' },
      { id: 2, nombre: 'Grava', tipo: 'Piedra', unidadMedida: 'm³' },
      {
        id: 3,
        nombre: 'Piedra Partida',
        tipo: 'Piedra',
        unidadMedida: 'toneladas',
      },
      { id: 4, nombre: 'Arena Gruesa', tipo: 'Arena', unidadMedida: 'm³' },
    ];

    // Registros de ejemplo
    this.registros = [
      {
        id: 1,
        proyectoId: 1,
        proyectoNombre: 'Edificio Residencial Aurora',
        aridoId: 1,
        aridoNombre: 'Arena Fina',
        cantidad: 15,
        fechaEntrega: new Date('2025-04-20'),
        operario: 'Juan Pérez',
        observaciones: 'Entrega completa sin inconvenientes',
      },
      {
        id: 2,
        proyectoId: 2,
        proyectoNombre: 'Centro Comercial Plaza Norte',
        aridoId: 2,
        aridoNombre: 'Grava',
        cantidad: 22.5,
        fechaEntrega: new Date('2025-04-22'),
        operario: 'María Gómez',
        observaciones: 'Se requiere más material para la próxima semana',
      },
      {
        id: 3,
        proyectoId: 1,
        proyectoNombre: 'Edificio Residencial Aurora',
        aridoId: 3,
        aridoNombre: 'Piedra Partida',
        cantidad: 8,
        fechaEntrega: new Date('2025-04-25'),
        operario: 'Carlos Rodríguez',
        observaciones: '',
      },
    ];

    this.actualizarRegistrosFiltrados();
  }
}
