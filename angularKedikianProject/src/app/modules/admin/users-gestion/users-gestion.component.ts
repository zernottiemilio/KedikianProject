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

// Interfaz de Usuario
interface User {
  id: number;
  nombre: string;
  email: string;
  hash_contrasena?: string;
  estado: boolean;
  roles: string;
  fecha_creacion: Date;
}

// Interfaz para filtros
interface UserFilters {
  id: string;
  nombre: string;
  email: string;
  roles: string;
  estado: any; // Puede ser string o boolean
}

// Servicio Mock para usuarios
class MockUserService {
  private mockUsers: User[] = [
    {
      id: 1,
      nombre: 'Admin Usuario',
      email: 'admin@example.com',
      estado: true,
      roles: 'admin',
      fecha_creacion: new Date('2024-04-15'),
    },
    {
      id: 2,
      nombre: 'Usuario Estándar',
      email: 'usuario@example.com',
      estado: true,
      roles: 'user',
      fecha_creacion: new Date('2024-04-16'),
    },
    {
      id: 3,
      nombre: 'Editor Contenido',
      email: 'editor@example.com',
      estado: false,
      roles: 'editor',
      fecha_creacion: new Date('2024-04-17'),
    },
    {
      id: 4,
      nombre: 'Usuario Test 1',
      email: 'test1@example.com',
      estado: true,
      roles: 'user',
      fecha_creacion: new Date('2024-04-18'),
    },
    {
      id: 5,
      nombre: 'Usuario Test 2',
      email: 'test2@example.com',
      estado: false,
      roles: 'editor',
      fecha_creacion: new Date('2024-04-19'),
    },
  ];

  getUsers(): Observable<User[]> {
    return new Observable<User[]>((observer) => {
      setTimeout(() => {
        observer.next([...this.mockUsers]);
        observer.complete();
      }, 300);
    });
  }

  createUser(userData: Partial<User>): Observable<User> {
    return new Observable<User>((observer) => {
      setTimeout(() => {
        const newUser: User = {
          id: this.mockUsers.length + 1,
          nombre: userData.nombre || '',
          email: userData.email || '',
          estado: userData.estado !== undefined ? userData.estado : true,
          roles: userData.roles || 'user',
          fecha_creacion: new Date(),
        };
        this.mockUsers.push(newUser);
        observer.next(newUser);
        observer.complete();
      }, 300);
    });
  }

  updateUser(userData: Partial<User>): Observable<User> {
    return new Observable<User>((observer) => {
      setTimeout(() => {
        const index = this.mockUsers.findIndex((u) => u.id === userData.id);
        if (index !== -1) {
          this.mockUsers[index] = {
            ...this.mockUsers[index],
            ...userData,
          };
          observer.next(this.mockUsers[index]);
        } else {
          observer.error(new Error('Usuario no encontrado'));
        }
        observer.complete();
      }, 300);
    });
  }

  deleteUser(id: number): Observable<any> {
    return new Observable<any>((observer) => {
      setTimeout(() => {
        const index = this.mockUsers.findIndex((u) => u.id === id);
        if (index !== -1) {
          this.mockUsers.splice(index, 1);
          observer.next({ success: true });
        } else {
          observer.error(new Error('Usuario no encontrado'));
        }
        observer.complete();
      }, 300);
    });
  }
}

// Servicio Mock para mensajes toast
class MockToastrService {
  success(message: string, title?: string): void {
    console.log(
      `%c✓ ${title || 'Success'}: ${message}`,
      'color: green; font-weight: bold'
    );
  }

  error(message: string, title?: string): void {
    console.log(
      `%c✗ ${title || 'Error'}: ${message}`,
      'color: red; font-weight: bold'
    );
  }
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

  // Opciones
  roleOptions = ['admin', 'user', 'editor'];

  // Ordenamiento
  sortColumn = 'id';
  sortDirection = 'asc';

  // Modales
  private userModal: any;
  private deleteConfirmModal: any;

  // Servicios
  private userService = new MockUserService();
  private toastr = new MockToastrService();

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.minLength(8)]],
      roles: ['user', [Validators.required]],
      estado: [true, [Validators.required]],
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
        this.users = users;
        this.applyFilters();
      },
      error: (err) => {
        this.toastr.error('Error al cargar los usuarios', 'Error');
        console.error(err);
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
      filtered = filtered.filter((user) => user.roles === this.filters.roles);
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
          comparison = a.roles.localeCompare(b.roles);
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

  // Métodos para gestión de usuarios
  openAddUserModal(): void {
    this.isEditMode = false;
    this.userForm.reset({
      roles: 'user',
      estado: true,
    });
    this.userForm
      .get('contrasena')
      ?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('contrasena')?.updateValueAndValidity();

    if (this.userModal) {
      this.userModal.show();
    }
  }

  editUser(user: User): void {
    this.isEditMode = true;
    this.userForm.patchValue({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      roles: user.roles,
      estado: user.estado,
    });

    // Eliminar la validación de contraseña para edición
    this.userForm.get('contrasena')?.clearValidators();
    this.userForm.get('contrasena')?.updateValueAndValidity();

    if (this.userModal) {
      this.userModal.show();
    }
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      return;
    }

    const userData = this.userForm.value;

    if (this.isEditMode) {
      this.userService.updateUser(userData).subscribe({
        next: (updatedUser) => {
          this.toastr.success('Usuario actualizado correctamente', 'Éxito');
          this.loadUsers();
          if (this.userModal) {
            this.userModal.hide();
          }
        },
        error: (err) => {
          this.toastr.error('Error al actualizar el usuario', 'Error');
          console.error(err);
        },
      });
    } else {
      this.userService.createUser(userData).subscribe({
        next: (newUser) => {
          this.toastr.success('Usuario creado correctamente', 'Éxito');
          this.loadUsers();
          if (this.userModal) {
            this.userModal.hide();
          }
        },
        error: (err) => {
          this.toastr.error('Error al crear el usuario', 'Error');
          console.error(err);
        },
      });
    }
  }

  deleteUser(user: User): void {
    this.userToDelete = user;
    if (this.deleteConfirmModal) {
      this.deleteConfirmModal.show();
    }
  }

  confirmDelete(): void {
    if (!this.userToDelete) {
      return;
    }

    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.toastr.success('Usuario eliminado correctamente', 'Éxito');
        this.loadUsers();
        if (this.deleteConfirmModal) {
          this.deleteConfirmModal.hide();
        }
      },
      error: (err) => {
        this.toastr.error('Error al eliminar el usuario', 'Error');
        console.error(err);
      },
      complete: () => {
        this.userToDelete = null;
      },
    });
  }
}
