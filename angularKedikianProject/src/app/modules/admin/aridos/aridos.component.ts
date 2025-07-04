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

export interface Operario {
  id: number;
  nombre: string;
  email: string;
  estado: boolean;
  roles: string;
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

  // Estado de los modales
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
        // Áridos por defecto
        const aridosPorDefecto: Arido[] = [
          { id: -1, nombre: 'Arena Fina', tipo: 'árido', unidadMedida: 'm3' },
          { id: -2, nombre: 'Granza', tipo: 'árido', unidadMedida: 'm3' },
          { id: -3, nombre: 'Arena Comun', tipo: 'árido', unidadMedida: 'm3' }
        ];
        // Agrega los que no estén ya en la lista
        aridosPorDefecto.forEach(defecto => {
          if (!aridos.some(a => a.nombre === defecto.nombre)) {
            aridos.push(defecto);
          }
        });
        this.aridos = aridos;
      },
      error: (error) => {
        console.error('Error al cargar áridos:', error);
        this.mostrarMensaje('Error al cargar áridos');
        // Si falla la carga, muestra los por defecto
        this.aridos = [
          { id: -1, nombre: 'Arena Fina', tipo: 'árido', unidadMedida: 'm3' },
          { id: -2, nombre: 'Granza', tipo: 'árido', unidadMedida: 'm3' },
          { id: -3, nombre: 'Arena Comun', tipo: 'árido', unidadMedida: 'm3' }
        ];
      }
    });

    // Cargar operarios
    this.userService.getUsers().subscribe({
      next: (usuarios) => {
        console.log('Usuarios cargados:', usuarios);
        // Filtrar solo los usuarios que son operarios y están activos
        this.operarios = usuarios.filter(usuario => {
          console.log('Usuario:', usuario.nombre, 'Roles:', usuario.roles, 'Estado:', usuario.estado);
          
          // Normalizar el formato de roles como en users-gestion
          let role = '';
          if (Array.isArray(usuario.roles)) {
            role = usuario.roles[0] || '';
          } else {
            role = String(usuario.roles || '');
          }
          
          // Limpiar el string de roles (quitar {}, espacios y otros caracteres) y convertir a mayúsculas
          role = (role || '').replace(/[{}\s]/g, '').toUpperCase();
          
          const esOperario = role === 'OPERARIO';
          const estaActivo = Boolean(usuario.estado);
          
          console.log('Roles procesados:', role, 'Es operario:', esOperario, 'Está activo:', estaActivo);
          
          return estaActivo && esOperario;
        });
        console.log('Operarios filtrados:', this.operarios);
      },
      error: (error) => {
        console.error('Error al cargar operarios:', error);
        this.mostrarMensaje('Error al cargar operarios');
      }
    });

    // Cargar registros
    this.aridosService.getRegistrosAridos().subscribe({
      next: (registrosBackend) => {
        console.log('Registros del backend:', registrosBackend);
        this.registros = this.mapearRegistros(registrosBackend);
        console.log('Registros mapeados en el componente:', this.registros);
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

  // Método para mapear registros del backend al formato del frontend
  private mapearRegistros(registrosBackend: any[]): RegistroArido[] {
    return registrosBackend.map(registro => {
      // Buscar el proyecto por ID
      const proyecto = this.proyectos.find(p => p.id === registro.proyecto_id);
      
      // Buscar el operario por ID
      const operario = this.operarios.find(o => o.id === registro.usuario_id);
      
      // Buscar el árido por nombre
      const arido = this.aridos.find(a => a.nombre === registro.tipo_arido);

      return {
        id: registro.id || registro.registro_id,
        proyectoId: registro.proyecto_id,
        proyectoNombre: proyecto ? proyecto.nombre : 'Proyecto no encontrado',
        aridoId: arido ? arido.id : 1,
        aridoNombre: registro.tipo_arido,
        cantidad: registro.cantidad,
        fechaEntrega: new Date(registro.fecha_entrega),
        operario: operario ? operario.nombre : 'Operario no encontrado',
        observaciones: registro.observaciones || ''
      };
    });
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

      // Encontrar el operario seleccionado para obtener su ID
      const operarioSeleccionado = this.operarios.find(op => op.nombre === formData.operario);
      
      if (!operarioSeleccionado) {
        this.mostrarMensaje('Error: Operario no encontrado');
        return;
      }

      // Crear objeto con el formato que espera el backend
      const datosParaBackend = {
        proyecto_id: +formData.proyectoId,
        usuario_id: operarioSeleccionado.id,
        tipo_arido: arido.nombre,
        cantidad: +formData.cantidad,
        fecha_entrega: new Date(formData.fechaEntrega + 'T10:30:00').toISOString(),
      };

      const nuevoRegistro: Omit<RegistroArido, 'id'> = {
        proyectoId: +formData.proyectoId,
        proyectoNombre: proyecto.nombre,
        aridoId: +formData.aridoId,
        aridoNombre: arido.nombre,
        cantidad: +formData.cantidad,
        fechaEntrega: new Date(formData.fechaEntrega + 'T00:00:00'),
        operario: formData.operario,
        observaciones: formData.observaciones || '',
      };

      console.log('=== DATOS DEL FORMULARIO ===');
      console.log('Datos del formulario:', formData);
      console.log('Proyecto encontrado:', proyecto);
      console.log('Árido encontrado:', arido);
      console.log('=== OBJETOS CREADOS ===');
      console.log('Registro completo:', nuevoRegistro);
      console.log('Datos para backend:', datosParaBackend);
      console.log('JSON para backend:', JSON.stringify(datosParaBackend, null, 2));

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
        this.aridosService.crearRegistroArido(datosParaBackend).subscribe({
          next: () => {
            this.cargarDatosReales();
            this.mostrarMensaje('Registro creado correctamente');
            this.cerrarModal();
          },
          error: (error) => {
            console.error('Error al crear registro:', error);
            let mensajeError = 'Error al crear el registro';
            if (error.status === 422 && error.error) {
              mensajeError = `Error de validación: ${JSON.stringify(error.error)}`;
            }
            this.mostrarMensaje(mensajeError);
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
