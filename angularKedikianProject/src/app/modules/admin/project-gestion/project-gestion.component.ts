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
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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

  // Visor de contrato
  showContratoViewer: boolean = false;
  currentContratoUrl: SafeUrl | null = null;

  // Archivo de contrato seleccionado
  contratoFile: File | null = null;
  contratoPreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private sanitizer: DomSanitizer
  ) {
    this.initForm();
  }

  initForm(): void {
    this.projectForm = this.fb.group({
      id: [null],
      nombre: ['', Validators.required],
      startDate: ['', Validators.required],
      manager: ['', Validators.required],
      estado: [true],
      ubicacion: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadProjects();
    this.filterProjects();
    this.calculateTotalPages();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        console.log('Datos originales del backend:', projects);
        
        this.projects = projects.map(project => {
          const defaultProject = {
            description: 'Sin descripción',
            startDate: new Date(),
            manager: 'Sin asignar',
          };

          const mappedProject = {
            ...defaultProject,
            ...project,
            description: project.descripcion || project.description || defaultProject.description,
            contrato_id: project.contrato_id ?? undefined,
            contrato_url: project.contrato_url,
            contrato_nombre: project.contrato_nombre,
            startDate: project.fecha_inicio ? new Date(project.fecha_inicio) : 
                      project.startDate ? new Date(project.startDate) : defaultProject.startDate,
            endDate: project.fecha_fin ? new Date(project.fecha_fin) : 
                    project.endDate ? new Date(project.endDate) : undefined,
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
      this.clearContratoFile();
    }
  }

  saveProject(): void {
    if (this.projectForm.valid) {
      const formValues = this.projectForm.value;
      console.log('Valores del formulario:', formValues);
      
      const startDate = new Date(formValues.startDate);

      if (this.isEditing && formValues.id) {
        // Actualizar proyecto existente
        const projectToUpdate: any = {
          id: formValues.id,
          nombre: formValues.nombre,
          startDate: formValues.startDate, // Enviar como string directamente
          estado: formValues.estado,
          manager: formValues.manager,
          ubicacion: formValues.ubicacion,
          description: formValues.description,
        };

        console.log('Datos a enviar al backend:', projectToUpdate);

        this.projectService.updateProject(projectToUpdate as unknown as Project, this.contratoFile || undefined).subscribe({
          next: () => {
            this.loadProjects();
            this.mostrarMensaje('Proyecto actualizado correctamente');
            this.showAddForm = false;
            this.isEditing = false;
            this.clearAllFiles();
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
          estado: formValues.estado,
          gerente: formValues.manager,
          ubicacion: formValues.ubicacion,
          descripcion: formValues.description,
        };

        console.log('Datos a enviar al backend:', newProject);

        this.projectService.createProject(newProject, this.contratoFile || undefined).subscribe({
          next: () => {
            this.loadProjects();
            this.mostrarMensaje('Proyecto creado correctamente');
            this.showAddForm = false;
            this.isEditing = false;
            this.clearAllFiles();
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
    this.clearAllFiles();

    this.projectForm.patchValue({
      id: project.id,
      nombre: project.nombre,
      startDate: this.formatDateForInput(project.startDate),
      manager: project.manager,
      estado: project.estado,
      ubicacion: project.ubicacion,
      description: project.description,
    });

    // Si el proyecto tiene contrato, mostrar preview
    if (project.contrato_url) {
      this.contratoPreviewUrl = project.contrato_url;
    }
  }

  formatDateForInput(date: Date): string {
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
      if (this.filterStatus !== 'all') {
        const estadoFilter = this.filterStatus === 'true';
        if (project.estado !== estadoFilter) {
          return false;
        }
      }

      if (
        this.searchTerm &&
        !project.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
        !project.manager.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
        !project.ubicacion.toLowerCase().includes(this.searchTerm.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

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

  // Manejo de archivo de contrato
  onContratoFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];
  
      if (allowedTypes.includes(file.type)) {
        this.contratoFile = file;
  
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.contratoPreviewUrl = e.target.result;
          };
          reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.contratoPreviewUrl = e.target.result;
          };
          reader.readAsDataURL(file);
        } else {
          this.contratoPreviewUrl = null;
        }
  
      } else {
        this.mostrarMensaje('Solo se permiten archivos PDF, DOC, DOCX o imágenes');
      }
    }
  }

  removeContratoFile(): void {
    this.contratoFile = null;
    this.contratoPreviewUrl = null;
  }

  clearContratoFile(): void {
    this.contratoFile = null;
    this.contratoPreviewUrl = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadContratoFromServer(proyectoId: number, nombreArchivo: string): void {
    this.projectService.downloadContrato(proyectoId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo || 'contrato.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.mostrarMensaje('Contrato descargado correctamente');
      },
      error: (error) => {
        console.error('Error al descargar contrato:', error);
        this.mostrarMensaje('Error al descargar el contrato');
      }
    });
  }

  // Variables adicionales para el visor
  currentContratoTipo: string = '';
  currentContratoNombre: string = '';
  currentProyectoId: number = 0;

  // Visor de contrato
  viewContratoById(proyectoId: number): void {
    // Buscar el proyecto para obtener info del contrato
    const proyecto = this.projects.find(p => p.id === proyectoId);
    if (!proyecto) {
      this.mostrarMensaje('Proyecto no encontrado');
      return;
    }

    this.currentProyectoId = proyectoId;
    this.currentContratoTipo = proyecto.contrato_tipo || '';
    this.currentContratoNombre = proyecto.contrato_nombre || 'contrato';

    // Solo intentar cargar en iframe si es PDF o imagen
    if (this.currentContratoTipo === 'application/pdf' || this.currentContratoTipo?.startsWith('image/')) {
      this.projectService.downloadContrato(proyectoId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          this.currentContratoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          this.showContratoViewer = true;
        },
        error: (error) => {
          console.error('Error al cargar contrato:', error);
          this.mostrarMensaje('Error al cargar el contrato');
        }
      });
    } else {
      // Para DOCX y otros formatos, solo mostrar el modal sin cargar
      this.currentContratoUrl = null;
      this.showContratoViewer = true;
    }
  }

  closeContratoViewer(): void {
    this.showContratoViewer = false;
    if (this.currentContratoUrl) {
      this.currentContratoUrl = null;
    }
  }

  // Manejo de imágenes
  onImagesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.match('image.*')) {
          this.selectedFiles.push(file);

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

  clearAllFiles(): void {
    this.clearImagePreviews();
    this.clearContratoFile();
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