// Enumeraciones
export enum EstadoCotizacion {
  BORRADOR = 'borrador',
  ENVIADA = 'enviada',
  APROBADA = 'aprobada'
}

// Interfaces
export interface Cliente {
  id?: number;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  oculto?: boolean;
  ocultar_al_aprobar?: boolean;
  created?: string;
  updated?: string;
}

export interface ServicioPredefinido {
  nombre: string;
  precio_por_defecto: number;
  unidad: string;
  tipo: 'arido' | 'maquina'; // Para diferenciar áridos de máquinas
}

export interface CotizacionItem {
  id?: number;
  cotizacion_id?: number;
  nombre_servicio: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created?: string;
  updated?: string;
}

export interface Cotizacion {
  id: number;
  cliente_id: number;
  cliente?: Cliente; // Información completa del cliente
  fecha_creacion: string;
  fecha_validez: string;
  estado: EstadoCotizacion;
  observaciones?: string;
  importe_total: number;
  items: CotizacionItem[];
  created: string;
  updated: string;
}

export interface CotizacionCreate {
  cliente_id: number;
  fecha_validez: string;
  observaciones?: string;
  items: CotizacionItemCreate[];
}

export interface CotizacionItemCreate {
  nombre_servicio: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
}

export interface CotizacionUpdate {
  estado?: EstadoCotizacion;
  observaciones?: string;
  fecha_validez?: string;
}

// Interfaces para respuestas del backend
export interface ClienteOut extends Cliente {
  id: number;
}

export interface CotizacionItemOut extends CotizacionItem {
  id: number;
  subtotal: number; // Calculado en backend
}

export interface CotizacionOut extends Cotizacion {
  id: number;
  items: CotizacionItemOut[];
}
