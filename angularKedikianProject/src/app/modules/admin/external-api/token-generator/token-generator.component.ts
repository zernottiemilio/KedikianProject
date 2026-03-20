import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExternalApiService } from '../../../../core/services/external-api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-token-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './token-generator.component.html',
  styleUrls: ['./token-generator.component.css']
})
export class TokenGeneratorComponent {
  systemName: string = '';
  sharedSecret: string = '';
  generatedToken: string = '';
  expiresIn: number = 0;
  isLoading: boolean = false;
  showPassword: boolean = false;
  errorMessage: string = '';

  constructor(
    private externalApiService: ExternalApiService,
    private toastr: ToastrService
  ) {}

  generateToken(): void {
    // Validar campos
    if (!this.systemName.trim() || !this.sharedSecret.trim()) {
      this.errorMessage = 'Por favor complete todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.externalApiService.generateToken(this.systemName, this.sharedSecret).subscribe({
      next: (response) => {
        this.generatedToken = response.access_token;
        this.expiresIn = response.expires_in;
        this.isLoading = false;
        this.toastr.success('Token generado exitosamente', 'Éxito');
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Error al generar el token. Verifique las credenciales.';
        this.toastr.error(this.errorMessage, 'Error');
      }
    });
  }

  copyToClipboard(): void {
    if (!this.generatedToken) return;

    navigator.clipboard.writeText(this.generatedToken).then(() => {
      this.toastr.success('Token copiado al portapapeles', 'Copiado');
    }).catch(() => {
      this.toastr.error('Error al copiar el token', 'Error');
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  clearForm(): void {
    this.systemName = '';
    this.sharedSecret = '';
    this.generatedToken = '';
    this.expiresIn = 0;
    this.errorMessage = '';
    this.externalApiService.clearToken();
  }

  getExpirationMinutes(): number {
    return Math.floor(this.expiresIn / 60);
  }
}
