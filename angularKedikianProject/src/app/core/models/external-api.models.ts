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
