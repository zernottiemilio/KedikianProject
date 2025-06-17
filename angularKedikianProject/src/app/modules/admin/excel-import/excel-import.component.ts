// excel-import.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

interface Operario {
  nombre: string;
  dni: string;
  horasNormales: number;
  horasFeriado: number;
  horasExtras: number;
  precioHoraNormal: number;
  precioHoraFeriado: number;
  precioHoraExtra: number;
  totalCalculado: number;
}

interface ConfiguracionTarifas {
  horaNormal: number;
  horaFeriado: number;
  horaExtra: number;
  multiplicadorExtra: number;
}

@Component({
  selector: 'app-excel-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './excel-import.component.html',
  styleUrls: ['./excel-import.component.css']
})
export class ExcelImportComponent implements OnInit {
  operarios: Operario[] = [];
  fileName: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  configuracion: ConfiguracionTarifas = {
    horaNormal: 6500,
    horaFeriado: 13000,
    horaExtra: 0,
    multiplicadorExtra: 1.5
  };

  ngOnInit() {
    this.calcularPrecioHoraExtra();
    // Cargar datos de ejemplo
    this.cargarDatosEjemplo();
  }

  cargarDatosEjemplo() {
    this.operarios = [
      {
        nombre: 'Juan Pérez',
        dni: '12345678',
        horasNormales: 160,
        horasFeriado: 8,
        horasExtras: 10,
        precioHoraNormal: this.configuracion.horaNormal,
        precioHoraFeriado: this.configuracion.horaFeriado,
        precioHoraExtra: this.configuracion.horaExtra,
        totalCalculado: 0
      },
      {
        nombre: 'María García',
        dni: '87654321',
        horasNormales: 170,
        horasFeriado: 0,
        horasExtras: 5,
        precioHoraNormal: this.configuracion.horaNormal,
        precioHoraFeriado: this.configuracion.horaFeriado,
        precioHoraExtra: this.configuracion.horaExtra,
        totalCalculado: 0
      }
    ];
    this.recalcularTodos();
  }

  calcularPrecioHoraExtra() {
    this.configuracion.horaExtra = this.configuracion.horaNormal * this.configuracion.multiplicadorExtra;
  }

  agregarOperario() {
    const nuevoOperario: Operario = {
      nombre: '',
      dni: '',
      horasNormales: 0,
      horasFeriado: 0,
      horasExtras: 0,
      precioHoraNormal: this.configuracion.horaNormal,
      precioHoraFeriado: this.configuracion.horaFeriado,
      precioHoraExtra: this.configuracion.horaExtra,
      totalCalculado: 0
    };
    this.operarios.push(nuevoOperario);
  }

  eliminarOperario(index: number) {
    this.operarios.splice(index, 1);
  }

  calcularTotal(operario: Operario): number {
    const totalNormal = operario.horasNormales * operario.precioHoraNormal;
    const totalFeriado = operario.horasFeriado * operario.precioHoraFeriado;
    const totalExtra = operario.horasExtras * operario.precioHoraExtra;
    
    return totalNormal + totalFeriado + totalExtra;
  }

  recalcularTodos() {
    this.calcularPrecioHoraExtra();
    
    this.operarios.forEach(operario => {
      operario.precioHoraNormal = this.configuracion.horaNormal;
      operario.precioHoraFeriado = this.configuracion.horaFeriado;
      operario.precioHoraExtra = this.configuracion.horaExtra;
      operario.totalCalculado = this.calcularTotal(operario);
    });
  }

  getTotalGeneral(): number {
    return this.operarios.reduce((total, operario) => total + operario.totalCalculado, 0);
  }

  exportarResultados(): void {
    if (this.operarios.length === 0) {
      this.errorMessage = 'No hay datos de operarios para exportar.';
      return;
    }

    this.errorMessage = '';

    // Calcular las sumas totales de horas de todos los operarios
    let totalHorasNormales = this.operarios.reduce((sum, op) => sum + op.horasNormales, 0);
    let totalHorasFeriado = this.operarios.reduce((sum, op) => sum + op.horasFeriado, 0);
    let totalHorasExtras = this.operarios.reduce((sum, op) => sum + op.horasExtras, 0);

    // Calcular los valores remunerativos basados en el formato de la imagen
    const basicValue = this.configuracion.horaNormal;
    const basicRemunerativo = totalHorasNormales * basicValue;

    // Calcular el 20% del valor total de las horas comunes
    const perfectAttendancePercentage = 0.20;
    const perfectAttendanceRemunerativo = basicRemunerativo * perfectAttendancePercentage;

    const holidayHoursValue = this.configuracion.horaFeriado;
    const holidayHoursRemunerativo = totalHorasFeriado * holidayHoursValue;

    const extraHoursValue = this.configuracion.horaNormal * this.configuracion.multiplicadorExtra;
    const extraHoursRemunerativo = totalHorasExtras * extraHoursValue;

    // Calcular el total remunerativo final sumando todos los componentes
    const totalRemunerativoFinal = basicRemunerativo + perfectAttendanceRemunerativo + holidayHoursRemunerativo + extraHoursRemunerativo;

    // Helper para formatear moneda para la exportación a Excel
    const formatCurrencyForExcel = (value: number) => {
      return `$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    };

    // Construir los datos para la hoja de Excel según el formato de la imagen
    const excelData = [
      ['', '', '', 'Vijande mayo 2025', ''], // Fila de título, se fusionará sobre D y E
      ['Concepto', 'Unidades', 'Valor', 'Remunerativo', 'Adelantos'],
      ['Basico', totalHorasNormales, formatCurrencyForExcel(basicValue), formatCurrencyForExcel(basicRemunerativo), ''],
      ['Asistencia perfecta (20%)', `${perfectAttendancePercentage * 100}%`, formatCurrencyForExcel(basicRemunerativo), formatCurrencyForExcel(perfectAttendanceRemunerativo), ''],
      ['Pago feriado', totalHorasFeriado, formatCurrencyForExcel(holidayHoursValue), formatCurrencyForExcel(holidayHoursRemunerativo), ''],
      ['Horas extras', totalHorasExtras, formatCurrencyForExcel(extraHoursValue), formatCurrencyForExcel(extraHoursRemunerativo), ''],
      ['', '', 'Total', formatCurrencyForExcel(totalRemunerativoFinal), formatCurrencyForExcel(this.getTotalGeneral())],
      ['', '', '', 'Total', formatCurrencyForExcel(totalRemunerativoFinal)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Fusionar celdas para el título "Vijande mayo 2025" (D1:E1)
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(XLSX.utils.decode_range('D1:E1'));

    // Establecer anchos de columna para un mejor formato
    ws['!cols'] = [
      { wch: 20 }, // Concepto
      { wch: 15 }, // Unidades
      { wch: 15 }, // Valor
      { wch: 20 }, // Remunerativo
      { wch: 20 }  // Adelantos
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen de Sueldos');
    XLSX.writeFile(wb, 'resumen_sueldos.xlsx');
  }

  limpiarDatos() {
    this.operarios = [];
    this.errorMessage = '';
  }
}