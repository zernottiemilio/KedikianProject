import { Component, OnInit, OnDestroy } from '@angular/core';
import { BalanceService } from '../../../core/services/balance.service';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IngresoComponent } from './ingreso/ingreso.component';
import { EgresoComponent } from './egreso/egreso.component';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

interface Gasto {
  id: number;
  usuario_id: number;
  maquina_id: number;
  tipo: string;
  importe_total: number;
  fecha: Date;
  descripcion: string;
  imagen: string;
}

interface Pago {
  id: number;
  proyecto_id: number;
  producto_id: number;
  monto: number;
  fecha: Date;
  descripcion: string;
}

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EgresoComponent,
    IngresoComponent,
    RouterModule,
    CurrencyPipe,
  ],
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.css'],
})
export class BalanceComponent implements OnInit, OnDestroy {
  // Variables para datos
  gastos: Gasto[] = [];
  pagos: Pago[] = [];
  totalIngresos: number = 0;
  totalEgresos: number = 0;
  balance: number = 0;

  // Variables para UI
  periodoSeleccionado: string = 'mes';
  tabActiva: string = 'ingresos';
  isLoading: boolean = false;
  errorMessage: string = '';

  // Variables para fechas
  fechaInicio: Date = new Date();
  fechaFin: Date = new Date();
  fechaInicioStr: string = '';
  fechaFinStr: string = '';

  // Subscripciones
  private subscriptions: Subscription[] = [];

  constructor(private balanceService: BalanceService) {}

  ngOnInit(): void {
    console.log('BalanceComponent inicializado');

    // Inicializar fechas para el mes actual
    this.setFechasPeriodo('mes');

    // Intentar cargar datos iniciales
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    // Limpiar subscripciones al destruir el componente
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // Método para formato de fechas
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Método para cambiar entre tabs
  cambiarTab(tab: string): void {
    console.log('Cambiando tab a:', tab);
    this.tabActiva = tab;
  }

  // Método para reintentar la carga de datos
  reintentar(): void {
    this.errorMessage = '';
    this.cargarDatos();
  }

  // Métodos para manejo de fechas en el input
  onFechaInicioChange(event: string): void {
    this.fechaInicioStr = event;
    this.fechaInicio = new Date(event);
  }

  onFechaFinChange(event: string): void {
    this.fechaFinStr = event;
    this.fechaFin = new Date(event);
  }

  setFechasPeriodo(periodo: string): void {
    console.log('Configurando fechas para periodo:', periodo);
    const hoy = new Date();
    this.periodoSeleccionado = periodo;

    switch (periodo) {
      case 'hoy':
        this.fechaInicio = new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          hoy.getDate(),
          0,
          0,
          0
        );
        this.fechaFin = new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          hoy.getDate(),
          23,
          59,
          59
        );
        break;
      case 'semana':
        // Primer día de la semana (domingo)
        const primerDiaSemana = new Date(hoy);
        primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
        primerDiaSemana.setHours(0, 0, 0, 0);

        // Último día de la semana (sábado)
        const ultimoDiaSemana = new Date(hoy);
        ultimoDiaSemana.setDate(primerDiaSemana.getDate() + 6);
        ultimoDiaSemana.setHours(23, 59, 59, 999);

        this.fechaInicio = primerDiaSemana;
        this.fechaFin = ultimoDiaSemana;
        break;
      case 'mes':
        // Primer día del mes
        this.fechaInicio = new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          1,
          0,
          0,
          0
        );

        // Último día del mes
        this.fechaFin = new Date(
          hoy.getFullYear(),
          hoy.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        break;
      case 'año':
        this.fechaInicio = new Date(hoy.getFullYear(), 0, 1, 0, 0, 0);
        this.fechaFin = new Date(hoy.getFullYear(), 11, 31, 23, 59, 59);
        break;
    }

    // Actualizar las cadenas de fecha para los inputs HTML
    this.fechaInicioStr = this.formatDate(this.fechaInicio);
    this.fechaFinStr = this.formatDate(this.fechaFin);

    // Cargar datos con las nuevas fechas
    this.cargarDatos();
  }

  cargarDatos(): void {
    console.log(
      'Cargando datos desde:',
      this.fechaInicio,
      'hasta:',
      this.fechaFin
    );

    // Mostrar indicador de carga
    this.isLoading = true;
    this.errorMessage = '';

    // Cargar gastos
    const gastosSubscription = this.balanceService
      .getGastos(this.fechaInicio, this.fechaFin)
      .pipe(
        catchError((error) => {
          console.error('Error al cargar gastos:', error);
          this.errorMessage =
            'Error al cargar los gastos. Por favor, intente de nuevo.';
          return of([]);
        }),
        finalize(() => {
          // No finalizamos la carga aquí ya que aún podrían estar cargando los pagos
        })
      )
      .subscribe((data) => {
        console.log('Gastos cargados:', data);
        this.gastos = data;
        this.calcularTotalEgresos();
        this.calcularBalance();
      });

    this.subscriptions.push(gastosSubscription);

    // Cargar pagos
    const pagosSubscription = this.balanceService
      .getPagos(this.fechaInicio, this.fechaFin)
      .pipe(
        catchError((error) => {
          console.error('Error al cargar pagos:', error);
          if (!this.errorMessage) {
            this.errorMessage =
              'Error al cargar los pagos. Por favor, intente de nuevo.';
          }
          return of([]);
        }),
        finalize(() => {
          // Finalizamos la carga cuando se completan ambas operaciones
          this.isLoading = false;
        })
      )
      .subscribe((data) => {
        console.log('Pagos cargados:', data);
        this.pagos = data;
        this.calcularTotalIngresos();
        this.calcularBalance();
      });

    this.subscriptions.push(pagosSubscription);
  }

  calcularTotalIngresos(): void {
    this.totalIngresos = this.pagos.reduce((sum, pago) => sum + pago.monto, 0);
    console.log('Total ingresos calculado:', this.totalIngresos);
  }

  calcularTotalEgresos(): void {
    this.totalEgresos = this.gastos.reduce(
      (sum, gasto) => sum + gasto.importe_total,
      0
    );
    console.log('Total egresos calculado:', this.totalEgresos);
  }

  calcularBalance(): void {
    this.balance = this.totalIngresos - this.totalEgresos;
    console.log('Balance calculado:', this.balance);
  }

  buscarPorFechas(): void {
    console.log('Buscando por fechas personalizadas');
    this.cargarDatos();
  }
}
