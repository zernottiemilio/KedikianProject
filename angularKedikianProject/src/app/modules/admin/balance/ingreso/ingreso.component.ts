import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { BalanceService } from '../../../../core/services/balance.service';
import { ProjectService, Project } from '../../../../core/services/project.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SummarySelectorComponent, SummarySelectorConfig } from '../../../../shared/components/summary-selector/summary-selector.component';

interface Pago {
  id: number;
  proyecto_id: number;
  importe_total: number;
  fecha: Date;
  descripcion?: string;
}

@Component({
  selector: 'app-ingreso',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SummarySelectorComponent],
  templateUrl: './ingreso.component.html',
  styleUrls: ['./ingreso.component.css']
})
export class IngresoComponent implements OnInit {
  @Input() pagos: Pago[] = [];
  @Output() actualizarBalance = new EventEmitter<void>();

  proyectos: Project[] = [];
  proyectosActivos: Project[] = []; // Solo para los selectores
  pagoForm: FormGroup;
  mostrarFormulario = false;
  modoEdicion = false;
  pagoSeleccionadoId: number | null = null;
  filtroTexto = '';

  // Propiedades para el totalizador
  selectedPagosIds: Set<number> = new Set();
  summaryConfig: SummarySelectorConfig = {
    columnKey: 'importe_total',
    label: 'TOTAL INGRESOS SELECCIONADOS',
    format: 'currency',
    decimalPlaces: 2
  };

  constructor(
    private balanceService: BalanceService,
    private projectService: ProjectService,
    private fb: FormBuilder
  ) {
    this.pagoForm = this.fb.group({
      proyecto_id: ['', Validators.required],
      importe_total: ['', [Validators.required, Validators.min(0)]],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    console.log('🔍 Cargando proyectos desde el servicio...');
    this.projectService.getProjects().subscribe(
      (data: Project[]) => {
        console.log('📦 Proyectos recibidos del backend:', data);
        // Mantener todos los proyectos para mostrar nombres de proyectos inactivos
        this.proyectos = data;
        // Filtrar solo proyectos activos para los selectores
        this.proyectosActivos = data.filter(p => p.estado === true);
        console.log('✅ Proyectos activos filtrados:', this.proyectosActivos);
        console.log(`Total de proyectos activos: ${this.proyectosActivos.length}`);
      },
      (error) => {
        console.error('❌ Error al cargar proyectos:', error);
        console.error('Detalles del error:', error.message);
      }
    );
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) this.resetForm();
  }

  resetForm(): void {
    this.pagoForm.reset({
      fecha: new Date().toISOString().substring(0, 10)
    });
    this.modoEdicion = false;
    this.pagoSeleccionadoId = null;
  }

  guardarPago(): void {
    if (this.pagoForm.invalid) {
      Object.keys(this.pagoForm.controls).forEach(key => {
        const control = this.pagoForm.get(key);
        if (control) control.markAsTouched();
      });
      return;
    }

    const pago = this.pagoForm.value;

    if (this.modoEdicion && this.pagoSeleccionadoId) {
      this.balanceService.actualizarPago(this.pagoSeleccionadoId, pago).subscribe(
        () => { this.actualizarBalance.emit(); this.resetForm(); this.mostrarFormulario = false; },
        (error) => console.error('Error al actualizar pago:', error)
      );
    } else {
      this.balanceService.crearPago(pago).subscribe(
        () => { this.actualizarBalance.emit(); this.resetForm(); this.mostrarFormulario = false; },
        (error) => console.error('Error al crear pago:', error)
      );
    }
  }

  editarPago(pago: Pago): void {
    this.modoEdicion = true;
    this.pagoSeleccionadoId = pago.id;
    this.pagoForm.patchValue({
      proyecto_id: pago.proyecto_id,
      importe_total: pago.importe_total,
      fecha: new Date(pago.fecha).toISOString().substring(0, 10),
      descripcion: pago.descripcion
    });
    this.mostrarFormulario = true;
  }

  eliminarPago(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este ingreso?')) {
      this.balanceService.eliminarPago(id).subscribe(
        () => this.actualizarBalance.emit(),
        (error) => console.error('Error al eliminar pago:', error)
      );
    }
  }

  getNombreProyecto(proyecto_id: number): string {
    const proyecto = this.proyectos.find(p => p.id === proyecto_id);
    return proyecto ? proyecto.nombre : 'Desconocido';
  }

  get pagosFiltrados(): Pago[] {
    let pagosFiltrados = [...this.pagos]; // Crear copia

    // Aplicar filtro de texto
    if (this.filtroTexto.trim()) {
      const filtro = this.filtroTexto.toLowerCase();
      pagosFiltrados = pagosFiltrados.filter(pago => {
        const proyectoNombre = this.getNombreProyecto(pago.proyecto_id).toLowerCase();
        const descripcion = pago.descripcion?.toLowerCase() || '';
        const fecha = new Date(pago.fecha).toLocaleDateString();

        return (
          proyectoNombre.includes(filtro) ||
          descripcion.includes(filtro) ||
          fecha.includes(filtro) ||
          pago.importe_total.toString().includes(filtro)
        );
      });
    }

    // Ordenar por fecha (más recientes primero)
    return pagosFiltrados.sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  // Métodos para el totalizador
  togglePagoSelection(pagoId: number): void {
    if (this.selectedPagosIds.has(pagoId)) {
      this.selectedPagosIds.delete(pagoId);
    } else {
      this.selectedPagosIds.add(pagoId);
    }
    this.selectedPagosIds = new Set(this.selectedPagosIds);
  }

  isPagoSelected(pagoId: number): boolean {
    return this.selectedPagosIds.has(pagoId);
  }

  get allPagosSelected(): boolean {
    return this.pagosFiltrados.length > 0 &&
           this.pagosFiltrados.every(p => this.selectedPagosIds.has(p.id));
  }

  toggleSelectAllPagos(): void {
    if (this.allPagosSelected) {
      this.pagosFiltrados.forEach(p => this.selectedPagosIds.delete(p.id));
    } else {
      this.pagosFiltrados.forEach(p => this.selectedPagosIds.add(p.id));
    }
    this.selectedPagosIds = new Set(this.selectedPagosIds);
  }

  onSelectionChanged(selectedIds: Set<number>): void {
    this.selectedPagosIds = selectedIds;
  }

  onClearSelection(): void {
    this.selectedPagosIds.clear();
    this.selectedPagosIds = new Set();
  }
}
