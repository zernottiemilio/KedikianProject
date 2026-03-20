import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExternalApiService } from '../../../../core/services/external-api.service';
import { ApiLogEntry } from '../../../../core/models/external-api.models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-api-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './api-logs.component.html',
  styleUrls: ['./api-logs.component.css']
})
export class ApiLogsComponent implements OnInit {
  logs$: Observable<ApiLogEntry[]>;

  constructor(private externalApiService: ExternalApiService) {
    this.logs$ = this.externalApiService.logs$;
  }

  ngOnInit(): void {}

  limpiarLogs(): void {
    this.externalApiService.clearLogs();
  }

  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  getEstadoBadgeClass(estado: boolean): string {
    return estado ? 'badge-success' : 'badge-danger';
  }

  getEstadoText(estado: boolean): string {
    return estado ? 'Éxito' : 'Error';
  }

  getEstadoIcon(estado: boolean): string {
    return estado ? 'fas fa-check-circle' : 'fas fa-times-circle';
  }
}
