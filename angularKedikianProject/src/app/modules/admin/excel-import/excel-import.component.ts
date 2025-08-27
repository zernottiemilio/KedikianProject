// excel-import.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { UserService } from '../../../core/services/user.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment'; // <-- Importar environment

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
  email?: string;
  estado?: boolean;
  roles?: string[];
  hash_contrasena?: string;
  fecha_creacion?: string;
  id?: number | string;
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
  observaciones: string = '';
  resumenes: any[] = [];
  modalEditarResumenAbierto: boolean = false;
  resumenEditando: any = null;

  configuracion: ConfiguracionTarifas = {
    horaNormal: 6500,
    horaFeriado: 13000,
    horaExtra: 0,
    multiplicadorExtra: 1.5
  };

  // URL base del backend desde environment
  private apiBaseUrl = environment.apiUrl;

  constructor(private userService: UserService, private http: HttpClient) {}

  ngOnInit() {
    this.calcularPrecioHoraExtra();
    this.cargarResumenes();
  }

  cargarOperariosDesdeBackend() {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.operarios = users
          .filter(user => Array.isArray(user.roles) ? user.roles.includes('operario') : user.roles === 'operario')
          .filter(user => user.estado)
          .map(user => ({
            nombre: user.nombre,
            dni: user.id ? user.id.toString() : '',
            horasNormales: 0,
            horasFeriado: 0,
            horasExtras: 0,
            precioHoraNormal: this.configuracion.horaNormal,
            precioHoraFeriado: this.configuracion.horaFeriado,
            precioHoraExtra: this.configuracion.horaExtra,
            totalCalculado: 0,
            email: user.email || '',
            estado: user.estado !== undefined ? user.estado : true,
            roles: Array.isArray(user.roles) ? user.roles : [user.roles || 'operario'],
            hash_contrasena: user.hash_contrasena || '',
            fecha_creacion: typeof user.fecha_creacion === 'string' ? user.fecha_creacion : (new Date()).toISOString(),
            id: user.id
          }));
        this.recalcularTodos();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar operarios desde el backend.';
        this.isLoading = false;
      }
    });
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
      totalCalculado: 0,
      email: '',
      estado: true,
      roles: ['operario'],
      hash_contrasena: '',
      fecha_creacion: (new Date()).toISOString(),
      id: undefined
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

    const totalHorasNormales = this.operarios.reduce((sum, op) => sum + op.horasNormales, 0);
    const totalHorasFeriado = this.operarios.reduce((sum, op) => sum + op.horasFeriado, 0);
    const totalHorasExtras = this.operarios.reduce((sum, op) => sum + op.horasExtras, 0);

    const basicValue = this.configuracion.horaNormal;
    const basicRemunerativo = totalHorasNormales * basicValue;

    const perfectAttendancePercentage = 0.20;
    const perfectAttendanceRemunerativo = basicRemunerativo * perfectAttendancePercentage;

    const holidayHoursValue = this.configuracion.horaFeriado;
    const holidayHoursRemunerativo = totalHorasFeriado * holidayHoursValue;

    const extraHoursValue = this.configuracion.horaNormal * this.configuracion.multiplicadorExtra;
    const extraHoursRemunerativo = totalHorasExtras * extraHoursValue;

    const totalRemunerativoFinal = basicRemunerativo + perfectAttendanceRemunerativo + holidayHoursRemunerativo + extraHoursRemunerativo;

    const formatCurrencyForExcel = (value: number) => {
      return `$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    };

    const excelData = [
      ['', '', '', 'Vijande mayo 2025', ''],
      ['Concepto', 'Unidades', 'Valor', 'Remunerativo', 'Adelantos'],
      ['Basico', totalHorasNormales, formatCurrencyForExcel(basicValue), formatCurrencyForExcel(basicRemunerativo), ''],
      ['Asistencia perfecta (20%)', `${perfectAttendancePercentage * 100}%`, formatCurrencyForExcel(basicRemunerativo), formatCurrencyForExcel(perfectAttendanceRemunerativo), ''],
      ['Pago feriado', totalHorasFeriado, formatCurrencyForExcel(holidayHoursValue), formatCurrencyForExcel(holidayHoursRemunerativo), ''],
      ['Horas extras', totalHorasExtras, formatCurrencyForExcel(extraHoursValue), formatCurrencyForExcel(extraHoursRemunerativo), ''],
      ['', '', 'Total', formatCurrencyForExcel(totalRemunerativoFinal), formatCurrencyForExcel(this.getTotalGeneral())],
      ['', '', '', 'Total', formatCurrencyForExcel(totalRemunerativoFinal)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(excelData);

    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(XLSX.utils.decode_range('D1:E1'));

    ws['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen de Sueldos');
    XLSX.writeFile(wb, 'resumen_sueldos.xlsx');
  }

  limpiarDatos() {
    this.operarios = [];
    this.errorMessage = '';
  }

  guardarResultados() {
    const now = new Date();
    const periodo = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    // Aquí podrías usar this.apiBaseUrl si decides enviar operarios individualmente
  }

  guardarResumenSueldo() {
    const now = new Date();
    const periodo = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const total_horas_normales = this.operarios.reduce((sum, op) => sum + op.horasNormales, 0);
    const total_horas_feriado = this.operarios.reduce((sum, op) => sum + op.horasFeriado, 0);
    const total_horas_extras = this.operarios.reduce((sum, op) => sum + op.horasExtras, 0);

    const basico_remunerativo = total_horas_normales * this.configuracion.horaNormal;
    const asistencia_perfecta_remunerativo = basico_remunerativo * 0.20;
    const feriado_remunerativo = total_horas_feriado * this.configuracion.horaFeriado;
    const extras_remunerativo = total_horas_extras * (this.configuracion.horaNormal * this.configuracion.multiplicadorExtra);

    const total_remunerativo = basico_remunerativo + asistencia_perfecta_remunerativo + feriado_remunerativo + extras_remunerativo;

    const resumen = {
      periodo,
      total_horas_normales,
      total_horas_feriado,
      total_horas_extras,
      basico_remunerativo,
      asistencia_perfecta_remunerativo,
      feriado_remunerativo,
      extras_remunerativo,
      total_remunerativo,
      observaciones: this.observaciones?.trim() || `Sueldo correspondiente a ${now.toLocaleString('es-AR', { month: 'long', year: 'numeric' })}`,
      nombre: this.operarios[0]?.nombre || '',
      dni: this.operarios[0]?.dni || ''
    };

    console.log('Payload enviado:', resumen);

    this.http.post(`${this.apiBaseUrl}/excel/resumen-sueldo`, resumen).subscribe({
      next: () => {
        this.errorMessage = '';
        alert('¡Resumen de sueldos guardado exitosamente!');
      },
      error: () => {
        this.errorMessage = 'Error al guardar el resumen de sueldos en la base de datos.';
      }
    });
  }

  cargarResumenes() {
    this.http.get<any[]>(`${this.apiBaseUrl}/excel/resumen-sueldo`).subscribe({
      next: (data) => {
        const now = new Date();
        const periodoActual = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        this.resumenes = data.filter(res => res.periodo === periodoActual);
      },
      error: () => {
        this.errorMessage = 'Error al cargar los resúmenes de sueldo desde el backend.';
      }
    });
  }

  eliminarResumen(resumen: any) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      this.http.delete(`${this.apiBaseUrl}/excel/resumen-sueldo/${resumen.id}`).subscribe({
        next: () => this.cargarResumenes(),
        error: () => this.errorMessage = 'Error al eliminar el registro de resumen de sueldo.'
      });
    }
  }

  editarResumen(resumen: any) {
    this.resumenEditando = { ...resumen };
    this.modalEditarResumenAbierto = true;
  }

  cerrarModalEditarResumen() {
    this.modalEditarResumenAbierto = false;
    this.resumenEditando = null;
  }

  guardarEdicionResumen() {
    if (!this.resumenEditando?.id) return;
    this.http.put(`${this.apiBaseUrl}/excel/resumen-sueldo/${this.resumenEditando.id}`, this.resumenEditando).subscribe({
      next: () => {
        this.cargarResumenes();
        this.cerrarModalEditarResumen();
      },
      error: () => this.errorMessage = 'Error al guardar los cambios del resumen.'
    });
  }
}
