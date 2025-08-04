import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  InformesService,
  Informe,
  ResumenDatos,
} from '../../../core/services/informes.service';
// Importar el nuevo servicio de proyectos
import {Project, ProyectosPaginadosResponse} from '../../../core/services/project.service';
import { ProjectService} from '../../../core/services/project.service';

interface Resumen {
  proyectosActivos: number;
  horasTotales: number;
  materialesEntregados: string;
  gastoCombustible: string;
}

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css'],
})
export class InformesComponent implements OnInit {
  // Propiedades existentes
  informes: Informe[] = [];
  filtroTipo: string = 'todos';
  cargando: boolean = false;
  guardando: boolean = false;
  resumen: Resumen = {
    proyectosActivos: 0,
    horasTotales: 0,
    materialesEntregados: '0 m³',
    gastoCombustible: '$0',
  };

  // Nuevas propiedades para proyectos
  proyectos: Project[] = [];
  proyectosCargando: boolean = false;
  paginaActual: number = 0;
  elementosPorPagina: number = 15;
  totalProyectos: number = 0;
  
  // Propiedades para el modal
  mostrarModal = false;
  informeForm: FormGroup;

  constructor(
    private informesService: InformesService,
    private proyectosService: ProjectService, // Inyectar el nuevo servicio
    private fb: FormBuilder
  ) {
    this.informeForm = this.fb.group({
      titulo: ['', Validators.required],
      tipo: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      descripcion: [''],
      valor: [0, [Validators.required, Validators.min(0)]],
    });

    // Inicializar con algunos informes de ejemplo
    this.informes = [
      {
        id: 1,
        titulo: 'Informe de Gastos Q1',
        tipo: 'gastos',
        descripcion: 'Resumen de gastos del primer trimestre',
        fecha: '2025-03-31',
        estatus: 'completado',
      },
      {
        id: 2,
        titulo: 'Registro de Horas Abril',
        tipo: 'horas',
        descripcion: 'Horas registradas por operarios',
        fecha: '2025-04-30',
        estatus: 'pendiente',
      },
    ];
    this.aplicarFiltros();
  }

  ngOnInit(): void {
    this.cargarInformes();
    this.cargarDatosResumen(); // Cargar proyectos paginados
    this.cargarCantidadProyectosActivos(); // Cargar cantidad de proyectos activos
    this.cargarHorasMesActual
    this.aplicarFiltros();
  }

  /**
   * Cargar la cantidad de proyectos activos desde el backend
   */
  cargarCantidadProyectosActivos(): void {
    this.proyectosService.getCantidadProyectosActivos().subscribe({
      next: (response) => {
        // Actualizar el resumen con la cantidad real de proyectos activos
        this.resumen.proyectosActivos = response.cantidad_activos;
        console.log('Cantidad de proyectos activos:', response.cantidad_activos);
      },
      error: (error) => {
        console.error('Error al cargar cantidad de proyectos activos:', error);
        // Mantener el valor por defecto o mostrar un mensaje de error
        alert('Error al cargar la cantidad de proyectos activos.');
      }
    });
  }

   // Agrega este nuevo método
   cargarHorasMesActual(): void {
    this.informesService.getHorasMesActual().subscribe({
      next: (response) => {
        this.resumen.horasTotales = response.total_horas_mes_actual;
        console.log('Horas del mes actual:', response.total_horas_mes_actual);
      },
      error: (error) => {
        console.error('Error al cargar horas del mes actual:', error);
        // Mantener el valor por defecto o mostrar mensaje de error
        alert('Error al cargar las horas trabajadas este mes.');
      }
    });
  }

  // Resto de métodos existentes...
  generarInformePersonalizado(formulario: any): void {
    const parametros = {
      tipo: formulario.tipo,
      fechaInicio: formulario.fechaInicio,
      fechaFin: formulario.fechaFin,
      proyectoId: formulario.proyecto ? formulario.proyecto.id : undefined,
      incluirGraficos: formulario.incluirGraficos,
    };

    this.informesService.generarInformePersonalizado(parametros).subscribe({
      next: (informe) => {
        alert(`Informe "${informe.titulo}" generado correctamente.`);
      },
      error: (error) => {
        console.error('Error:', error);
        alert('Error al generar el informe. Por favor, inténtelo de nuevo.');
      },
    }); 
  }

  cargarInformes(): void {
    this.cargando = true;
    this.informesService.getInformes().subscribe({
      next: (data) => {
        this.informes = data.informes;
        // No sobrescribir el resumen aquí, ya que se actualiza desde otros métodos
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar informes:', error);
        this.cargando = false;
        alert('Error al cargar los informes. Por favor, intente nuevamente.');
      },
    });
  }

  get informesFiltrados(): Informe[] {
    return this.filtroTipo === 'todos'
      ? this.informes
      : this.informes.filter((informe) => informe.tipo === this.filtroTipo);
  }

  descargarInforme(id: number): void {
    this.informesService.descargarInforme(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `informe-${id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar:', error);
        alert('Error al descargar el informe. Por favor, inténtelo de nuevo.');
      },
    });
  }

  getColorEstatus(estatus: string): string {
    switch (estatus) {
      case 'completado':
        return 'estatus-completado';
      case 'pendiente':
        return 'estatus-pendiente';
      case 'en-proceso':
        return 'estatus-en-proceso';
      default:
        return 'estatus-default';
    }
  }

  getNombreEstatus(estatus: string): string {
    switch (estatus) {
      case 'completado':
        return 'Completado';
      case 'pendiente':
        return 'Pendiente';
      case 'en-proceso':
        return 'En proceso';
      default:
        return 'Desconocido';
    }
  }

  getClaseIcono(tipo: string): string {
    return tipo === 'estadisticas' ? 'icono-estadistica' : 'icono-reporte';
  }

  generarNuevoInforme(): void {
    this.mostrarModal = true;
    this.informeForm.reset();
  }

  cerrarModal(event: MouseEvent): void {
    if (event) {
      event.preventDefault();
    }
    this.mostrarModal = false;
    this.informeForm.reset();
  }

  guardarInforme(): void {
    if (this.informeForm.invalid) {
      return;
    }

    this.guardando = true;
    const formData = this.informeForm.value;
    const nuevoInforme: Omit<Informe, 'id'> = {
      titulo: formData.titulo,
      tipo: formData.tipo,
      descripcion: formData.descripcion || '',
      fecha: new Date().toISOString().split('T')[0],
      estatus: 'pendiente' as const,
      valor: formData.valor,
    };

    this.informesService.crearInforme(nuevoInforme).subscribe({
      next: (informeCreado) => {
        this.informes.unshift(informeCreado);

        if (informeCreado.valor !== undefined) {
          this.actualizarResumen(informeCreado.tipo, informeCreado.valor);
        }

        this.cerrarModal(null as any);
        alert(`El informe "${informeCreado.titulo}" ha sido creado exitosamente.`);
      },
      error: (error) => {
        console.error('Error al crear el informe:', error);
        alert('Error al crear el informe. Por favor, inténtelo de nuevo.');
      },
      complete: () => {
        this.guardando = false;
      },
    });
  }

  private cargarDatosResumen(): void {
    // Los proyectos activos ahora se cargan desde el endpoint
    // Solo inicializar los otros valores aquí
    this.resumen.horasTotales = 456;
    this.resumen.materialesEntregados = '1,234 m³';
    this.resumen.gastoCombustible = '$5,678';
  }

  actualizarResumen(tipo: string, valor: number): void {
    switch (tipo) {
      case 'proyectos':
        this.resumen.proyectosActivos += 1;
        break;
      case 'horas':
        this.resumen.horasTotales += valor;
        break;
      case 'materiales':
        const materialesActuales =
          parseFloat(this.resumen.materialesEntregados) || 0;
        this.resumen.materialesEntregados = `${materialesActuales + valor} m³`;
        break;
      case 'combustible':
        const gastoActual =
          parseFloat(this.resumen.gastoCombustible.replace('$', '')) || 0;
        this.resumen.gastoCombustible = `$${gastoActual + valor}`;
        break;
    }
  }

  aplicarFiltros(): void {
    // Filtering is handled by the informesFiltrados getter
  }
}