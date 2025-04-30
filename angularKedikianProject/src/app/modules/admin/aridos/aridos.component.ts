import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { Observable, of } from 'rxjs';

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
  // Propiedades
  registroForm: FormGroup;
  registros: RegistroArido[] = [];
  proyectos: Proyecto[] = [];
  aridos: Arido[] = [];
  filtroProyecto: number | null = null;
  filtroArido: number | null = null;
  modoEdicion = false;
  registroEditandoId: number | null = null;

  // Propiedades para estadísticas
  totalAridosEntregados = 0;
  aridosPorProyecto: { [proyectoId: number]: number } = {};

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
    // Cargar datos de prueba (después se reemplazarán con llamadas a API)
    this.cargarDatosDePrueba();
    this.calcularEstadisticas();
  }

  // Método para cargar datos temporales de prueba
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
  }

  // Métodos para gestionar filtros
  aplicarFiltros(): void {
    // Implementar en el futuro - actual usa datos de prueba
    this.calcularEstadisticas();
  }

  limpiarFiltros(): void {
    this.filtroProyecto = null;
    this.filtroArido = null;
    this.calcularEstadisticas();
  }

  // Métodos para estadísticas
  calcularEstadisticas(): void {
    let registrosFiltrados = this.getRegistrosFiltrados();

    // Calcular total de áridos entregados
    this.totalAridosEntregados = registrosFiltrados.reduce(
      (total, reg) => total + reg.cantidad,
      0
    );

    // Calcular áridos por proyecto
    this.aridosPorProyecto = {};
    registrosFiltrados.forEach((reg) => {
      if (!this.aridosPorProyecto[reg.proyectoId]) {
        this.aridosPorProyecto[reg.proyectoId] = 0;
      }
      this.aridosPorProyecto[reg.proyectoId] += reg.cantidad;
    });
  }

  getRegistrosFiltrados(): RegistroArido[] {
    return this.registros.filter((reg) => {
      // Aplicar filtro de proyecto si está activo
      if (
        this.filtroProyecto !== null &&
        reg.proyectoId !== this.filtroProyecto
      ) {
        return false;
      }

      // Aplicar filtro de árido si está activo
      if (this.filtroArido !== null && reg.aridoId !== this.filtroArido) {
        return false;
      }

      return true;
    });
  }

  // Métodos para el formulario
  get registrosFiltrados(): RegistroArido[] {
    return this.getRegistrosFiltrados();
  }

  agregarRegistro(): void {
    if (this.registroForm.valid) {
      const formValue = this.registroForm.value;

      // Obtener nombres para proyectos y áridos
      const proyecto = this.proyectos.find(
        (p) => p.id === parseInt(formValue.proyectoId)
      );
      const arido = this.aridos.find(
        (a) => a.id === parseInt(formValue.aridoId)
      );

      if (!proyecto || !arido) {
        console.error('Proyecto o árido no encontrado');
        return;
      }

      // Crear nuevo registro
      const nuevoRegistro: RegistroArido = {
        id:
          this.modoEdicion && this.registroEditandoId
            ? this.registroEditandoId
            : this.registros.length + 1,
        proyectoId: parseInt(formValue.proyectoId),
        proyectoNombre: proyecto.nombre,
        aridoId: parseInt(formValue.aridoId),
        aridoNombre: arido.nombre,
        cantidad: parseFloat(formValue.cantidad),
        fechaEntrega: new Date(formValue.fechaEntrega),
        operario: formValue.operario,
        observaciones: formValue.observaciones || '',
      };

      if (this.modoEdicion && this.registroEditandoId) {
        // Actualizar registro existente
        const index = this.registros.findIndex(
          (r) => r.id === this.registroEditandoId
        );
        if (index !== -1) {
          this.registros[index] = nuevoRegistro;
        }
        this.modoEdicion = false;
        this.registroEditandoId = null;
      } else {
        // Agregar nuevo registro
        this.registros.push(nuevoRegistro);
      }

      // Resetear formulario y recalcular estadísticas
      this.registroForm.reset({
        fechaEntrega: new Date().toISOString().split('T')[0],
      });
      this.calcularEstadisticas();
    }
  }

  editarRegistro(registro: RegistroArido): void {
    this.modoEdicion = true;
    this.registroEditandoId = registro.id;

    this.registroForm.setValue({
      proyectoId: registro.proyectoId,
      aridoId: registro.aridoId,
      cantidad: registro.cantidad,
      fechaEntrega: new Date(registro.fechaEntrega).toISOString().split('T')[0],
      operario: registro.operario,
      observaciones: registro.observaciones || '',
    });
  }

  eliminarRegistro(id: number): void {
    if (confirm('¿Está seguro que desea eliminar este registro?')) {
      const index = this.registros.findIndex((r) => r.id === id);
      if (index !== -1) {
        this.registros.splice(index, 1);
        this.calcularEstadisticas();
      }
    }
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.registroEditandoId = null;
    this.registroForm.reset({
      fechaEntrega: new Date().toISOString().split('T')[0],
    });
  }

  // Getters para la vista
  getNombreProyecto(id: number): string {
    const proyecto = this.proyectos.find((p) => p.id === id);
    return proyecto ? proyecto.nombre : 'Desconocido';
  }

  getUnidadMedida(aridoId: number): string {
    const arido = this.aridos.find((a) => a.id === aridoId);
    return arido ? arido.unidadMedida : '';
  }
}
