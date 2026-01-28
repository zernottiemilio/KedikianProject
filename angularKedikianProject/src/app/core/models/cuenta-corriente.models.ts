// Interfaces para el módulo de Cuenta Corriente / Final de Obra

// Detalle de áridos con precio
export interface DetalleAridoConPrecio {
  tipo_arido: string;
  cantidad: number; // m³
  precio_unitario: number; // precio por m³
  importe: number; // cantidad * precio_unitario
}

// Detalle de horas de máquinas con tarifa
export interface DetalleHorasConTarifa {
  maquina_id: number;
  maquina_nombre: string;
  total_horas: number;
  tarifa_hora: number; // tarifa por hora
  importe: number; // total_horas * tarifa_hora
}

// Resumen completo del proyecto
export interface ResumenCuentaCorriente {
  proyecto_id: number;
  proyecto_nombre: string;
  periodo_inicio: string;
  periodo_fin: string;

  // Detalle de áridos
  aridos: DetalleAridoConPrecio[];
  total_aridos_m3: number;
  total_importe_aridos: number;

  // Detalle de horas de máquinas
  horas_maquinas: DetalleHorasConTarifa[];
  total_horas: number;
  total_importe_horas: number;

  // Total general
  importe_total: number;
}

// Reporte de cuenta corriente
export interface ReporteCuentaCorriente {
  id: number;
  proyecto_id: number;
  periodo_inicio: string;
  periodo_fin: string;
  total_aridos: number;
  total_horas: number;
  importe_aridos: number;
  importe_horas: number;
  importe_total: number;
  estado: EstadoPago;
  fecha_generacion: string;
  observaciones?: string;
  numero_factura?: string;
  fecha_pago?: string;
  created?: string;
  updated?: string;
}

export enum EstadoPago {
  PENDIENTE = 'pendiente',
  PAGADO = 'pagado',
  PARCIAL = 'parcial'
}

export interface FiltrosCuentaCorriente {
  proyecto_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface RequestGenerarReporte {
  proyecto_id: number;
  periodo_inicio: string;
  periodo_fin: string;
  observaciones?: string;
}

export interface RequestActualizarEstado {
  estado: EstadoPago;
  observaciones?: string;
}
