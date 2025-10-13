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
        
        this.projects = projects.map(project => {
          // Valores por defecto para campos faltantes del backend
          const defaultProject = {
            description: 'Sin descripción',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            manager: 'Sin asignar',
          };

          const mappedProject = {
            ...defaultProject,
            ...project,
            // Mapear campos del backend a campos del frontend
            description: project.descripcion || project.description || defaultProject.description,
            contrato_id: project.contrato_id ?? null,
            startDate: project.fecha_inicio ? new Date(project.fecha_inicio) : 
                      project.startDate ? new Date(project.startDate) : defaultProject.startDate,
            endDate: project.fecha_fin ? new Date(project.fecha_fin) : 
                    project.endDate ? new Date(project.endDate) : defaultProject.endDate,
            manager: project.gerente || project.manager || defaultProject.manager,
            fecha_creacion: project.fecha_creacion ? new Date(project.fecha_creacion) : new Date()
          };
          
          return mappedProject;
        });
        
        console.log('Proyectos mapeados:', this.projects);
        this.filterProjects();
        this.calculateTotalPages();
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        this.mostrarMensaje('Error al cargar proyectos');
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
      
      const startDate = new Date(formValues.startDate);
      const endDate = new Date(formValues.endDate);

      if (this.isEditing && formValues.id) {
        // Actualizar proyecto existente
        const projectToUpdate = {
          id: formValues.id,
          nombre: formValues.nombre,
          fecha_inicio: startDate.toISOString().split('T')[0],
          fecha_fin: endDate.toISOString().split('T')[0],
          estado: formValues.estado,
          gerente: formValues.manager,
          contrato_id: formValues.contrato_id,
          ubicacion: formValues.ubicacion,
          descripcion: formValues.description,
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
          gerente: formValues.manager,
          contrato_id: formValues.contrato_id,
          ubicacion: formValues.ubicacion,
          descripcion: formValues.description,
        };

        console.log('Datos a enviar al backend:', newProject);

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
        const estadoFilter = this.filterStatus === 'true';
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