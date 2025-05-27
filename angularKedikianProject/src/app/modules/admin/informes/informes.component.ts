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
  // Propiedades
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

  // Propiedades para el modal
  mostrarModal = false;
  informeForm: FormGroup;

  constructor(
    private informesService: InformesService,
    private fb: FormBuilder
  ) {
    this.informeForm = this.fb.group({
      titulo: ['', Validators.required],
      tipo: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      descripcion: [''],
      valor: [0, [Validators.required, Validators.min(0)]], // Nuevo campo para el valor
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
    this.cargarDatosResumen();
    this.aplicarFiltros();
  }

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
        // Navegar a la lista de informes o previsualizar el informe
      },
      error: (error) => {
        console.error('Error:', error);
        alert('Error al generar el informe. Por favor, inténtelo de nuevo.');
      },
    });
  }
  // Método para cargar informes desde el servicio
  cargarInformes(): void {
    this.cargando = true;
    this.informesService.getInformes().subscribe({
      next: (data) => {
        this.informes = data.informes;
        this.resumen = data.resumen;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar informes:', error);
        this.cargando = false;
        alert('Error al cargar los informes. Por favor, intente nuevamente.');
      },
    });
  }

  // Método para filtrar informes
  get informesFiltrados(): Informe[] {
    return this.filtroTipo === 'todos'
      ? this.informes
      : this.informes.filter((informe) => informe.tipo === this.filtroTipo);
  }

  // Método para manejar la descarga (usando el servicio)
  descargarInforme(id: number): void {
    this.informesService.descargarInforme(id).subscribe({
      next: (blob) => {
        // Crear un enlace de descarga
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

  // Método para obtener el color según el estatus
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

  // Método para obtener el nombre del estatus
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

  // Método para obtener la clase del icono según tipo
  getClaseIcono(tipo: string): string {
    return tipo === 'estadisticas' ? 'icono-estadistica' : 'icono-reporte';
  }

  // Método para generar un nuevo informe
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
        // Agregar el nuevo informe al inicio de la lista
        this.informes.unshift(informeCreado);

        // Actualizar el resumen según el tipo de informe
        if (informeCreado.valor !== undefined) {
          this.actualizarResumen(informeCreado.tipo, informeCreado.valor);
        }

        // Cerrar el modal y mostrar mensaje de éxito
        this.cerrarModal(null as any);
        alert(
          `El informe "${informeCreado.titulo}" ha sido creado exitosamente.`
        );
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
    // Aquí cargarías los datos desde el servicio
    this.resumen = {
      proyectosActivos: 12,
      horasTotales: 456,
      materialesEntregados: '1,234 m³',
      gastoCombustible: '$5,678',
    };
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
