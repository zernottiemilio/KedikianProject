import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Arido, RegistroArido, Proyecto } from './aridos.component';

@Injectable({
  providedIn: 'root',
})
export class AridosService {
  // URL base de la API (a modificar cuando se implemente el backend)
  private apiUrl = 'api/aridos';

  // Datos de ejemplo para usar mientras no hay conexión a la API
  private datosEjemplo = {
    aridos: [
      {
        id: 1,
        nombre: 'Arena Fina',
        tipo: 'Arena',
        unidadMedida: 'm³',
        descripcion: 'Arena fina para mezclas',
      },
      {
        id: 2,
        nombre: 'Grava',
        tipo: 'Piedra',
        unidadMedida: 'm³',
        descripcion: 'Grava para hormigón',
      },
      {
        id: 3,
        nombre: 'Piedra Partida',
        tipo: 'Piedra',
        unidadMedida: 'toneladas',
        descripcion: 'Piedra triturada',
      },
      {
        id: 4,
        nombre: 'Arena Gruesa',
        tipo: 'Arena',
        unidadMedida: 'm³',
        descripcion: 'Arena gruesa para construcción',
      },
      {
        id: 5,
        nombre: 'Ripio',
        tipo: 'Piedra',
        unidadMedida: 'm³',
        descripcion: 'Ripio para bases',
      },
    ],
    proyectos: [
      {
        id: 1,
        nombre: 'Edificio Residencial Aurora',
        ubicacion: 'Av. Principal 123',
        estado: 'activo',
      },
      {
        id: 2,
        nombre: 'Centro Comercial Plaza Norte',
        ubicacion: 'Ruta 25 km 14',
        estado: 'activo',
      },
      {
        id: 3,
        nombre: 'Puente Costanera',
        ubicacion: 'Sector Costanera Sur',
        estado: 'pausado',
      },
      {
        id: 4,
        nombre: 'Urbanización Los Pinos',
        ubicacion: 'Sector Este',
        estado: 'completado',
      },
      {
        id: 5,
        nombre: 'Ampliación Hospital Central',
        ubicacion: 'Calle Salud 450',
        estado: 'activo',
      },
    ],
    registros: [
      {
        id: 1,
        proyectoId: 1,
        proyectoNombre: 'Edificio Residencial Aurora',
        aridoId: 1,
        aridoNombre: 'Arena Fina',
        cantidad: 15,
        fechaEntrega: new Date('2025-04-20'),
        operario: 'Juan Pérez',
        observaciones: 'Entrega completa sin inconvenientes',
      },
      {
        id: 2,
        proyectoId: 2,
        proyectoNombre: 'Centro Comercial Plaza Norte',
        aridoId: 2,
        aridoNombre: 'Grava',
        cantidad: 22.5,
        fechaEntrega: new Date('2025-04-22'),
        operario: 'María Gómez',
        observaciones: 'Se requiere más material para la próxima semana',
      },
      {
        id: 3,
        proyectoId: 1,
        proyectoNombre: 'Edificio Residencial Aurora',
        aridoId: 3,
        aridoNombre: 'Piedra Partida',
        cantidad: 8,
        fechaEntrega: new Date('2025-04-25'),
        operario: 'Carlos Rodríguez',
        observaciones: '',
      },
      {
        id: 4,
        proyectoId: 3,
        proyectoNombre: 'Puente Costanera',
        aridoId: 4,
        aridoNombre: 'Arena Gruesa',
        cantidad: 12.8,
        fechaEntrega: new Date('2025-04-27'),
        operario: 'Ana Martínez',
        observaciones: 'Entrega parcial, pendiente 5m³ para la próxima semana',
      },
      {
        id: 5,
        proyectoId: 5,
        proyectoNombre: 'Ampliación Hospital Central',
        aridoId: 5,
        aridoNombre: 'Ripio',
        cantidad: 17.3,
        fechaEntrega: new Date('2025-04-28'),
        operario: 'Roberto Sánchez',
        observaciones: '',
      },
    ],
  };

  constructor(private http: HttpClient) {}

  // Métodos para obtener datos de áridos
  getAridos(): Observable<Arido[]> {
    // Cuando se implemente el backend, descomentar la siguiente línea
    // return this.http.get<Arido[]>(`${this.apiUrl}/tipos`).pipe(
    //   catchError(this.handleError<Arido[]>('getAridos', []))
    // );

    // Mientras tanto, usar datos de ejemplo
    return of(this.datosEjemplo.aridos);
  }

  getArido(id: number): Observable<Arido> {
    // Cuando se implemente el backend, descomentar la siguiente línea
    // return this.http.get<Arido>(`${this.apiUrl}/tipos/${id}`).pipe(
    //   catchError(this.handleError<Arido>(`getArido id=${id}`))
    // );

    // Mientras tanto, usar datos de ejemplo
    const arido = this.datosEjemplo.aridos.find((a) => a.id === id);
    if (arido) {
      return of(arido);
    }
    return throwError(() => new Error(`Árido con id ${id} no encontrado`));
  }

  // Métodos para obtener proyectos
  getProyectos(): Observable<Proyecto[]> {
    // Cuando se implemente el backend, descomentar la siguiente línea
    // return this.http.get<Proyecto[]>(`${this.apiUrl}/proyectos`).pipe(
    //   catchError(this.handleError<Proyecto[]>('getProyectos', []))
    // );

    // Mientras tanto, usar datos de ejemplo
    return of(this.datosEjemplo.proyectos);
  }

  getProyecto(id: number): Observable<Proyecto> {
    // Cuando se implemente el backend, descomentar la siguiente línea
    // return this.http.get<Proyecto>(`${this.apiUrl}/proyectos/${id}`).pipe(
    //   catchError(this.handleError<Proyecto>(`getProyecto id=${id}`))
    // );

    // Mientras tanto, usar datos de ejemplo
    const proyecto = this.datosEjemplo.proyectos.find((p) => p.id === id);
    if (proyecto) {
      return of(proyecto);
    }
    return throwError(() => new Error(`Proyecto con id ${id} no encontrado`));
  }

  // Métodos para registros de áridos
  getRegistrosAridos(filtros?: {
    proyectoId?: number;
    aridoId?: number;
  }): Observable<RegistroArido[]> {
    // Cuando se implemente el backend, descomentar la siguiente línea
    // let url = `${this.apiUrl}/registros`;
    // if (filtros) {
    //   const params = new HttpParams();
    //   if (filtros.proyectoId) params.set('proyectoId', filtros.proyectoId.toString());
    //   if (filtros.aridoId) params.set('aridoId', filtros.aridoId.toString());
    //   return this.http.get<RegistroArido[]>(url, { params }).pipe(
    //     catchError(this.handleError<RegistroArido[]>('getRegistrosAridos', []))
    //   );
    // }

    // Mientras tanto, usar datos de ejemplo
    let registros = this.datosEjemplo.registros;

    if (filtros) {
      if (filtros.proyectoId) {
        registros = registros.filter(
          (r) => r.proyectoId === filtros.proyectoId
        );
      }
      if (filtros.aridoId) {
        registros = registros.filter((r) => r.aridoId === filtros.aridoId);
      }
    }

    return of(registros);
  }

  getRegistroArido(id: number): Observable<RegistroArido> {
    // Cuando se implemente el backend, descomentar la siguiente línea
    // return this.http.get<RegistroArido>(`${this.apiUrl}/registros/${id}`).pipe(
    //   catchError(this.handleError<RegistroArido>(`getRegistroArido id=${id}`))
    // );

    // Mientras tanto, usar datos de ejemplo
    const registro = this.datosEjemplo.registros.find((r) => r.id === id);
    if (registro) {
      return of(registro);
    }
    return throwError(() => new Error(`Registro con id ${id} no encontrado`));
  }

  crearRegistroArido(
    registro: Omit<RegistroArido, 'id'>
  ): Observable<RegistroArido> {
    // Cuando se implemente el backend, descomentar la siguiente línea
    // return this.http.post<RegistroArido>(`${this.apiUrl}/registros`, registro).pipe(
    //   catchError(this.handleError<RegistroArido>('crearRegistroArido'))
    // );

    // Mientras tanto, simular una creación
    const nuevoId =
      Math.max(...this.datosEjemplo.registros.map((r) => r.id)) + 1;
    const nuevoRegistro = { ...registro, id: nuevoId } as RegistroArido;
    this.datosEjemplo.registros.push(nuevoRegistro);
    return of(nuevoRegistro);
  }

  actualizarRegistroArido(registro: RegistroArido): Observable<RegistroArido> {
    // Cuando se implemente el backend, descomentar la siguiente línea
    // return this.http.put<RegistroArido>(`${this.apiUrl}/registros/${registro.id}`, registro).pipe(
    //   catchError(this.handleError<RegistroArido>('actualizarRegistroArido'))
    // );

    // Mientras tanto, simular una actualización
    const index = this.datosEjemplo.registros.findIndex(
      (r) => r.id === registro.id
    );
    if (index !== -1) {
      this.datosEjemplo.registros[index] = registro;
      return of(registro);
    }
    return throwError(
      () => new Error(`No se pudo actualizar el registro con id ${registro.id}`)
    );
  }

  eliminarRegistroArido(id: number): Observable<void> {
    // Cuando se implemente el backend, descomentar la siguiente línea
    // return this.http.delete<void>(`${this.apiUrl}/registros/${id}`).pipe(
    //   catchError(this.handleError<void>('eliminarRegistroArido'))
    // );

    // Mientras tanto, simular una eliminación
    const index = this.datosEjemplo.registros.findIndex((r) => r.id === id);
    if (index !== -1) {
      this.datosEjemplo.registros.splice(index, 1);
      return of(void 0);
    }
    return throwError(
      () => new Error(`No se pudo eliminar el registro con id ${id}`)
    );
  }

  // Método para manejar errores
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);

      // Registrar el error en un sistema de logging (implementar en el futuro)

      // Retornar un resultado vacío para que la aplicación siga funcionando
      return of(result as T);
    };
  }
}
