import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

// Importamos configuración de environment
// Nota: Debes crear estos archivos si no existen
export const environment = {
  production: false,
  apiUrl: 'https://api.tuempresa.com/api',
  useSimulatedData: true, // Cambiar a false cuando exista la base de datos real
};

// Interfaces para los datos del servicio (exportadas para su uso en componentes)
export interface Informe {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  tipo: 'estadisticas' | 'reporte';
  estatus: 'completado' | 'pendiente' | 'en_proceso';
}

export interface ResumenDatos {
  proyectosActivos: number;
  horasTotales: number;
  materialesEntregados: string;
  gastoCombustible: string;
}

export interface InformesResponse {
  informes: Informe[];
  resumen: ResumenDatos;
}

@Injectable({
  providedIn: 'root',
})
export class InformesService {
  // URL base de la API
  private apiUrl = environment.apiUrl + '/informes';

  // Datos simulados para desarrollo
  private informesSimulados: Informe[] = [
    {
      id: 1,
      titulo: 'Informe de horas trabajadas',
      descripcion: 'Resumen de horas trabajadas por proyecto',
      fecha: '14/05/2025',
      tipo: 'estadisticas',
      estatus: 'completado',
    },
    {
      id: 2,
      titulo: 'Consumo de combustible mensual',
      descripcion: 'Análisis de gastos en combustible por vehículo',
      fecha: '10/05/2025',
      tipo: 'estadisticas',
      estatus: 'completado',
    },
    {
      id: 3,
      titulo: 'Productividad de maquinaria',
      descripcion: 'Rendimiento de retroexcavadoras y camiones',
      fecha: '05/05/2025',
      tipo: 'estadisticas',
      estatus: 'completado',
    },
    {
      id: 4,
      titulo: 'Entrega de materiales',
      descripcion: 'Registro de entregas de áridos por proyecto',
      fecha: '01/05/2025',
      tipo: 'reporte',
      estatus: 'pendiente',
    },
    {
      id: 5,
      titulo: 'Avance de proyecto Carretera Norte',
      descripcion: 'Porcentaje de avance y tareas completadas',
      fecha: '28/04/2025',
      tipo: 'reporte',
      estatus: 'completado',
    },
    {
      id: 6,
      titulo: 'Mantenimientos programados',
      descripcion: 'Calendario de mantenimientos de maquinaria',
      fecha: '25/04/2025',
      tipo: 'reporte',
      estatus: 'en_proceso',
    },
    {
      id: 7,
      titulo: 'Consumo de agua en obra',
      descripcion: 'Medición del consumo de agua por proyecto',
      fecha: '20/04/2025',
      tipo: 'estadisticas',
      estatus: 'completado',
    },
    {
      id: 8,
      titulo: 'Incidentes de seguridad',
      descripcion: 'Reporte de incidentes y medidas adoptadas',
      fecha: '15/04/2025',
      tipo: 'reporte',
      estatus: 'completado',
    },
  ];

  private resumenDatosSimulado: ResumenDatos = {
    proyectosActivos: 4,
    horasTotales: 842,
    materialesEntregados: '1,240 toneladas',
    gastoCombustible: '$1,875,000',
  };

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los informes y el resumen de datos
   * @returns Observable con informes y resumen
   */
  getInformes(): Observable<InformesResponse> {
    // En modo producción, conectar con la API real
    if (!environment.useSimulatedData) {
      return this.http.get<InformesResponse>(this.apiUrl).pipe(
        catchError((error) => {
          console.error('Error al obtener informes:', error);
          return throwError(
            () =>
              new Error(
                'Error al cargar los informes. Por favor, inténtelo de nuevo.'
              )
          );
        })
      );
    }

    // En modo desarrollo, usar datos simulados
    return of({
      informes: this.informesSimulados,
      resumen: this.resumenDatosSimulado,
    }).pipe(
      delay(800) // Simular latencia de red
    );
  }

  /**
   * Obtiene un informe específico por su ID
   * @param id ID del informe a buscar
   * @returns Observable con el informe encontrado
   */
  getInformePorId(id: number): Observable<Informe> {
    if (!environment.useSimulatedData) {
      return this.http.get<Informe>(`${this.apiUrl}/${id}`).pipe(
        catchError((error) => {
          console.error(`Error al obtener informe con ID ${id}:`, error);
          return throwError(
            () =>
              new Error(
                'Error al cargar el informe. Por favor, inténtelo de nuevo.'
              )
          );
        })
      );
    }

    // Usar datos simulados
    const informe = this.informesSimulados.find((inf) => inf.id === id);
    if (!informe) {
      return throwError(() => new Error('Informe no encontrado'));
    }
    return of(informe).pipe(delay(300));
  }

  /**
   * Crea un nuevo informe
   * @param informe Datos del nuevo informe
   * @returns Observable con el informe creado
   */
  crearInforme(informe: Omit<Informe, 'id'>): Observable<Informe> {
    if (!environment.useSimulatedData) {
      return this.http.post<Informe>(this.apiUrl, informe).pipe(
        catchError((error) => {
          console.error('Error al crear informe:', error);
          return throwError(
            () =>
              new Error(
                'Error al crear el informe. Por favor, inténtelo de nuevo.'
              )
          );
        })
      );
    }

    // Simular creación con datos locales
    const nuevoId =
      Math.max(...this.informesSimulados.map((inf) => inf.id)) + 1;
    const nuevoInforme = { ...informe, id: nuevoId } as Informe;
    this.informesSimulados.push(nuevoInforme);
    return of(nuevoInforme).pipe(delay(400));
  }

  /**
   * Actualiza un informe existente
   * @param id ID del informe a actualizar
   * @param informe Datos actualizados del informe
   * @returns Observable con el informe actualizado
   */
  actualizarInforme(
    id: number,
    informe: Partial<Informe>
  ): Observable<Informe> {
    if (!environment.useSimulatedData) {
      return this.http.put<Informe>(`${this.apiUrl}/${id}`, informe).pipe(
        catchError((error) => {
          console.error(`Error al actualizar informe con ID ${id}:`, error);
          return throwError(
            () =>
              new Error(
                'Error al actualizar el informe. Por favor, inténtelo de nuevo.'
              )
          );
        })
      );
    }

    // Simular actualización con datos locales
    const index = this.informesSimulados.findIndex((inf) => inf.id === id);
    if (index === -1) {
      return throwError(() => new Error('Informe no encontrado'));
    }

    const informeActualizado = {
      ...this.informesSimulados[index],
      ...informe,
    };
    this.informesSimulados[index] = informeActualizado;
    return of(informeActualizado).pipe(delay(400));
  }

  /**
   * Elimina un informe existente
   * @param id ID del informe a eliminar
   * @returns Observable con confirmación de eliminación
   */
  eliminarInforme(id: number): Observable<boolean> {
    if (!environment.useSimulatedData) {
      return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
        map(() => true),
        catchError((error) => {
          console.error(`Error al eliminar informe con ID ${id}:`, error);
          return throwError(
            () =>
              new Error(
                'Error al eliminar el informe. Por favor, inténtelo de nuevo.'
              )
          );
        })
      );
    }

    // Simular eliminación con datos locales
    const index = this.informesSimulados.findIndex((inf) => inf.id === id);
    if (index === -1) {
      return throwError(() => new Error('Informe no encontrado'));
    }

    this.informesSimulados.splice(index, 1);
    return of(true).pipe(delay(300));
  }

  /**
   * Descarga un informe específico
   * @param id ID del informe a descargar
   * @returns Observable con datos para la descarga
   */
  descargarInforme(id: number): Observable<Blob> {
    if (!environment.useSimulatedData) {
      return this.http
        .get(`${this.apiUrl}/${id}/descargar`, {
          responseType: 'blob',
        })
        .pipe(
          catchError((error) => {
            console.error(`Error al descargar informe con ID ${id}:`, error);
            return throwError(
              () =>
                new Error(
                  'Error al descargar el informe. Por favor, inténtelo de nuevo.'
                )
            );
          })
        );
    }

    // Simular descarga (crear un blob de ejemplo)
    const textoEjemplo = `Informe de ejemplo #${id}\nEste es un informe simulado para desarrollo.`;
    const blob = new Blob([textoEjemplo], { type: 'text/plain' });
    return of(blob).pipe(delay(800));
  }

  /**
   * Filtra informes por tipo
   * @param tipo Tipo de informe ('estadisticas' o 'reporte')
   * @returns Observable con informes filtrados
   */
  filtrarInformesPorTipo(tipo: string): Observable<Informe[]> {
    if (!environment.useSimulatedData) {
      return this.http
        .get<Informe[]>(`${this.apiUrl}/filtrar?tipo=${tipo}`)
        .pipe(
          catchError((error) => {
            console.error(`Error al filtrar informes por tipo ${tipo}:`, error);
            return throwError(
              () =>
                new Error(
                  'Error al filtrar los informes. Por favor, inténtelo de nuevo.'
                )
            );
          })
        );
    }

    // Filtrar datos simulados
    const informesFiltrados =
      tipo === 'todos'
        ? this.informesSimulados
        : this.informesSimulados.filter((informe) => informe.tipo === tipo);

    return of(informesFiltrados).pipe(delay(300));
  }

  /**
   * Obtiene solo el resumen de datos
   * @returns Observable con el resumen de datos
   */
  getResumenDatos(): Observable<ResumenDatos> {
    if (!environment.useSimulatedData) {
      return this.http.get<ResumenDatos>(`${this.apiUrl}/resumen`).pipe(
        catchError((error) => {
          console.error('Error al obtener resumen de datos:', error);
          return throwError(
            () =>
              new Error(
                'Error al cargar el resumen. Por favor, inténtelo de nuevo.'
              )
          );
        })
      );
    }

    return of(this.resumenDatosSimulado).pipe(delay(300));
  }

  /**
   * Genera un nuevo informe personalizado
   * @param parametros Parámetros para la generación del informe
   * @returns Observable con el informe generado
   */
  generarInformePersonalizado(parametros: {
    tipo: 'estadisticas' | 'reporte';
    fechaInicio: string;
    fechaFin: string;
    proyectoId?: number;
    incluirGraficos?: boolean;
  }): Observable<Informe> {
    if (!environment.useSimulatedData) {
      return this.http.post<Informe>(`${this.apiUrl}/generar`, parametros).pipe(
        catchError((error) => {
          console.error('Error al generar informe personalizado:', error);
          return throwError(
            () =>
              new Error(
                'Error al generar el informe. Por favor, inténtelo de nuevo.'
              )
          );
        })
      );
    }

    // Simular generación de informe
    const fechaActual = new Date().toLocaleDateString('es-ES');
    const nuevoId =
      Math.max(...this.informesSimulados.map((inf) => inf.id)) + 1;

    let titulo =
      parametros.tipo === 'estadisticas' ? 'Estadísticas ' : 'Reporte ';

    titulo += `del ${parametros.fechaInicio} al ${parametros.fechaFin}`;

    if (parametros.proyectoId) {
      titulo += ` - Proyecto #${parametros.proyectoId}`;
    }

    const nuevoInforme: Informe = {
      id: nuevoId,
      titulo: titulo,
      descripcion: `Informe generado automáticamente el ${fechaActual}`,
      fecha: fechaActual,
      tipo: parametros.tipo,
      estatus: 'completado',
    };

    this.informesSimulados.push(nuevoInforme);
    return of(nuevoInforme).pipe(delay(1500)); // Mayor retraso para simular procesamiento
  }
}
