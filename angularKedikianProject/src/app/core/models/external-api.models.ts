export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: any;
  total?: number;
}

export interface ApiLogEntry {
  id: string;
  metodo: string;
  recurso: string;
  estado: boolean;
  timestamp: Date;
}

// Modelos para la vista del cliente
export interface ClientProjectView {
  id: number;
  nombre: string;
  estado: string; // "EN PROGRESO", "COMPLETADO", "PENDIENTE"
  descripcion: string;
  fecha_inicio: string;
  ubicacion: string;
  maquinas_asignadas: ClientMaquinaView[];
  total_horas_maquinas: number;
  aridos_utilizados: ClientAridoView[];
  total_aridos: number;
}

export interface ClientMaquinaView {
  nombre: string;
  horas_trabajadas: number;
}

export interface ClientAridoView {
  tipo: string;
  cantidad: number;
  unidad: string;
  cantidad_registros: number;
}
