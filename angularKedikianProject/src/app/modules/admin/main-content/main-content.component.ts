import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import {
  ProjectService,
  Project,
} from '../../../core/services/project.service';

interface Maquina {
  nombre: string;
  horasSemanales: number;
}

interface ProyectoExtendido extends Omit<Project, 'startDate' | 'endDate'> {
  maquinas: Maquina[];
  aridos: string[];
  fechaInicio: Date;
  fechaFin: Date;
  descripcion: string;
}

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [CommonModule, NgClass],
  providers: [ProjectService],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.css'],
})
export class MainContentComponent implements OnInit {
  proyectos: ProyectoExtendido[] = [
    {
      id: 1,
      nombre: 'Construcción Complejo Residencial Norte',
      descripcion:
        'Proyecto de construcción de complejo residencial de 150 unidades habitacionales con áreas verdes y estacionamientos.',
      description:
        'Proyecto de construcción de complejo residencial de 150 unidades habitacionales con áreas verdes y estacionamientos.',
      maquinas: [
        { nombre: 'Excavadora CAT 320', horasSemanales: 40 },
        { nombre: 'Bulldozer D6T', horasSemanales: 35 },
        { nombre: 'Grúa Torre 180HC', horasSemanales: 45 },
      ],
      fechaInicio: new Date('2024-01-15'),
      fechaFin: new Date('2025-12-30'),
      daysRemaining: 0,
      estado: true,
      progress: 0,
      manager: 'Juan Pérez',
      fecha_creacion: new Date('2024-01-01'),
      contrato_id: 1,
      ubicacion: 'Zona Norte, Ciudad de México',
      aridos: [
        'Arena fina',
        'Grava triturada',
        'Piedra caliza',
        'Arena gruesa',
      ],
    },
    {
      id: 2,
      nombre: 'Ampliación Centro Comercial Plaza Sur',
      descripcion:
        'Ampliación del centro comercial existente con nueva ala de tiendas departamentales y área de comidas.',
      description:
        'Ampliación del centro comercial existente con nueva ala de tiendas departamentales y área de comidas.',
      maquinas: [
        { nombre: 'Retroexcavadora JCB 3CX', horasSemanales: 30 },
        { nombre: 'Compactadora CP74', horasSemanales: 25 },
        { nombre: 'Mixer Concreto 8m³', horasSemanales: 40 },
      ],
      fechaInicio: new Date('2024-03-01'),
      fechaFin: new Date('2024-08-15'),
      daysRemaining: 0,
      estado: true,
      progress: 0,
      manager: 'Juan Pérez',
      fecha_creacion: new Date('2024-01-01'),
      contrato_id: 1,
      ubicacion: 'Plaza Sur, Guadalajara',
      aridos: ['Agregado fino', 'Agregado grueso', 'Arena lavada'],
    },
    {
      id: 3,
      nombre: 'Construcción Puente Vehicular',
      descripcion:
        'Construcción de puente vehicular de 4 carriles sobre río principal para mejorar conectividad urbana.',
      description:
        'Construcción de puente vehicular de 4 carriles sobre río principal para mejorar conectividad urbana.',
      maquinas: [
        { nombre: 'Grúa Móvil 200T', horasSemanales: 48 },
        { nombre: 'Piloteadora CFA', horasSemanales: 42 },
        { nombre: 'Bomba Concreto 52m', horasSemanales: 36 },
      ],
      fechaInicio: new Date('2023-11-01'),
      fechaFin: new Date('2024-06-30'),
      daysRemaining: 0,
      estado: true,
      progress: 0,
      manager: 'Juan Pérez',
      fecha_creacion: new Date('2024-01-01'),
      contrato_id: 1,
      ubicacion: 'Río Bravo, Monterrey',
      aridos: ['Grava río', 'Arena sílica', 'Piedra triturada', 'Balasto'],
    },
    {
      id: 4,
      nombre: 'Remodelación Hospital General',
      descripcion:
        'Remodelación integral de hospital general incluyendo nueva ala de emergencias y modernización de quirófanos.',
      description:
        'Remodelación integral de hospital general incluyendo nueva ala de emergencias y modernización de quirófanos.',
      maquinas: [
        { nombre: 'Minicargadora S185', horasSemanales: 32 },
        { nombre: 'Compresor 375 CFM', horasSemanales: 28 },
        { nombre: 'Elevador Tijera 26ft', horasSemanales: 35 },
      ],
      fechaInicio: new Date('2024-02-01'),
      fechaFin: new Date('2025-01-15'),
      daysRemaining: 0,
      estado: true,
      progress: 0,
      manager: 'Juan Pérez',
      fecha_creacion: new Date('2024-01-01'),
      contrato_id: 1,
      ubicacion: 'Centro Médico, Puebla',
      aridos: ['Arena fina tamizada', 'Grava clasificada', 'Polvo de piedra'],
    },
    {
      id: 5,
      nombre: 'Desarrollo Industrial Zona Este',
      descripcion:
        'Construcción de parque industrial con 12 naves industriales, oficinas administrativas y servicios.',
      description:
        'Construcción de parque industrial con 12 naves industriales, oficinas administrativas y servicios.',
      maquinas: [
        { nombre: 'Excavadora 345C', horasSemanales: 44 },
        { nombre: 'Rodillo Compactador', horasSemanales: 38 },
        { nombre: 'Grúa Telescópica RT540', horasSemanales: 42 },
        { nombre: 'Motoniveladora 140M', horasSemanales: 35 },
      ],
      fechaInicio: new Date('2024-05-01'),
      fechaFin: new Date('2025-06-30'),
      daysRemaining: 0,
      estado: true,
      progress: 0,
      manager: 'Juan Pérez',
      fecha_creacion: new Date('2024-01-01'),
      contrato_id: 1,
      ubicacion: 'Parque Industrial Este, Tijuana',
      aridos: [
        'Base granular',
        'Sub-base',
        'Arena compactación',
        'Grava clasificada',
        'Tepetate',
      ],
    },
    {
      id: 6,
      nombre: 'Renovación Estadio Municipal',
      descripcion:
        'Renovación completa del estadio municipal incluyendo nuevas gradas, iluminación LED y sistema de drenaje.',
      description:
        'Renovación completa del estadio municipal incluyendo nuevas gradas, iluminación LED y sistema de drenaje.',
      maquinas: [
        { nombre: 'Excavadora de Ruedas', horasSemanales: 36 },
        { nombre: 'Cargador Frontal 950M', horasSemanales: 40 },
        { nombre: 'Vibro Compactador', horasSemanales: 30 },
      ],
      fechaInicio: new Date('2024-06-15'),
      fechaFin: new Date('2025-11-30'),
      daysRemaining: 0,
      estado: true,
      progress: 0,
      manager: 'Juan Pérez',
      fecha_creacion: new Date('2024-01-01'),
      contrato_id: 1,
      ubicacion: 'Centro Deportivo, León',
      aridos: ['Arena para drenaje', 'Grava permeable', 'Agregado decorativo'],
    },
  ];

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.projectService.getLastProjects().subscribe((projects: Project[]) => {
      this.proyectos = projects.map((project) => ({
        ...project,
        fechaInicio: project.startDate,
        fechaFin: project.endDate,
        descripcion: project.description,
        maquinas: [],
        aridos: [],
      }));
    });
  }

  /**
   * Calcula el total de horas semanales de todas las máquinas de un proyecto
   */
  getTotalHours(maquinas: Maquina[]): number {
    return maquinas.reduce(
      (total, maquina) => total + maquina.horasSemanales,
      0
    );
  }

  /**
   * Determina el estado del proyecto basado en las fechas
   */
  getProjectStatus(fechaInicio: Date, fechaFin: Date): string {
    const hoy = new Date();
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (hoy < inicio) {
      return 'Pendiente';
    } else if (hoy >= inicio && hoy <= fin) {
      return 'En Progreso';
    } else {
      return 'Completado';
    }
  }

  /**
   * Obtiene la clase CSS para el badge de estado
   */
  getStatusClass(fechaInicio: Date, fechaFin: Date): string {
    const status = this.getProjectStatus(fechaInicio, fechaFin);

    switch (status) {
      case 'Pendiente':
        return 'pending';
      case 'En Progreso':
        return 'active';
      case 'Completado':
        return 'completed';
      default:
        return 'pending';
    }
  }
}
