// excel-import.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { UserService } from '../../../core/services/user.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { lastValueFrom } from 'rxjs';

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

interface ResumenSueldo {
  id?: number;
  nombre: string;
  dni: string;
  periodo: string;
  total_horas_normales: number;
  total_horas_feriado: number;
  total_horas_extras: number;
  basico_remunerativo: number;
  asistencia_perfecta_remunerativo: number;
  feriado_remunerativo: number;
  extras_remunerativo: number;
  total_remunerativo: number;
  observaciones: string;
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
  successMessage: string = '';
  observaciones: string = '';
  resumenes: ResumenSueldo[] = [];
  modalEditarResumenAbierto: boolean = false;
  resumenEditando: ResumenSueldo | null = null;

  configuracion: ConfiguracionTarifas = {
    horaNormal: 6500,
    horaFeriado: 13000,
    horaExtra: 9750,
    multiplicadorExtra: 1.5
  };

  private apiBaseUrl = environment.apiUrl;

  constructor(private userService: UserService, private http: HttpClient) {}

  ngOnInit() {
    this.calcularPrecioHoraExtra();
    this.cargarConfiguracion();
    this.cargarResumenes();
  }

  cargarOperariosDesdeBackend() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.operarios = users
          .filter(user => {
            const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
            return roles.includes('operario');
          })
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
        this.successMessage = `${this.operarios.length} operarios cargados exitosamente`;
        
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error al cargar operarios:', error);
        this.errorMessage = 'Error al cargar operarios desde el backend.';
        this.isLoading = false;
      }
    });
  }

  calcularPrecioHoraExtra() {
    // Ya no se calcula automáticamente, es editable
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
    if (confirm('¿Estás seguro de eliminar este operario de la lista?')) {
      this.operarios.splice(index, 1);
    }
  }

  calcularTotal(operario: Operario): number {
    const totalNormal = operario.horasNormales * operario.precioHoraNormal;
    const totalFeriado = operario.horasFeriado * operario.precioHoraFeriado;
    const totalExtra = operario.horasExtras * operario.precioHoraExtra;
    
    // El total incluye asistencia perfecta (20% del básico)
    const basicoConAsistencia = totalNormal * 1.20;
    
    return basicoConAsistencia + totalFeriado + totalExtra;
  }

  recalcularTodos() {
    // Ya no se calcula el precio extra automáticamente

    this.operarios.forEach(operario => {
      operario.precioHoraNormal = this.configuracion.horaNormal;
      operario.precioHoraFeriado = this.configuracion.horaFeriado;
      operario.precioHoraExtra = this.configuracion.horaExtra;
      operario.totalCalculado = this.calcularTotal(operario);
    });

    // Guardar la configuración automáticamente cuando cambia
    this.guardarConfiguracion();
  }

  getTotalGeneral(): number {
    const totalOperarios = this.operarios.reduce((total, operario) => total + operario.totalCalculado, 0);
    const totalResumenes = this.resumenes.reduce((total, resumen) => total + (resumen.total_remunerativo || 0), 0);
    return totalOperarios + totalResumenes;
  }

  exportarResultados(): void {
    if (this.operarios.length === 0 && this.resumenes.length === 0) {
      this.errorMessage = 'No hay datos para exportar.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.errorMessage = '';

    // Sumar operarios actuales + resumenes guardados
    const totalHorasNormales = 
      this.operarios.reduce((sum, op) => sum + op.horasNormales, 0) +
      this.resumenes.reduce((sum, res) => sum + res.total_horas_normales, 0);
    
    const totalHorasFeriado = 
      this.operarios.reduce((sum, op) => sum + op.horasFeriado, 0) +
      this.resumenes.reduce((sum, res) => sum + res.total_horas_feriado, 0);
    
    const totalHorasExtras = 
      this.operarios.reduce((sum, op) => sum + op.horasExtras, 0) +
      this.resumenes.reduce((sum, res) => sum + res.total_horas_extras, 0);

    const valorHoraNormal = this.configuracion.horaNormal;
    const basicoRemunerativo = totalHorasNormales * valorHoraNormal;

    // CORRECCIÓN: Asistencia perfecta es el 20% del básico
    const porcentajeAsistencia = 0.20;
    const asistenciaRemunerativo = basicoRemunerativo * porcentajeAsistencia;

    const valorHoraFeriado = this.configuracion.horaFeriado;
    const feriadoRemunerativo = totalHorasFeriado * valorHoraFeriado;

    const valorHoraExtra = this.configuracion.horaExtra;
    const extrasRemunerativo = totalHorasExtras * valorHoraExtra;

    const totalRemunerativoFinal = basicoRemunerativo + asistenciaRemunerativo + feriadoRemunerativo + extrasRemunerativo;

    const formatCurrencyForExcel = (value: number) => {
      return `$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    };

    const now = new Date();
    const mesAnio = now.toLocaleString('es-AR', { month: 'long', year: 'numeric' });

    const excelData = [
      ['', '', '', `Vijande ${mesAnio}`, ''],
      ['Concepto', 'Unidades', 'Valor', 'Remunerativo', 'Adelantos'],
      ['Basico', totalHorasNormales, formatCurrencyForExcel(basicoRemunerativo), formatCurrencyForExcel(basicoRemunerativo), ''],
      ['Asistencia perfecta (20%)', '20%', formatCurrencyForExcel(asistenciaRemunerativo), formatCurrencyForExcel(asistenciaRemunerativo), ''],
      ['Pago feriado', totalHorasFeriado, formatCurrencyForExcel(feriadoRemunerativo), formatCurrencyForExcel(feriadoRemunerativo), ''],
      ['Horas extras', totalHorasExtras, formatCurrencyForExcel(extrasRemunerativo), formatCurrencyForExcel(extrasRemunerativo), ''],
      ['', '', 'Total', formatCurrencyForExcel(totalRemunerativoFinal), ''],
      ['', '', '', 'Total', formatCurrencyForExcel(totalRemunerativoFinal)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(excelData);

    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(XLSX.utils.decode_range('D1:E1'));

    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen de Sueldos');
    
    const periodo = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    XLSX.writeFile(wb, `resumen_sueldos_${periodo}.xlsx`);
    
    this.successMessage = 'Archivo Excel exportado exitosamente';
    setTimeout(() => this.successMessage = '', 3000);
  }

  exportarOperarioIndividual(operario: Operario): void {
    const valorHoraNormal = operario.precioHoraNormal;
    const basicoRemunerativo = operario.horasNormales * valorHoraNormal;
    const asistenciaRemunerativo = basicoRemunerativo * 0.20;
    const feriadoRemunerativo = operario.horasFeriado * operario.precioHoraFeriado;
    const extrasRemunerativo = operario.horasExtras * operario.precioHoraExtra;
    const totalRemunerativo = basicoRemunerativo + asistenciaRemunerativo + feriadoRemunerativo + extrasRemunerativo;

    const formatCurrencyForExcel = (value: number) => {
      return `$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    };

    const now = new Date();
    const mesAnio = now.toLocaleString('es-AR', { month: 'long', year: 'numeric' });

    const excelData = [
      ['', '', '', `Vijande ${mesAnio}`, ''],
      ['Operario:', operario.nombre, '', 'DNI:', operario.dni],
      ['', '', '', '', ''],
      ['Concepto', 'Unidades', 'Valor', 'Remunerativo', 'Adelantos'],
      ['Basico', operario.horasNormales, formatCurrencyForExcel(basicoRemunerativo), formatCurrencyForExcel(basicoRemunerativo), ''],
      ['Asistencia perfecta (20%)', '20%', formatCurrencyForExcel(asistenciaRemunerativo), formatCurrencyForExcel(asistenciaRemunerativo), ''],
      ['Pago feriado', operario.horasFeriado, formatCurrencyForExcel(feriadoRemunerativo), formatCurrencyForExcel(feriadoRemunerativo), ''],
      ['Horas extras', operario.horasExtras, formatCurrencyForExcel(extrasRemunerativo), formatCurrencyForExcel(extrasRemunerativo), ''],
      ['', '', 'Total', formatCurrencyForExcel(totalRemunerativo), ''],
      ['', '', '', 'Total', formatCurrencyForExcel(totalRemunerativo)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(excelData);

    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(XLSX.utils.decode_range('D1:E1'));

    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen de Sueldo');
    
    const periodo = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const nombreArchivo = `sueldo_${operario.nombre.replace(/\s+/g, '_')}_${periodo}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
    
    this.successMessage = `Excel de ${operario.nombre} exportado exitosamente`;
    setTimeout(() => this.successMessage = '', 3000);
  }

  exportarResumenIndividual(resumen: ResumenSueldo): void {
    const formatCurrencyForExcel = (value: number) => {
      return `$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    };

    const now = new Date();
    const mesAnio = now.toLocaleString('es-AR', { month: 'long', year: 'numeric' });

    const excelData = [
      ['', '', '', `${mesAnio}`, ''],
      ['Operario:', resumen.nombre, '', 'DNI:', resumen.dni],
      ['', '', '', '', ''],
      ['Concepto', 'Unidades', 'Valor', 'Remunerativo', 'Adelantos'],
      ['Basico', resumen.total_horas_normales, formatCurrencyForExcel(resumen.basico_remunerativo), formatCurrencyForExcel(resumen.basico_remunerativo), ''],
      ['Asistencia perfecta (20%)', '20%', formatCurrencyForExcel(resumen.asistencia_perfecta_remunerativo), formatCurrencyForExcel(resumen.asistencia_perfecta_remunerativo), ''],
      ['Pago feriado', resumen.total_horas_feriado, formatCurrencyForExcel(resumen.feriado_remunerativo), formatCurrencyForExcel(resumen.feriado_remunerativo), ''],
      ['Horas extras', resumen.total_horas_extras, formatCurrencyForExcel(resumen.extras_remunerativo), formatCurrencyForExcel(resumen.extras_remunerativo), ''],
      ['', '', 'Total', formatCurrencyForExcel(resumen.total_remunerativo), ''],
      ['', '', '', 'Total', formatCurrencyForExcel(resumen.total_remunerativo)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(excelData);

    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(XLSX.utils.decode_range('D1:E1'));

    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen de Sueldo');
    
    const nombreArchivo = `sueldo_${resumen.nombre.replace(/\s+/g, '_')}_${resumen.periodo}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
    
    this.successMessage = `Excel de ${resumen.nombre} exportado exitosamente`;
    setTimeout(() => this.successMessage = '', 3000);
  }

  limpiarDatos() {
    if (this.operarios.length === 0) {
      this.errorMessage = 'No hay datos para limpiar';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    if (confirm('¿Estás seguro de limpiar todos los operarios de la lista? Esta acción no se puede deshacer.')) {
      this.operarios = [];
      this.errorMessage = '';
      this.successMessage = 'Lista de operarios limpiada';
      setTimeout(() => this.successMessage = '', 3000);
    }
  }

  async guardarResumenSueldo() {
    if (this.operarios.length === 0) {
      this.errorMessage = 'No hay operarios para guardar.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const operariosSinDatos = this.operarios.filter(op => !op.nombre.trim() || !op.dni.trim());
    if (operariosSinDatos.length > 0) {
      this.errorMessage = `${operariosSinDatos.length} operario(s) no tienen nombre o DNI. Por favor completa todos los campos.`;
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    const operariosConHoras = this.operarios.filter(op => 
      op.horasNormales > 0 || op.horasFeriado > 0 || op.horasExtras > 0
    );
    
    if (operariosConHoras.length === 0) {
      this.errorMessage = 'Ningún operario tiene horas registradas. Por favor agrega horas antes de guardar.';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const now = new Date();
    const periodo = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const resumenesOperarios: ResumenSueldo[] = this.operarios.map(operario => {
      const basico_remunerativo = operario.horasNormales * this.configuracion.horaNormal;
      const asistencia_perfecta_remunerativo = basico_remunerativo * 0.20;
      const feriado_remunerativo = operario.horasFeriado * this.configuracion.horaFeriado;
      const extras_remunerativo = operario.horasExtras * operario.precioHoraExtra;
      const total_remunerativo = basico_remunerativo + asistencia_perfecta_remunerativo + feriado_remunerativo + extras_remunerativo;

      return {
        periodo,
        nombre: operario.nombre.trim(),
        dni: operario.dni.trim(),
        total_horas_normales: Number(operario.horasNormales.toFixed(2)),
        total_horas_feriado: Number(operario.horasFeriado.toFixed(2)),
        total_horas_extras: Number(operario.horasExtras.toFixed(2)),
        basico_remunerativo: Number(basico_remunerativo.toFixed(2)),
        asistencia_perfecta_remunerativo: Number(asistencia_perfecta_remunerativo.toFixed(2)),
        feriado_remunerativo: Number(feriado_remunerativo.toFixed(2)),
        extras_remunerativo: Number(extras_remunerativo.toFixed(2)),
        total_remunerativo: Number(total_remunerativo.toFixed(2)),
        observaciones: this.observaciones?.trim() || `Sueldo correspondiente a ${now.toLocaleString('es-AR', { month: 'long', year: 'numeric' })}`
      };
    });

    try {
      let guardadosExitosos = 0;
      let errores = 0;
      const erroresDetalle: string[] = [];

      for (const resumen of resumenesOperarios) {
        try {
          await lastValueFrom(this.http.post(`${this.apiBaseUrl}/excel/resumen-sueldo`, resumen));
          guardadosExitosos++;
        } catch (error: any) {
          console.error(`Error al guardar operario ${resumen.nombre}:`, error);
          errores++;
          erroresDetalle.push(`${resumen.nombre}: ${error.error?.detail || 'Error desconocido'}`);
        }
      }

      this.isLoading = false;

      if (errores === 0) {
        this.successMessage = `¡${guardadosExitosos} registros de sueldos guardados exitosamente!`;
        this.limpiarDatos();
        this.cargarResumenes();
        setTimeout(() => this.successMessage = '', 5000);
      } else {
        this.errorMessage = `Se guardaron ${guardadosExitosos} registros, pero ${errores} fallaron.`;
        console.error('Detalles de errores:', erroresDetalle);
        this.cargarResumenes();
        setTimeout(() => this.errorMessage = '', 5000);
      }

    } catch (error) {
      this.isLoading = false;
      this.errorMessage = 'Error inesperado al guardar los resúmenes de sueldos.';
      console.error('Error general:', error);
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  cargarResumenes() {
    this.http.get<ResumenSueldo[]>(`${this.apiBaseUrl}/excel/resumen-sueldo`).subscribe({
      next: (data) => {
        const now = new Date();
        const periodoActual = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        this.resumenes = data.filter(res => res.periodo === periodoActual);
      },
      error: (error) => {
        console.error('Error al cargar resúmenes:', error);
        this.errorMessage = 'Error al cargar los resúmenes de sueldo desde el backend.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  cargarConfiguracion() {
    this.http.get<ConfiguracionTarifas>(`${this.apiBaseUrl}/excel/configuracion-tarifas`).subscribe({
      next: (config) => {
        this.configuracion.horaNormal = config.horaNormal;
        this.configuracion.horaFeriado = config.horaFeriado;
        this.configuracion.horaExtra = config.horaExtra;
        this.configuracion.multiplicadorExtra = config.multiplicadorExtra;
        console.log('Configuración cargada desde el backend:', config);
      },
      error: (error) => {
        console.log('No se pudo cargar configuración guardada, usando valores por defecto:', error);
        // Mantener los valores por defecto que ya están en this.configuracion
      }
    });
  }

  guardarConfiguracion() {
    this.http.post(`${this.apiBaseUrl}/excel/configuracion-tarifas`, this.configuracion).subscribe({
      next: () => {
        console.log('Configuración guardada exitosamente');
        this.successMessage = 'Tarifas guardadas correctamente';
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (error) => {
        console.error('Error al guardar configuración:', error);
        this.errorMessage = 'Error al guardar las tarifas';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  eliminarResumen(resumen: ResumenSueldo) {
    if (confirm(`¿Estás seguro de que deseas eliminar el registro de ${resumen.nombre}?`)) {
      this.http.delete(`${this.apiBaseUrl}/excel/resumen-sueldo/${resumen.id}`).subscribe({
        next: () => {
          this.successMessage = 'Registro eliminado exitosamente';
          this.cargarResumenes();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.errorMessage = 'Error al eliminar el registro de resumen de sueldo.';
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  editarResumen(resumen: ResumenSueldo) {
    this.resumenEditando = { ...resumen };
    this.modalEditarResumenAbierto = true;
  }

  cerrarModalEditarResumen() {
    this.modalEditarResumenAbierto = false;
    this.resumenEditando = null;
  }

  guardarEdicionResumen() {
    if (!this.resumenEditando?.id) return;

    const totalCalculado = 
      Number(this.resumenEditando.basico_remunerativo) + 
      Number(this.resumenEditando.asistencia_perfecta_remunerativo) + 
      Number(this.resumenEditando.feriado_remunerativo) + 
      Number(this.resumenEditando.extras_remunerativo);

    this.resumenEditando.total_remunerativo = Number(totalCalculado.toFixed(2));

    this.http.put(`${this.apiBaseUrl}/excel/resumen-sueldo/${this.resumenEditando.id}`, this.resumenEditando).subscribe({
      next: () => {
        this.successMessage = 'Registro actualizado exitosamente';
        this.cargarResumenes();
        this.cerrarModalEditarResumen();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error al actualizar:', error);
        this.errorMessage = 'Error al guardar los cambios del resumen.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }
}