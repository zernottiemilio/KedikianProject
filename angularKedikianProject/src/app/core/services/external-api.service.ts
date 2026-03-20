import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenResponse, ApiResponse, ApiLogEntry } from '../models/external-api.models';

@Injectable({
  providedIn: 'root'
})
export class ExternalApiService {
  private apiUrl = `${environment.apiUrl}`;

  // Token actual generado
  private currentTokenSubject = new BehaviorSubject<string>('');
  public currentToken$ = this.currentTokenSubject.asObservable();

  // Logs de llamadas (solo sesión)
  private logsSubject = new BehaviorSubject<ApiLogEntry[]>([]);
  public logs$ = this.logsSubject.asObservable();

  private maxLogs = 50; // Máximo 50 entradas

  constructor(private http: HttpClient) {}

  /**
   * Genera un token JWT para el sistema externo
   * POST /auth/token?system_name=...&secret=...
   */
  generateToken(systemName: string, sharedSecret: string): Observable<TokenResponse> {
    const params = new HttpParams()
      .set('system_name', systemName)
      .set('secret', sharedSecret);

    return this.http.post<TokenResponse>(`${this.apiUrl}/auth/token`, null, { params }).pipe(
      tap((response: TokenResponse) => {
        this.currentTokenSubject.next(response.access_token);
      })
    );
  }

  /**
   * Consulta recursos vía la API externa
   * GET /api/v1/recursos?resource=...&id=...
   */
  getRecursos(resource: string, id?: number): Observable<ApiResponse> {
    const token = this.currentTokenSubject.value;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    let params = new HttpParams().set('resource', resource);
    if (id !== undefined && id !== null) {
      params = params.set('id', id.toString());
    }

    return this.http.get<ApiResponse>(`${this.apiUrl}/recursos`, { headers, params }).pipe(
      tap((response: ApiResponse) => {
        this.addLog('GET', resource + (id ? `/${id}` : ''), response.success);
      })
    );
  }

  /**
   * Envía un recurso de prueba
   * POST /api/v1/recursos
   */
  postRecurso(resource: string, payload: any): Observable<ApiResponse> {
    const token = this.currentTokenSubject.value;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const params = new HttpParams().set('resource', resource);

    return this.http.post<ApiResponse>(`${this.apiUrl}/recursos`, payload, { headers, params }).pipe(
      tap((response: ApiResponse) => {
        this.addLog('POST', resource, response.success);
      })
    );
  }

  /**
   * Obtiene el token actual
   */
  getCurrentToken(): string {
    return this.currentTokenSubject.value;
  }

  /**
   * Limpia el token actual
   */
  clearToken(): void {
    this.currentTokenSubject.next('');
  }

  /**
   * Agrega una entrada al log
   */
  private addLog(metodo: string, recurso: string, estado: boolean): void {
    const logs = this.logsSubject.value;
    const newLog: ApiLogEntry = {
      id: Date.now().toString(),
      metodo,
      recurso,
      estado,
      timestamp: new Date()
    };

    // Agregar al inicio y limitar a maxLogs entradas
    const updatedLogs = [newLog, ...logs].slice(0, this.maxLogs);
    this.logsSubject.next(updatedLogs);
  }

  /**
   * Limpia todos los logs
   */
  clearLogs(): void {
    this.logsSubject.next([]);
  }

  /**
   * Obtiene todos los logs
   */
  getLogs(): ApiLogEntry[] {
    return this.logsSubject.value;
  }
}
