import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExternalApiService } from '../../../../core/services/external-api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-api-tester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './api-tester.component.html',
  styleUrls: ['./api-tester.component.css']
})
export class ApiTesterComponent implements OnInit {
  recursos = ['maquinaria', 'cliente', 'cuenta', 'reporte'];
  metodos = ['GET', 'POST'];

  selectedRecurso: string = 'maquinaria';
  selectedMetodo: string = 'GET';
  resourceId: number | null = null;
  payloadJson: string = '{}';

  isLoading: boolean = false;
  hasToken: boolean = false;
  responseData: any = null;
  responseSuccess: boolean | null = null;
  errorMessage: string = '';

  constructor(
    private externalApiService: ExternalApiService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Suscribirse al token para habilitar/deshabilitar el botón
    this.externalApiService.currentToken$.subscribe(token => {
      this.hasToken = !!token;
    });
  }

  ejecutarLlamada(): void {
    if (!this.hasToken) {
      this.toastr.warning('Debe generar un token primero', 'Advertencia');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.responseData = null;
    this.responseSuccess = null;

    if (this.selectedMetodo === 'GET') {
      this.ejecutarGet();
    } else if (this.selectedMetodo === 'POST') {
      this.ejecutarPost();
    }
  }

  private ejecutarGet(): void {
    const id = this.resourceId !== null && this.resourceId !== undefined ? this.resourceId : undefined;

    this.externalApiService.getRecursos(this.selectedRecurso, id).subscribe({
      next: (response) => {
        this.responseData = response.data;
        this.responseSuccess = response.success;
        this.isLoading = false;
        this.toastr.success('Llamada ejecutada exitosamente', 'Éxito');
      },
      error: (error) => {
        this.isLoading = false;
        this.responseSuccess = false;
        this.errorMessage = error.error?.message || 'Error al realizar la llamada';
        this.responseData = error.error || { error: 'Error desconocido' };
        this.toastr.error(this.errorMessage, 'Error');
      }
    });
  }

  private ejecutarPost(): void {
    let payload: any;

    try {
      payload = JSON.parse(this.payloadJson);
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = 'JSON inválido en el payload';
      this.toastr.error(this.errorMessage, 'Error');
      return;
    }

    this.externalApiService.postRecurso(this.selectedRecurso, payload).subscribe({
      next: (response) => {
        this.responseData = response.data;
        this.responseSuccess = response.success;
        this.isLoading = false;
        this.toastr.success('Llamada ejecutada exitosamente', 'Éxito');
      },
      error: (error) => {
        this.isLoading = false;
        this.responseSuccess = false;
        this.errorMessage = error.error?.message || 'Error al realizar la llamada';
        this.responseData = error.error || { error: 'Error desconocido' };
        this.toastr.error(this.errorMessage, 'Error');
      }
    });
  }

  getFormattedResponse(): string {
    if (!this.responseData) return '';
    return JSON.stringify(this.responseData, null, 2);
  }

  limpiarRespuesta(): void {
    this.responseData = null;
    this.responseSuccess = null;
    this.errorMessage = '';
  }

  onMetodoChange(): void {
    // Limpiar respuesta al cambiar método
    this.limpiarRespuesta();
  }
}
