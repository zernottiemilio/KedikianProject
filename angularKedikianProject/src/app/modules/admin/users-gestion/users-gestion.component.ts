import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { UserService, JornadaLaboral, JornadaLaboralUpdate } from '../../../core/services/user.service';

interface User {
  id: number;
  nombre: string;
  email: string;
  hash_contrasena?: string;
  estado: boolean;
  roles: ['ADMINISTRADOR'] | ['OPERARIO'];
  fecha_creacion: Date | string;
}

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
  users: User[] = [];
  filteredUsers: User[] = [];
  userForm: FormGroup;
  isEditMode = false;
  userToDelete: User | null = null;
  
  searchTerm = '';
  filters: UserFilters = {
    id: '',
    nombre: '',
    email: '',
    roles: '',
    estado: '',
  };

  itemsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  roleOptions = ['ADMINISTRADOR', 'OPERARIO'] as const;

  sortColumn = 'id';
  sortDirection = 'asc';

  isEditModalOpen = false;
  isDeleteModalOpen = false;
  isJornadaModalOpen = false;
  modalOverlayActive = false;
  private originalUser: User | null = null;

  jornadasLaborales: JornadaLaboral[] = [];
  selectedUser: User | null = null;
  loadingJornadas = false;

  // ✅ NUEVAS PROPIEDADES para edición de jornadas
  editingJornadaId: number | null = null;
  jornadaEditForm: FormGroup;
  savingJornada = false;

  changePassword = false;

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

  private mapRolesFromBackend(role: string): 'ADMINISTRADOR' | 'OPERARIO' {
    const cleanRole = (role || '').replace(/[{}\s]/g, '').toLowerCase();
    switch (cleanRole) {
      case 'admin':
      case 'administrador':
        return 'ADMINISTRADOR';
      case 'user':
      case 'operario':
        return 'OPERARIO';
      default:
        return 'OPERARIO';
    }
  }

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.userForm = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      hash_contrasena: [''],
      roles: ['OPERARIO', [Validators.required]],
      estado: [true, [Validators.required]],
      fecha_creacion: [''],
    });

    // ✅ NUEVO: FormGroup para editar jornadas
    this.jornadaEditForm = this.fb.group({
      fecha: ['', [Validators.required]],
      hora_inicio: ['', [Validators.required]],
      hora_fin: [''],
      tiempo_descanso: [0, [Validators.required, Validators.min(0)]],
      es_feriado: [false],
      notas_inicio: [''],
      notas_fin: [''],
      estado: ['completada', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users.map(user => {
          const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
          return {
            ...user,
            roles: [this.mapRolesFromBackend(role as string)]
          };
        });
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        alert('Error al cargar usuarios: ' + err.message);
      },
    });
  }

  private loadJornadasLaborales(usuarioId: number): void {
    this.loadingJornadas = true;
    this.jornadasLaborales = [];
    
    this.userService.getJornadasLaborales(usuarioId).subscribe({
      next: (jornadas) => {
        this.jornadasLaborales = jornadas;
        this.loadingJornadas = false;
      },
      error: (err) => {
        console.error('Error al cargar jornadas laborales:', err);
        this.jornadasLaborales = [];
        this.loadingJornadas = false;
      }
    });
  }

  // ✅ NUEVO: Método para iniciar edición de jornada
  editJornada(jornada: JornadaLaboral): void {
    this.editingJornadaId = jornada.id;
    
    // Extraer fecha y hora de los campos datetime
    const fecha = jornada.fecha.split('T')[0];
    const horaInicio = this.extractTime(jornada.hora_inicio);
    const horaFin = jornada.hora_fin ? this.extractTime(jornada.hora_fin) : '';
    
    this.jornadaEditForm.patchValue({
      fecha: fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      tiempo_descanso: jornada.tiempo_descanso,
      es_feriado: jornada.es_feriado,
      notas_inicio: jornada.notas_inicio || '',
      notas_fin: jornada.notas_fin || '',
      estado: jornada.estado
    });
  }

  // ✅ NUEVO: Método para cancelar edición
  cancelEditJornada(): void {
    this.editingJornadaId = null;
    this.jornadaEditForm.reset();
  }

  // ✅ NUEVO: Método para guardar jornada editada
  saveJornada(jornadaId: number): void {
    if (this.jornadaEditForm.invalid) {
      alert('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    this.savingJornada = true;
    const formData = this.jornadaEditForm.value;

    // Construir los datos para enviar al backend
    const updateData: JornadaLaboralUpdate = {
      fecha: formData.fecha,
      hora_inicio: this.combineDateTime(formData.fecha, formData.hora_inicio),
      hora_fin: formData.hora_fin ? this.combineDateTime(formData.fecha, formData.hora_fin) : null,
      tiempo_descanso: formData.tiempo_descanso,
      es_feriado: formData.es_feriado,
      notas_inicio: formData.notas_inicio || undefined,
      notas_fin: formData.notas_fin || undefined,
      estado: formData.estado
    };

    console.log('Actualizando jornada:', updateData);

    this.userService.updateJornadaLaboral(jornadaId, updateData).subscribe({
      next: (response) => {
        alert('Jornada actualizada correctamente');
        this.editingJornadaId = null;
        this.savingJornada = false;
        // Recargar jornadas
        if (this.selectedUser) {
          this.loadJornadasLaborales(this.selectedUser.id);
        }
      },
      error: (err) => {
        console.error('Error al actualizar jornada:', err);
        alert(`Error al actualizar la jornada: ${err.message}`);
        this.savingJornada = false;
      }
    });
  }

  // ✅ NUEVO: Método auxiliar para extraer hora de un datetime
  private extractTime(datetime: string): string {
    if (!datetime) return '';
    try {
      if (datetime.includes('T')) {
        return datetime.split('T')[1].substring(0, 5);
      }
      return datetime.substring(0, 5);
    } catch (e) {
      return '';
    }
  }

  // ✅ NUEVO: Método auxiliar para combinar fecha y hora
  private combineDateTime(fecha: string, hora: string): string {
    return `${fecha}T${hora}:00`;
  }

  // ✅ NUEVO: Verificar si una jornada está en modo edición
  isEditingJornada(jornadaId: number): boolean {
    return this.editingJornadaId === jornadaId;
  }

  openJornadaModal(user: User): void {
    this.selectedUser = user;
    this.isJornadaModalOpen = true;
    this.modalOverlayActive = true;
    this.editingJornadaId = null; // Resetear edición al abrir modal
    this.loadJornadasLaborales(user.id);
  }

  formatTiempoDescanso(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
  }

  formatFecha(fechaStr: string): string {
    if (!fechaStr) return '-';
    
    const partes = fechaStr.split('T')[0].split('-');
    if (partes.length === 3) {
      const [year, month, day] = partes;
      return `${day}/${month}/${year}`;
    }
    
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatHora(horaStr: string | null): string {
    if (!horaStr) return 'En curso';
    try {
      if (horaStr.includes('T')) {
        const fecha = new Date(horaStr);
        return fecha.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      return horaStr.substring(0, 5);
    } catch (e) {
      return horaStr;
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'activa':
        return 'badge-success';
      case 'completada':
        return 'badge-info';
      case 'pausada':
        return 'badge-warning';
      case 'cancelada':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  applyFilters(): void {
    let filtered = [...this.users];

    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.nombre.toLowerCase().includes(searchTermLower) ||
          user.email.toLowerCase().includes(searchTermLower) ||
          user.id.toString().includes(searchTermLower)
      );
    }

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

    filtered = this.sortUsers(filtered);

    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredUsers = filtered.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );

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
          const fechaA = new Date(a.fecha_creacion).getTime();
          const fechaB = new Date(b.fecha_creacion).getTime();
          comparison = fechaA - fechaB;
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  openDeleteModal(user: User): void {
    this.userToDelete = user;
    this.isDeleteModalOpen = true;
    this.modalOverlayActive = true;
  }

  closeModals(): void {
    this.isEditModalOpen = false;
    this.isDeleteModalOpen = false;
    this.isJornadaModalOpen = false;
    this.modalOverlayActive = false;
    this.changePassword = false;
    this.userForm.reset();
    this.userToDelete = null;
    this.originalUser = null;
    this.selectedUser = null;
    this.jornadasLaborales = [];
    this.editingJornadaId = null; // Resetear edición
    this.jornadaEditForm.reset();
  }

  toggleChangePassword(): void {
    this.changePassword = !this.changePassword;
    const passwordControl = this.userForm.get('hash_contrasena');
    
    if (this.changePassword && this.isEditMode) {
      passwordControl?.setValidators([Validators.required, Validators.minLength(8)]);
      passwordControl?.setValue('');
    } else if (this.isEditMode) {
      passwordControl?.clearValidators();
      passwordControl?.setValue('');
    }
    passwordControl?.updateValueAndValidity();
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      alert('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    const userData = { ...this.userForm.value };

    userData.roles = this.mapRolesToBackend(
      Array.isArray(userData.roles) ? userData.roles : [userData.roles]
    );

    if (this.isEditMode) {
      if (!this.changePassword || !userData.hash_contrasena || userData.hash_contrasena.trim() === '') {
        userData.hash_contrasena = '';
      }
      
      if (this.originalUser) {
        userData.fecha_creacion = this.originalUser.fecha_creacion instanceof Date
          ? this.originalUser.fecha_creacion.toISOString()
          : this.originalUser.fecha_creacion;
      }
    } else {
      if (!userData.hash_contrasena || userData.hash_contrasena.trim() === '') {
        alert('La contraseña es requerida para crear un nuevo usuario.');
        return;
      }
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
        alert(message);
        this.loadUsers();
        this.closeModals();
      },
      error: (err) => {
        const action = this.isEditMode ? 'actualizar' : 'crear';
        console.error(`Error al ${action} el usuario:`, err);
        alert(`Error al ${action} el usuario: ${err.message}`);
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

    console.log('Intentando eliminar usuario:', this.userToDelete.id);

    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        console.log('Usuario eliminado correctamente');
        alert('Usuario eliminado correctamente');
        this.loadUsers();
        this.closeModals();
      },
      error: (err) => {
        console.error('Error al eliminar el usuario:', err);
        alert(`Error al eliminar el usuario: ${err.message}\n\nEsto puede ocurrir si el usuario tiene registros asociados (jornadas laborales, etc.). Verifica que no tenga datos relacionados antes de eliminarlo.`);
        this.closeModals();
      },
      complete: () => {
        this.userToDelete = null;
      },
    });
  }

  openAddUserModal(): void {
    this.isEditMode = false;
    this.changePassword = false;
    this.isEditModalOpen = true;
    this.modalOverlayActive = true;
    this.userForm.reset({
      roles: 'OPERARIO',
      estado: true,
    });
    this.userForm
      .get('hash_contrasena')
      ?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('hash_contrasena')?.updateValueAndValidity();
  }

  editUser(user: User): void {
    this.isEditMode = true;
    this.changePassword = false;
    this.isEditModalOpen = true;
    this.modalOverlayActive = true;
    this.originalUser = { ...user };
    
    this.userForm.patchValue({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      roles: user.roles[0],
      estado: user.estado,
    });
    
    this.userForm.get('hash_contrasena')?.clearValidators();
    this.userForm.get('hash_contrasena')?.setValue('');
    this.userForm.get('hash_contrasena')?.updateValueAndValidity();
  }

  getDisplayRole(role: string): string {
    return this.mapRolesFromBackend(role);
  }

  getTotalHorasRegulares(): number {
    return this.jornadasLaborales.reduce((sum, j) => sum + j.horas_regulares, 0);
  }

  getTotalHorasExtras(): number {
    return this.jornadasLaborales.reduce((sum, j) => sum + j.horas_extras, 0);
  }

  getTotalDiasFeriados(): number {
    return this.jornadasLaborales.filter(j => j.es_feriado).length;
  }

  trackByJornadaId(index: number, jornada: JornadaLaboral): number {
    return jornada.id;
  }
}