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
import { UserService } from '../../../core/services/user.service';
import { forkJoin } from 'rxjs';

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

export interface Operario {
  id: number;
  nombre: string;
  email: string;
  estado: boolean | number | string;
  roles: string | string[] | any;
  fecha_creacion: Date;
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
  operarios: Operario[] = [];

  // Propiedades para filtros
  filtroProyecto: string = '';
  filtroArido: string = '';
  filtroOperario: string = '';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  mostrarFiltros: boolean = false;

  mostrarModal = false;
  mostrarModalConfirmacion = false;
  modoEdicion = false;
  registroEditandoId: number | null = null;
  registroAEliminar: RegistroArido | null = null;

  constructor(
    private fb: FormBuilder,
    private aridosService: AridosService,
    private userService: UserService
  ) {
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
  
  trackByRegistroId(index: number, registro: RegistroArido): number {
    return registro.id;
  } 

  ngOnInit(): void {
    this.cargarDatosReales();
  }

  cargarDatosReales(): void {
    forkJoin({
      proyectos: this.aridosService.getProyectos(),
      aridos: this.aridosService.getAridos()
    }).subscribe({
      next: ({ proyectos, aridos }) => {
        this.proyectos = proyectos;

        const aridosPorDefecto: Arido[] = [
          { id: 1, nombre: 'Arena Fina', tipo: 'árido', unidadMedida: 'm3' },
          { id: 2, nombre: 'Granza', tipo: 'árido', unidadMedida: 'm3' },
          { id: 3, nombre: 'Arena Comun', tipo: 'árido', unidadMedida: 'm3' },
          { id: 4, nombre: 'Relleno', tipo: 'árido', unidadMedida: 'm3' },
          { id: 5, nombre: 'Tierra Negra', tipo: 'árido', unidadMedida: 'm3' },
          { id: 6, nombre: 'Piedra', tipo: 'árido', unidadMedida: 'm3' },
          { id: 7, nombre: '0.20', tipo: 'árido', unidadMedida: 'm3' },
          { id: 8, nombre: 'Blinder', tipo: 'árido', unidadMedida: 'm3' },
          { id: 9, nombre: 'Arena Lavada', tipo: 'árido', unidadMedida: 'm3' },
        ];

        aridosPorDefecto.forEach(defecto => {
          if (!aridos.some(a => a.id === defecto.id)) {
            aridos.push(defecto);
          }
        });
        this.aridos = aridos;

        this.userService.getUsers().subscribe({
          next: (usuarios) => {
            this.procesarUsuarios(usuarios);
            this.cargarRegistros();
          },
          error: () => this.mostrarMensaje('Error al cargar usuarios del servidor')
        });
      },
      error: () => this.mostrarMensaje('Error al cargar datos iniciales')
    });
  }

  private procesarUsuarios(usuarios: any[]): void {
    this.operarios = usuarios.filter(u => {
      const estado = u.estado ?? u.status ?? u.active ?? u.activo;
      return estado === true || estado === 1 || estado === '1';
    }).map(usuario => ({
      ...usuario,
      id: usuario.id,
      nombre: usuario.nombre || usuario.name || 'Usuario sin nombre',
      email: usuario.email || 'sin-email@ejemplo.com',
      roles: usuario.roles || 'OPERARIO',
      estado: true,
      fecha_creacion: usuario.fecha_creacion || usuario.created_at || new Date()
    }));
  }

  private cargarRegistros(): void {
    this.aridosService.getRegistrosAridos().subscribe({
      next: (registrosBackend) => {
        this.registros = this.mapearRegistros(registrosBackend);
        this.aplicarFiltros();
      },
      error: () => this.mostrarMensaje('Error al cargar registros')
    });
  }

  private mapearRegistros(registrosBackend: any[]): RegistroArido[] {
    return registrosBackend.map(registro => {
      const proyecto = this.proyectos.find(p => p.id === registro.proyecto_id);
      const operario = this.operarios.find(o => o.id === registro.usuario_id);
      const arido = this.aridos.find(a => a.nombre.toLowerCase() === registro.tipo_arido.toLowerCase());

      return {
        id: registro.id,
        proyectoId: registro.proyecto_id,
        proyectoNombre: proyecto ? proyecto.nombre : 'Proyecto no encontrado',
        aridoId: arido ? arido.id : 1,
        aridoNombre: arido ? arido.nombre : registro.tipo_arido,
        cantidad: registro.cantidad,
        fechaEntrega: new Date(registro.fecha_entrega),
        operario: operario ? operario.nombre : 'Operario no encontrado',
        observaciones: registro.observaciones || ''
      };
    });
  }

  // Métodos de filtrado
  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  aplicarFiltros(): void {
    this.registrosFiltrados = this.registros.filter(registro => {
      // Filtro por proyecto
      if (this.filtroProyecto && registro.proyectoId.toString() !== this.filtroProyecto) {
        return false;
      }

      // Filtro por árido
      if (this.filtroArido && registro.aridoId.toString() !== this.filtroArido) {
        return false;
      }

      // Filtro por operario
      if (this.filtroOperario && !registro.operario.toLowerCase().includes(this.filtroOperario.toLowerCase())) {
        return false;
      }

      // Filtro por fecha desde
      if (this.filtroFechaDesde) {
        const fechaDesde = new Date(this.filtroFechaDesde);
        fechaDesde.setHours(0, 0, 0, 0);
        const fechaRegistro = new Date(registro.fechaEntrega);
        fechaRegistro.setHours(0, 0, 0, 0);
        if (fechaRegistro < fechaDesde) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (this.filtroFechaHasta) {
        const fechaHasta = new Date(this.filtroFechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        const fechaRegistro = new Date(registro.fechaEntrega);
        if (fechaRegistro > fechaHasta) {
          return false;
        }
      }

      return true;
    });
  }

  limpiarFiltros(): void {
    this.filtroProyecto = '';
    this.filtroArido = '';
    this.filtroOperario = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.aplicarFiltros();
  }

  hayFiltrosActivos(): boolean {
    return !!(this.filtroProyecto || this.filtroArido || this.filtroOperario || 
              this.filtroFechaDesde || this.filtroFechaHasta);
  }

  actualizarRegistrosFiltrados(): void {
    this.aplicarFiltros();
  }

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

    const operarioSeleccionado = this.operarios.find(op => op.nombre === registro.operario);

    this.registroForm.patchValue({
      proyectoId: registro.proyectoId,
      aridoId: registro.aridoId,
      cantidad: registro.cantidad,
      fechaEntrega: new Date(registro.fechaEntrega).toISOString().split('T')[0],
      operario: operarioSeleccionado ? operarioSeleccionado.id : null,
      observaciones: registro.observaciones || '',
    });

    this.mostrarModal = true;
  }

  confirmarEliminar(registro: RegistroArido): void {
    this.registroAEliminar = registro;
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminar(): void {
    this.registroAEliminar = null;
    this.mostrarModalConfirmacion = false;
  }

  eliminarRegistro(): void {
    if (!this.registroAEliminar) return;

    this.aridosService.eliminarRegistroArido(this.registroAEliminar.id).subscribe({
      next: () => {
        this.cargarDatosReales();
        this.mostrarMensaje('Registro eliminado correctamente');
        this.mostrarModalConfirmacion = false;
        this.registroAEliminar = null;
      },
      error: () => this.mostrarMensaje('Error al eliminar el registro')
    });
  }

  agregarRegistro(): void {
    if (!this.registroForm.valid) return;

    const formData = this.registroForm.value;
    const proyecto = this.proyectos.find(p => p.id === +formData.proyectoId);
    const arido = this.aridos.find(a => a.id === +formData.aridoId);
    const operarioSeleccionado = this.operarios.find(op => op.id === +formData.operario);

    if (!proyecto || !arido || !operarioSeleccionado) {
      this.mostrarMensaje('Error: Proyecto, árido o operario no encontrado');
      return;
    }

    const datosParaBackend = {
      proyecto_id: proyecto.id,
      usuario_id: operarioSeleccionado.id,
      tipo_arido: arido.nombre,
      cantidad: +formData.cantidad,
      fecha_entrega: new Date(formData.fechaEntrega + 'T10:30:00').toISOString(),
    };

    if (this.modoEdicion && this.registroEditandoId) {
      this.aridosService.actualizarRegistroArido(this.registroEditandoId, datosParaBackend)
        .subscribe({
          next: () => {
            this.cargarDatosReales();
            this.mostrarMensaje('Registro actualizado correctamente');
            this.cerrarModal();
          },
          error: () => this.mostrarMensaje('Error al actualizar el registro')
        });
    } else {
      this.aridosService.crearRegistroArido(datosParaBackend)
        .subscribe({
          next: () => {
            this.cargarDatosReales();
            this.mostrarMensaje('Registro creado correctamente');
            this.cerrarModal();
          },
          error: (error) => {
            const mensajeError = error.status === 422 && error.error
              ? `Error de validación: ${JSON.stringify(error.error)}`
              : 'Error al crear el registro';
            this.mostrarMensaje(mensajeError);
          }
        });
    }
  }

  getUnidadMedida(aridoId: number): string {
    const arido = this.aridos.find(a => a.id === aridoId);
    return arido ? arido.unidadMedida : '';
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
}