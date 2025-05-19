import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  InformesService,
  Informe,
  ResumenDatos,
} from '../../../core/services/informes.service';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, NgClass, FormsModule, RouterModule],
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css'],
})
export class InformesComponent implements OnInit {
  // Propiedades
  informes: Informe[] = [];
  filtroTipo: string = 'todos';
  cargando: boolean = true;
  resumen: ResumenDatos = {
    proyectosActivos: 0,
    horasTotales: 0,
    materialesEntregados: '',
    gastoCombustible: '',
  };

  constructor(private informesService: InformesService) {}

  ngOnInit(): void {
    this.cargarInformes();
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
      case 'en_proceso':
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
      case 'en_proceso':
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
    // Aquí podrías abrir un modal o navegar a una ruta para crear informes
    // Por ahora solo simulamos la creación de un informe básico
    const fechaActual = new Date().toLocaleDateString('es-ES');

    const nuevoInforme = {
      titulo: 'Nuevo informe generado',
      descripcion: 'Informe generado desde la interfaz',
      fecha: fechaActual,
      tipo: 'reporte' as 'estadisticas' | 'reporte',
      estatus: 'pendiente' as 'completado' | 'pendiente' | 'en_proceso',
    };

    this.informesService.crearInforme(nuevoInforme).subscribe({
      next: (informe) => {
        alert(`Informe "${informe.titulo}" creado correctamente.`);
        // Recargar la lista de informes
        this.cargarInformes();
      },
      error: (error) => {
        console.error('Error al crear informe:', error);
        alert('Error al crear el informe. Por favor, inténtelo de nuevo.');
      },
    });
  }
}
