import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TokenGeneratorComponent } from './token-generator/token-generator.component';
import { ApiTesterComponent } from './api-tester/api-tester.component';
import { ApiLogsComponent } from './api-logs/api-logs.component';

@Component({
  selector: 'app-external-api-dashboard',
  standalone: true,
  imports: [CommonModule, TokenGeneratorComponent, ApiTesterComponent, ApiLogsComponent],
  templateUrl: './external-api-dashboard.component.html',
  styleUrls: ['./external-api-dashboard.component.css']
})
export class ExternalApiDashboardComponent {
  constructor() {}
}
