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

interface Project {
  id: number;
  nombre: string;
  description: string;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  estado: boolean; // true = activo, false = inactivo
  progress: number;
  manager: string;
  fecha_creacion: Date;
  contrato_id: number;
  ubicacion: string;
  images?: string[]; // URLs de las imágenes
}

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

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  initForm(): void {
    this.projectForm = this.fb.group({
      id: [null],
      nombre: ['', Validators.required],
      description: ['', Validators.required],
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
    });
  }

  ngOnInit(): void {
    // Cargar contratos simulados
    this.loadContratos();

    // Cargar proyectos simulados
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
    // Simular datos que vendrían de la base de datos
    this.projects = [
      {
        id: 1,
        nombre: 'Construcción Carretera Norte',
        description:
          'Proyecto de construcción y ampliación de la carretera norte para mejorar la conectividad entre poblaciones rurales.',
        startDate: new Date(2025, 3, 1),
        endDate: new Date(2025, 5, 6),
        daysRemaining: 12,
        estado: true,
        progress: 75,
        manager: 'Carlos Rodríguez',
        fecha_creacion: new Date(2025, 2, 15),
        contrato_id: 1,
        ubicacion: 'Sector Norte, Km 45',
        images: [
          'https://via.placeholder.com/800x600?text=Imagen+Carretera+1',
          'https://via.placeholder.com/800x600?text=Imagen+Carretera+2',
        ],
      },
      {
        id: 2,
        nombre: 'Urbanización Los Pinos',
        description:
          'Desarrollo urbano en el sector sur con 120 viviendas y áreas verdes comunitarias.',
        startDate: new Date(2025, 2, 15),
        endDate: new Date(2025, 6, 20),
        daysRemaining: 25,
        estado: true,
        progress: 50,
        manager: 'María González',
        fecha_creacion: new Date(2025, 1, 10),
        contrato_id: 3,
        ubicacion: 'Sector Sur, Parcela 23',
        images: [
          'https://via.placeholder.com/800x600?text=Urbanización+1',
          'https://via.placeholder.com/800x600?text=Urbanización+2',
          'https://via.placeholder.com/800x600?text=Urbanización+3',
        ],
      },
      {
        id: 3,
        nombre: 'Canalización Río Sur',
        description:
          'Obras de canalización y protección del cauce del río para prevenir inundaciones en la zona.',
        startDate: new Date(2025, 3, 10),
        endDate: new Date(2025, 4, 30),
        daysRemaining: 5,
        estado: true,
        progress: 90,
        manager: 'Juan Pérez',
        fecha_creacion: new Date(2025, 2, 5),
        contrato_id: 2,
        ubicacion: 'Cuenca del Río Sur, Sección B4',
        images: ['https://via.placeholder.com/800x600?text=Río+Sur+1'],
      },
      {
        id: 4,
        nombre: 'Renovación Edificio Municipal',
        description:
          'Proyecto de renovación y modernización de las instalaciones del edificio municipal central.',
        startDate: new Date(2024, 10, 12),
        endDate: new Date(2025, 3, 15),
        daysRemaining: -10,
        estado: false,
        progress: 100,
        manager: 'Laura Martínez',
        fecha_creacion: new Date(2024, 9, 30),
        contrato_id: 4,
        ubicacion: 'Centro de la Ciudad, Plaza Principal',
        images: [
          'https://via.placeholder.com/800x600?text=Edificio+1',
          'https://via.placeholder.com/800x600?text=Edificio+2',
        ],
      },
    ];

    this.filteredProjects = [...this.projects];
  }

  calculateDaysRemaining(): void {
    const today = new Date();
    this.projects.forEach((project) => {
      const diffTime = project.endDate.getTime() - today.getTime();
      project.daysRemaining = Math.ceil(diffTime / (1000 * 3600 * 24));
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
      const startDate = new Date(formValues.startDate);
      const endDate = new Date(formValues.endDate);

      // Calcular días restantes
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 3600 * 24));

      if (this.isEditing && formValues.id) {
        // Actualizar proyecto existente
        const index = this.projects.findIndex((p) => p.id === formValues.id);
        if (index !== -1) {
          // Mantener imágenes existentes y añadir nuevas si las hay
          const existingImages = this.projects[index].images || [];
          const newImages: string[] = [...existingImages];

          // Simular carga de nuevas imágenes
          if (this.selectedFiles.length > 0) {
            this.selectedFiles.forEach((file) => {
              // En un entorno real, aquí subiríamos la imagen y obtendríamos una URL
              const fakeImageUrl = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
                file.name
              )}`;
              newImages.push(fakeImageUrl);
            });
          }

          this.projects[index] = {
            ...formValues,
            id: formValues.id,
            startDate: startDate,
            endDate: endDate,
            daysRemaining: daysRemaining,
            fecha_creacion: this.projects[index].fecha_creacion,
            images: newImages,
          };

          // Si el proyecto actualizado es el seleccionado actualmente, actualizarlo también
          if (
            this.selectedProject &&
            this.selectedProject.id === formValues.id
          ) {
            this.selectedProject = { ...this.projects[index] };
          }
        }
      } else {
        // Crear nuevo proyecto
        const newImages: string[] = [];

        // Simular carga de imágenes
        if (this.selectedFiles.length > 0) {
          this.selectedFiles.forEach((file) => {
            // En un entorno real, aquí subiríamos la imagen y obtendríamos una URL
            const fakeImageUrl = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
              file.name
            )}`;
            newImages.push(fakeImageUrl);
          });
        }

        const newProject: Project = {
          id: this.getNextId(),
          nombre: formValues.nombre,
          description: formValues.description,
          startDate: startDate,
          endDate: endDate,
          daysRemaining: daysRemaining,
          estado: formValues.estado,
          progress: formValues.progress,
          manager: formValues.manager,
          fecha_creacion: new Date(),
          contrato_id: formValues.contrato_id,
          ubicacion: formValues.ubicacion,
          images: newImages.length > 0 ? newImages : undefined,
        };

        this.projects.push(newProject);
      }

      // Actualizar listado filtrado y paginación
      this.filterProjects();
      this.calculateTotalPages();
      this.showAddForm = false;
      this.isEditing = false;
      this.clearImagePreviews();
    }
  }

  getNextId(): number {
    return Math.max(...this.projects.map((p) => p.id), 0) + 1;
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
      description: project.description,
      startDate: this.formatDateForInput(project.startDate),
      endDate: this.formatDateForInput(project.endDate),
      manager: project.manager,
      estado: project.estado,
      progress: project.progress,
      ubicacion: project.ubicacion,
      contrato_id: project.contrato_id,
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
      this.projects = this.projects.filter((project) => project.id !== id);

      if (this.selectedProject && this.selectedProject.id === id) {
        this.selectedProject = null;
      }

      this.filterProjects();
      this.calculateTotalPages();
    }
  }

  updateProjectProgress(project: Project, progress: number): void {
    // Actualizar en la lista de proyectos
    const index = this.projects.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      this.projects[index].progress = Number(progress);
    }

    // Actualizar en el proyecto seleccionado
    if (this.selectedProject && this.selectedProject.id === project.id) {
      this.selectedProject.progress = Number(progress);
    }
  }

  toggleProjectStatus(project: Project): void {
    // Invertir el estado
    project.estado = !project.estado;

    // Actualizar en la lista de proyectos
    const index = this.projects.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      this.projects[index].estado = project.estado;
    }

    // Volver a aplicar filtros si corresponde
    this.filterProjects();
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
    if (days <= 5) return 'priority-high';
    if (days <= 15) return 'priority-medium';
    return 'priority-normal';
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
}
