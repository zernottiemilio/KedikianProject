import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import Modal from 'bootstrap/js/dist/modal';
import { UserService } from '../../../core/services/user.service';

// Interfaz de Usuario
interface User {
  id: number;
  nombre: string;
  email: string;
  hash_contrasena?: string;
  estado: boolean;
  roles: ['ADMINISTRADOR'] | ['OPERARIO'];
  fecha_creacion: Date;
}

// Interfaz para filtros
interface UserFilters {
  id: string;
  nombre: string;
  email: string;
  roles: string;
  estado: any;
}

@Component({
  selector: 'app-users-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users-gestion.component.html',
  styleUrls: ['./users-gestion.component.css'],
})
export class UsersGestionComponent implements OnInit {
  // Usuarios
  users: User[] = [];
  filteredUsers: User[] = [];

  // Formulario
  userForm: FormGroup;
  isEditMode = false;
  userToDelete: User | null = null;

  // Filtros
  searchTerm = '';
  filters: UserFilters = {
    id: '',
    nombre: '',
    email: '',
    roles: '',
    estado: '',
  };

  // Paginación
  itemsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  // Opciones de roles disponibles
  roleOptions = ['ADMINISTRADOR', 'OPERARIO'] as const;

  // Ordenamiento
  sortColumn = 'id';
  sortDirection = 'asc';

  // Modales
  private userModal: any;
  private deleteConfirmModal: any;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  modalOverlayActive = false;
  private originalUser: User | null = null;

  // Función para mapear roles al formato del backend
  private mapRolesToBackend(roles: string[]): string[] {
    return roles.map(role => {
      switch (role.toUpperCase()) {
        case 'ADMINISTRADOR':
          return 'admin';
        case 'OPERARIO':
          return 'user';
        default:
          return role.toLowerCase();
      }
    });
  }

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.userForm = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      hash_contrasena: ['', [Validators.minLength(8)]],
      roles: ['OPERARIO', [Validators.required]],
      estado: [[true], [Validators.required]],
      fecha_creacion: [''],
    });
  }

  ngOnInit(): void {
    this.loadUsers();

    // Inicializar los modales de Bootstrap
    this.initModals();
  }

  ngAfterViewInit(): void {
    // Reinicializar modales después de que la vista se haya inicializado
    this.initModals();
  }

  private initModals(): void {
    setTimeout(() => {
      try {
        const userModalEl = document.getElementById('userModal');
        const deleteModalEl = document.getElementById('deleteConfirmModal');

        if (userModalEl) {
          this.userModal = new Modal(userModalEl);
        }

        if (deleteModalEl) {
          this.deleteConfirmModal = new Modal(deleteModalEl);
        }
      } catch (error) {
        console.error('Error inicializando modales:', error);
      }
    }, 100);
  }

  private loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users.map(user => {
          // Normalizar el formato de roles
          let role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
          // Limpiar el string de roles (quitar {}, espacios y otros caracteres)
          role = (role || '').replace(/[{}\s]/g, '').toUpperCase();
          
          return {
            ...user,
            roles: [role as 'ADMINISTRADOR' | 'OPERARIO']
          };
        });
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
      },
    });
  }

  // Métodos de filtrado
  applyFilters(): void {
    let filtered = [...this.users];

    // Filtrar por término de búsqueda rápida
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.nombre.toLowerCase().includes(searchTermLower) ||
          user.email.toLowerCase().includes(searchTermLower) ||
          user.id.toString().includes(searchTermLower)
      );
    }

    // Filtrar por criterios específicos
    if (this.filters.id) {
      filtered = filtered.filter((user) =>
        user.id.toString().includes(this.filters.id)
      );
    }

    if (this.filters.nombre) {
      filtered = filtered.filter((user) =>
        user.nombre.toLowerCase().includes(this.filters.nombre.toLowerCase())
      );
    }

    if (this.filters.email) {
      filtered = filtered.filter((user) =>
        user.email.toLowerCase().includes(this.filters.email.toLowerCase())
      );
    }

    if (this.filters.roles) {
      filtered = filtered.filter((user) =>
        user.roles[0].toLowerCase() === this.filters.roles.toLowerCase()
      );
    }

    if (this.filters.estado !== '') {
      const estadoBoolean =
        this.filters.estado === true || this.filters.estado === 'true';
      filtered = filtered.filter((user) => user.estado === estadoBoolean);
    }

    // Aplicar ordenamiento
    filtered = this.sortUsers(filtered);

    // Aplicar paginación
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredUsers = filtered.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );

    // Asegurar que la página actual es válida
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.goToPage(this.totalPages);
    }
  }

  private sortUsers(users: User[]): User[] {
    return [...users].sort((a, b) => {
      let comparison = 0;

      switch (this.sortColumn) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'nombre':
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'roles':
          comparison = a.roles[0].localeCompare(b.roles[0]);
          break;
        case 'estado':
          comparison = Number(a.estado) - Number(b.estado);
          break;
        case 'fecha_creacion':
          comparison = a.fecha_creacion.getTime() - b.fecha_creacion.getTime();
          break;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    
    this.applyFilters();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filters = {
      id: '',
      nombre: '',
      email: '',
      roles: '',
      estado: '',
    };
    this.applyFilters();
  }

  // Métodos de paginación
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  // Modificar las funciones existentes para usar los nuevos estados
  openEditUserModal(user: User): void {
    this.isEditMode = true;
    this.isEditModalOpen = true;
    this.modalOverlayActive = true;
    this.userForm.patchValue({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      roles: user.roles,
      estado: user.estado,
      fecha_creacion: typeof user.fecha_creacion === 'string'
        ? user.fecha_creacion
        : new Date(user.fecha_creacion).toISOString(),
    });
    this.userForm.get('hash_contrasena')?.clearValidators();
    this.userForm.get('hash_contrasena')?.updateValueAndValidity();
    this.originalUser = user;
  }

  openDeleteModal(user: User): void {
    this.userToDelete = user;
    this.isDeleteModalOpen = true;
    this.modalOverlayActive = true;
  }

  closeModals(): void {
    this.isEditModalOpen = false;
    this.isDeleteModalOpen = false;
    this.modalOverlayActive = false;
    this.userForm.reset();
    this.userToDelete = null;
    this.originalUser = null;
  }

  saveUser(): void {
    if (this.userForm.invalid) return;

    const userData = { ...this.userForm.value };

    // Mapear roles al formato del backend
    userData.roles = this.mapRolesToBackend(
      Array.isArray(userData.roles) ? userData.roles : [userData.roles]
    );

    // Si es edición, enviar el valor original o la fecha actual si no existe
    if (this.isEditMode && this.originalUser) {
      let fechaCreacion: string = '';

      // Prioridad: valor del formulario > valor original > fecha actual
      if (typeof userData.fecha_creacion === 'string' && userData.fecha_creacion.trim() !== '') {
        fechaCreacion = userData.fecha_creacion;
      } else if (this.originalUser.fecha_creacion instanceof Date) {
        fechaCreacion = this.originalUser.fecha_creacion.toISOString();
      } else if (typeof this.originalUser.fecha_creacion === 'string') {
        const fechaStr = this.originalUser.fecha_creacion as string;
        if (fechaStr.trim() !== '') {
          fechaCreacion = fechaStr;
        } else {
          fechaCreacion = new Date().toISOString();
        }
      } else {
        fechaCreacion = new Date().toISOString();
      }

      userData.fecha_creacion = fechaCreacion;
    } else if (!this.isEditMode) {
      userData.fecha_creacion = new Date().toISOString();
    }

    // Última defensa: nunca enviar fecha_creacion vacío
    if (!userData.fecha_creacion || userData.fecha_creacion.trim() === '') {
      userData.fecha_creacion = new Date().toISOString();
    }
    console.log('Usuario a enviar:', userData);

    const operation = this.isEditMode
      ? this.userService.updateUser(userData)
      : this.userService.createUser(userData);

    operation.subscribe({
      next: (response) => {
        const message = this.isEditMode
          ? 'Usuario actualizado correctamente'
          : 'Usuario creado correctamente';
        console.log(message);
        this.loadUsers();
        this.closeModals();
      },
      error: (err) => {
        const action = this.isEditMode ? 'actualizar' : 'crear';
        console.error(`Error al ${action} el usuario:`, err);
        // Aquí podrías mostrar un mensaje de error al usuario usando un servicio de notificaciones
      },
    });
  }

  deleteUser(user: User): void {
    this.userToDelete = user;
    this.openDeleteModal(user);
  }

  confirmDelete(): void {
    if (!this.userToDelete) {
      return;
    }

    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        console.log('Usuario eliminado correctamente');
        this.loadUsers();
        this.closeModals();
      },
      error: (err) => {
        console.error('Error al eliminar el usuario:', err);
        // Aquí podrías mostrar un mensaje de error al usuario usando un servicio de notificaciones
      },
      complete: () => {
        this.userToDelete = null;
      },
    });
  }

  openAddUserModal(): void {
    this.isEditMode = false;
    this.isEditModalOpen = true;
    this.modalOverlayActive = true;
    this.userForm.reset({
      roles: ['OPERARIO'],
      estado: true,
    });
    this.userForm
      .get('hash_contrasena')
      ?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('hash_contrasena')?.updateValueAndValidity();
  }

  editUser(user: User): void {
    this.isEditMode = true;
    this.isEditModalOpen = true;
    this.modalOverlayActive = true;
    this.userForm.patchValue({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      roles: user.roles,
      estado: user.estado,
    });
    this.userForm.get('hash_contrasena')?.clearValidators();
    this.userForm.get('hash_contrasena')?.updateValueAndValidity();
  }

  getDisplayRole(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return 'ADMINISTRADOR';
      case 'user':
      case 'operario':
        return 'OPERARIO';
      default:
        return role;
    }
  }
}
