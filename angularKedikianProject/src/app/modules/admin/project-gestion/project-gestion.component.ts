// project-gestion.component.ts
import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProjectService, Project } from '../../../core/services/project.service';
import { MachinesService, Maquina } from '../../../core/services/machines.service';

interface Contrato {
  id: number;
  nombre: string;
}

interface MaquinaAsignada {
  id: number;
  codigo: string;
  nombre: string;
  estado: boolean;
  horas_uso: number;
  fechaAsignacion: Date;
}

@Component({
  selector: 'app-project-gestion',
  standalone: true,
  imports: [CommonModule, NgClass, FormsModule, ReactiveFormsModule],
  templateUrl: './project-gestion.component.html',
  styleUrls: ['./project-gestion.component.css'],
})
export class ProjectGestionComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  selectedProject: Project | null = null;
  showAddForm = false;
  isEditing = false;
  projectForm!: FormGroup;
  filterStatus: string = 'all';
  searchTerm: string = '';
  imagePreviewUrls: string[] = [];
  selectedFiles: File[] = [];

  // Paginación
  itemsPerPage: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;

  // Visor de imágenes
  showImageViewer: boolean = false;
  currentImage: string = '';
  currentImageIndex: number = 0;

  // Contratos simulados para el select
  contratos: Contrato[] = [];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private machinesService: MachinesService
  ) {
    this.initForm();
  }

  initForm(): void {
    this.projectForm = this.fb.group({
      id: [null],
      nombre: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      manager: ['', Validators.required],
      estado: [true],
      progress: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      ubicacion: ['', Validators.required],
      contrato_id: [null, Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Cargar contratos simulados (por ahora)
    this.loadContratos();
    
    // Cargar proyectos reales desde el backend
    this.loadProjects();

    this.calculateDaysRemaining();
    this.filterProjects();
    this.calculateTotalPages();
  }

  loadContratos(): void {
    // Simular datos de contratos que vendrían de la base de datos
    this.contratos = [
      { id: 1, nombre: 'Contrato Municipal #2025-001' },
      { id: 2, nombre: 'Contrato Estatal #2025-089' },
      { id: 3, nombre: 'Contrato Privado - Empresa ABC' },
      { id: 4, nombre: 'Contrato Gubernamental #2025-123' },
    ];
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        console.log('Datos originales del backend:', projects);
        console.log('Estructura del primer proyecto:', projects[0] ? Object.keys(projects[0]) : 'No hay proyectos');
        
        this.projects = projects.map(project => {
          // Valores por defecto para campos faltantes del backend
          const defaultProject = {
            description: 'Sin descripción',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días desde hoy
            manager: 'Sin asignar',
            progress: 0,
            daysRemaining: 0
          };

          console.log('Proyecto original del backend:', project);
          console.log('Campos disponibles:', Object.keys(project));
          console.log('fecha_inicio:', project.fecha_inicio);
          console.log('fecha_fin:', project.fecha_fin);
          console.log('descripcion:', project.descripcion);
          console.log('gerente:', project.gerente);
          console.log('progreso:', project.progreso);

          const mappedProject = {
            ...defaultProject,
            ...project,
            // Mapear campos del backend a campos del frontend
            description: project.descripcion || project.description || defaultProject.description,
            contrato_id: project.contrato_id ?? null, // Mapeo explícito de contrato_id
            startDate: project.fecha_inicio ? new Date(project.fecha_inicio) : 
                      project.startDate ? new Date(project.startDate) : defaultProject.startDate,
            endDate: project.fecha_fin ? new Date(project.fecha_fin) : 
                    project.endDate ? new Date(project.endDate) : defaultProject.endDate,
            manager: project.gerente || project.manager || defaultProject.manager,
            progress: project.progreso || project.progress || defaultProject.progress,
            fecha_creacion: project.fecha_creacion ? new Date(project.fecha_creacion) : new Date()
          };
          
          console.log('Proyecto mapeado:', mappedProject);
          console.log('Fechas finales:', {
            startDate: mappedProject.startDate,
            endDate: mappedProject.endDate
          });
          return mappedProject;
        });
        
        console.log('Proyectos mapeados:', this.projects);
        this.calculateDaysRemaining();
        this.filterProjects();
        this.calculateTotalPages();
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        this.mostrarMensaje('Error al cargar proyectos');
      }
    });
  }

  calculateDaysRemaining(): void {
    const today = new Date();
    console.log('Fecha actual para cálculo:', today);
    
    this.projects.forEach((project) => {
      try {
        console.log(`Calculando días para proyecto "${project.nombre}":`);
        console.log('- Fecha de inicio:', project.startDate);
        console.log('- Fecha de fin:', project.endDate);
        console.log('- Tipo de fecha de inicio:', typeof project.startDate);
        console.log('- Tipo de fecha de fin:', typeof project.endDate);
        
        // Verificar que las fechas sean válidas
        if (project.startDate && project.endDate && 
            !isNaN(project.startDate.getTime()) && !isNaN(project.endDate.getTime())) {
          
          // Calcular duración total del proyecto (días)
          const totalDuration = Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 3600 * 24));
          
          // Calcular días transcurridos desde el inicio
          const daysElapsed = Math.ceil((today.getTime() - project.startDate.getTime()) / (1000 * 3600 * 24));
          
          // Calcular días restantes
          const daysRemaining = totalDuration - daysElapsed;
          
          // Asegurar que no sea negativo
          project.daysRemaining = Math.max(0, daysRemaining);
          
          // Determinar si el proyecto está atrasado
          project.isOverdue = daysElapsed > totalDuration;
          
          console.log('- Duración total del proyecto:', totalDuration, 'días');
          console.log('- Días transcurridos:', daysElapsed, 'días');
          console.log('- Días restantes:', project.daysRemaining, 'días');
          console.log('- Proyecto atrasado:', project.isOverdue);
          
        } else {
          project.daysRemaining = 0;
          project.isOverdue = false;
          console.warn('- Fechas inválidas para proyecto:', project.nombre);
          if (!project.startDate || isNaN(project.startDate.getTime())) {
            console.warn('  - Fecha de inicio inválida');
          }
          if (!project.endDate || isNaN(project.endDate.getTime())) {
            console.warn('  - Fecha de fin inválida');
          }
        }
      } catch (error) {
        project.daysRemaining = 0;
        project.isOverdue = false;
        console.error('- Error calculando días restantes para proyecto:', project.nombre, error);
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm && !this.isEditing) {
      this.initForm();
      this.clearImagePreviews();
    }
  }

  saveProject(): void {
    if (this.projectForm.valid) {
      const formValues = this.projectForm.value;
      console.log('Valores del formulario:', formValues);
      console.log('Formulario válido:', this.projectForm.valid);
      console.log('Errores del formulario:', this.projectForm.errors);
      
      const startDate = new Date(formValues.startDate);
      const endDate = new Date(formValues.endDate);
      
      console.log('Fechas parseadas:', { startDate, endDate });

      // Calcular días restantes
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 3600 * 24));

      if (this.isEditing && formValues.id) {
        // Actualizar proyecto existente
        const projectToUpdate = {
          id: formValues.id,
          nombre: formValues.nombre,
          fecha_inicio: startDate.toISOString().split('T')[0],
          fecha_fin: endDate.toISOString().split('T')[0],
          estado: formValues.estado,
          progreso: formValues.progress,
          gerente: formValues.manager,
          contrato_id: formValues.contrato_id,
          ubicacion: formValues.ubicacion,
          descripcion: formValues.description, // CAMBIO: antes era 'description'
        };

        console.log('Datos a enviar al backend:', projectToUpdate);

        this.projectService.updateProject(projectToUpdate as unknown as Project).subscribe({
          next: () => {
            this.loadProjects();
            this.mostrarMensaje('Proyecto actualizado correctamente');
            this.showAddForm = false;
            this.isEditing = false;
            this.clearImagePreviews();
          },
          error: (error) => {
            console.error('Error al actualizar proyecto:', error);
            this.mostrarMensaje('Error al actualizar el proyecto');
          }
        });
      } else {
        // Crear nuevo proyecto
        const newProject = {
          nombre: formValues.nombre,
          fecha_inicio: startDate.toISOString().split('T')[0],
          fecha_fin: endDate.toISOString().split('T')[0],
          estado: formValues.estado,
          progreso: formValues.progress,
          gerente: formValues.manager,
          contrato_id: formValues.contrato_id,
          ubicacion: formValues.ubicacion,
          descripcion: formValues.description, // CAMBIO: antes era 'description'
        };

        console.log('Datos a enviar al backend:', newProject);
        console.log('Datos a enviar al backend (JSON):', JSON.stringify(newProject, null, 2));

        this.projectService.createProject(newProject).subscribe({
          next: () => {
            this.loadProjects();
            this.mostrarMensaje('Proyecto creado correctamente');
            this.showAddForm = false;
            this.isEditing = false;
            this.clearImagePreviews();
          },
          error: (error) => {
            console.error('Error al crear proyecto:', error);
            this.mostrarMensaje('Error al crear el proyecto');
          }
        });
      }
    } else {
      console.error('Formulario inválido:', this.projectForm.errors);
      console.error('Estado de los campos:');
      Object.keys(this.projectForm.controls).forEach(key => {
        const control = this.projectForm.get(key);
        console.error(`- ${key}:`, {
          value: control?.value,
          valid: control?.valid,
          errors: control?.errors
        });
      });
    }
  }

  selectProject(project: Project): void {
    this.selectedProject = { ...project };
  }

  editProject(project: Project): void {
    this.isEditing = true;
    this.showAddForm = true;
    this.clearImagePreviews();

    // Llenar el formulario con los datos del proyecto
    this.projectForm.patchValue({
      id: project.id,
      nombre: project.nombre,
      startDate: this.formatDateForInput(project.startDate),
      endDate: this.formatDateForInput(project.endDate),
      manager: project.manager,
      estado: project.estado,
      progress: project.progress,
      ubicacion: project.ubicacion,
      contrato_id: project.contrato_id,
      description: project.description,
    });
  }

  formatDateForInput(date: Date): string {
    // Convertir fecha a formato YYYY-MM-DD para inputs date
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  closeProjectDetails(): void {
    this.selectedProject = null;
  }

  deleteProject(id: number): void {
    if (confirm('¿Está seguro que desea eliminar este proyecto?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          this.loadProjects();
          this.mostrarMensaje('Proyecto eliminado correctamente');
          if (this.selectedProject && this.selectedProject.id === id) {
            this.selectedProject = null;
          }
        },
        error: (error) => {
          console.error('Error al eliminar proyecto:', error);
          this.mostrarMensaje('Error al eliminar el proyecto');
        }
      });
    }
  }

  updateProjectProgress(project: Project, progress: number): void {
    const projectToUpdate = { ...project, progress: Number(progress) };
    
    this.projectService.updateProject(projectToUpdate).subscribe({
      next: () => {
        this.loadProjects();
        this.mostrarMensaje('Progreso actualizado correctamente');
      },
      error: (error) => {
        console.error('Error al actualizar progreso:', error);
        this.mostrarMensaje('Error al actualizar progreso');
      }
    });
  }

  toggleProjectStatus(project: Project): void {
    const projectToUpdate = { ...project, estado: !project.estado };
    
    this.projectService.updateProject(projectToUpdate).subscribe({
      next: () => {
        this.loadProjects();
        this.mostrarMensaje('Estado del proyecto actualizado correctamente');
      },
      error: (error) => {
        console.error('Error al actualizar estado:', error);
        this.mostrarMensaje('Error al actualizar estado del proyecto');
      }
    });
  }

  filterProjects(): void {
    this.filteredProjects = this.projects.filter((project) => {
      // Filtrar por estado (activo/inactivo)
      if (this.filterStatus !== 'all') {
        const estadoFilter = this.filterStatus === 'true'; // Convertir string a boolean
        if (project.estado !== estadoFilter) {
          return false;
        }
      }

      // Filtrar por término de búsqueda
      if (
        this.searchTerm &&
        !project.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
        !project.manager
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) &&
        !project.ubicacion.toLowerCase().includes(this.searchTerm.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    // Aplicar paginación
    this.calculateTotalPages();
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(
      this.filteredProjects.length / this.itemsPerPage
    );
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get paginatedProjects(): Project[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProjects.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.filterProjects();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.filterProjects();
  }

  getStatusClass(status: boolean): string {
    return status ? 'status-active' : 'status-inactive';
  }

  getDaysPriorityClass(days: number): string {
    if (days <= 0) return 'days-overdue';
    if (days <= 7) return 'days-urgent';
    if (days <= 30) return 'days-warning';
    return 'days-normal';
  }

  getContratoNombre(contratoId: number): string {
    const contrato = this.contratos.find((c) => c.id === contratoId);
    return contrato ? contrato.nombre : `Contrato #${contratoId}`;
  }

  // Manejo de imágenes
  onImagesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Validar que sea una imagen
        if (file.type.match('image.*')) {
          this.selectedFiles.push(file);

          // Crear URL para previsualización
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.imagePreviewUrls.push(e.target.result);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }

  removeImage(index: number): void {
    this.imagePreviewUrls.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  clearImagePreviews(): void {
    this.imagePreviewUrls = [];
    this.selectedFiles = [];
  }

  // Visor de imágenes
  openImageViewer(index: number): void {
    if (this.selectedProject && this.selectedProject.images) {
      this.currentImageIndex = index;
      this.currentImage = this.selectedProject.images[index];
      this.showImageViewer = true;
    }
  }

  closeImageViewer(): void {
    this.showImageViewer = false;
  }

  nextImage(): void {
    if (
      this.selectedProject &&
      this.selectedProject.images &&
      this.currentImageIndex < this.selectedProject.images.length - 1
    ) {
      this.currentImageIndex++;
      this.currentImage = this.selectedProject.images[this.currentImageIndex];
    }
  }

  previousImage(): void {
    if (this.currentImageIndex > 0 && this.selectedProject?.images) {
      this.currentImageIndex--;
      this.currentImage = this.selectedProject.images[this.currentImageIndex];
    }
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
