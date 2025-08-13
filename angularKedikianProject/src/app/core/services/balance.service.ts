// balance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment'; // Asegúrate de que la ruta sea correcta

@Injectable({
  providedIn: 'root',
})
export class BalanceService {
  private apiUrl = `${environment.apiUrl}/balance`;

  // Datos de prueba
  private datosPrueba = {
    gastos: [
      {
        id: 1,
        usuario_id: 1,
        maquina_id: 1,
        tipo: 'material',
        importe_total: 150000,
        fecha: new Date('2024-03-15'),
        descripcion: 'Compra de materiales de construcción',
        imagen: 'https://via.placeholder.com/150'
      },
      {
        id: 2,
        usuario_id: 2,
        maquina_id: 2,
        tipo: 'servicio',
        importe_total: 75000,
        fecha: new Date('2024-03-16'),
        descripcion: 'Servicio de mantenimiento',
        imagen: 'https://via.placeholder.com/150'
      },
      {
        id: 3,
        usuario_id: 1,
        maquina_id: null,
        tipo: 'herramienta',
        importe_total: 45000,
        fecha: new Date('2024-03-17'),
        descripcion: 'Compra de herramientas',
        imagen: 'https://via.placeholder.com/150'
      }
    ],
    pagos: [
      {
        id: 1,
        proyecto_id: 1,
        producto_id: 1,
        monto: 250000,
        fecha: new Date('2024-03-15'),
        descripcion: 'Pago por proyecto residencial'
      },
      {
        id: 2,
        proyecto_id: 2,
        producto_id: 2,
        monto: 180000,
        fecha: new Date('2024-03-16'),
        descripcion: 'Pago por proyecto comercial'
      },
      {
        id: 3,
        proyecto_id: 1,
        producto_id: 3,
        monto: 320000,
        fecha: new Date('2024-03-17'),
        descripcion: 'Pago por proyecto industrial'
      }
    ],
    usuarios: [
      { id: 1, nombre: 'Juan Pérez' },
      { id: 2, nombre: 'María García' },
      { id: 3, nombre: 'Carlos López' }
    ],
    maquinas: [
      { id: 1, nombre: 'Excavadora CAT' },
      { id: 2, nombre: 'Camión Volquete' },
      { id: 3, nombre: 'Retroexcavadora' }
    ],
    proyectos: [
      { id: 1, nombre: 'Proyecto Residencial Norte' },
      { id: 2, nombre: 'Proyecto Comercial Centro' },
      { id: 3, nombre: 'Proyecto Industrial Sur' }
    ],
    productos: [
      { id: 1, nombre: 'Construcción Residencial' },
      { id: 2, nombre: 'Construcción Comercial' },
      { id: 3, nombre: 'Construcción Industrial' }
    ]
  };

  constructor(private http: HttpClient) {}

  // Gastos (Egresos)
  getGastos(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    return this.http.get<any>(`${this.apiUrl}/gastos`, { params });
  }

  getGasto(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/gastos/${id}`);
  }

  crearGasto(gasto: any): Observable<any> {
    if (gasto instanceof FormData) {
      return this.http.post<any>(`${this.apiUrl}/gastos`, gasto);
    } else {
      return this.http.post<any>(`${this.apiUrl}/gastos`, gasto, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  actualizarGasto(id: number, gasto: any): Observable<any> {
    if (gasto instanceof FormData) {
      return this.http.put<any>(`${this.apiUrl}/gastos/${id}`, gasto);
    } else {
      return this.http.put<any>(`${this.apiUrl}/gastos/${id}`, gasto, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  eliminarGasto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/gastos/${id}`);
  }

  // Pagos (Ingresos)
  getPagos(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio.toISOString())
      .set('fechaFin', fechaFin.toISOString());
    return this.http.get<any>(`${this.apiUrl}/pagos`, { params });
  }

  getPago(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pagos/${id}`);
  }

  crearPago(pago: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pagos`, pago);
  }

  actualizarPago(id: number, pago: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pagos/${id}`, pago);
  }

  eliminarPago(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/pagos/${id}`);
  }

  // Datos Relacionados
  getUsuarios(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/usuarios`);
  }

  getMaquinas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/maquinas`);
  }

  getProyectos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/proyectos`);
  }

  getProductos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/productos`);
  }

  // Resumen o Estadísticas
  getResumenBalance(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const gastosFiltrados = this.datosPrueba.gastos.filter(gasto => 
      gasto.fecha >= fechaInicio && gasto.fecha <= fechaFin
    );
    const pagosFiltrados = this.datosPrueba.pagos.filter(pago => 
      pago.fecha >= fechaInicio && pago.fecha <= fechaFin
    );

    const totalGastos = gastosFiltrados.reduce((sum, g) => sum + g.importe_total, 0);
    const totalPagos = pagosFiltrados.reduce((sum, p) => sum + p.monto, 0);

    return of({
      totalGastos,
      totalPagos,
      balance: totalPagos - totalGastos
    });
  }

  getEstadisticasPorTipo(fechaInicio: Date, fechaFin: Date): Observable<any> {
    const gastosFiltrados = this.datosPrueba.gastos.filter(gasto => 
      gasto.fecha >= fechaInicio && gasto.fecha <= fechaFin
    );

    const estadisticas: { [key: string]: number } = gastosFiltrados.reduce((acc, gasto) => {
      if (!acc[gasto.tipo]) {
        acc[gasto.tipo] = 0;
      }
      acc[gasto.tipo] += gasto.importe_total;
      return acc;
    }, {} as { [key: string]: number });

    return of(estadisticas);
  }

  getEstadisticasPorMes(anio: number): Observable<any> {
    const gastosPorMes = Array(12).fill(0);
    const pagosPorMes = Array(12).fill(0);

    this.datosPrueba.gastos.forEach(gasto => {
      if (gasto.fecha.getFullYear() === anio) {
        gastosPorMes[gasto.fecha.getMonth()] += gasto.importe_total;
      }
    });

    this.datosPrueba.pagos.forEach(pago => {
      if (pago.fecha.getFullYear() === anio) {
        pagosPorMes[pago.fecha.getMonth()] += pago.monto;
      }
    });

    return of({
      gastos: gastosPorMes,
      pagos: pagosPorMes
    });
  }
}
