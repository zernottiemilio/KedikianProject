// ingreso.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { BalanceService } from '../../../../core/services/balance.service';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EgresoComponent } from '../egreso/egreso.component';

interface Pago {
  id: number;
  proyecto_id: number;
  producto_id: number;
  monto: number;
  fecha: Date;
  descripcion: string;
}

interface Proyecto {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-ingreso',
  imports: [CommonModule, FormsModule, ReactiveFormsModule], // Importar los módulos necesarios aquí
  templateUrl: './ingreso.component.html',
  styleUrls: ['./ingreso.component.css'],
  providers: [BalanceService],
})
export class IngresoComponent implements OnInit {
  @Input() pagos: Pago[] = [];
  @Output() actualizarBalance = new EventEmitter<void>();

  proyectos: Proyecto[] = [];
  productos: Producto[] = [];
  pagoForm: FormGroup;
  mostrarFormulario = false;
  modoEdicion = false;
  pagoSeleccionadoId: number | null = null;
  filtroTexto = '';

  constructor(private balanceService: BalanceService, private fb: FormBuilder) {
    this.pagoForm = this.fb.group({
      proyecto_id: ['', Validators.required],
      producto_id: ['', Validators.required],
      monto: ['', [Validators.required, Validators.min(0)]],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      descripcion: [''],
    });
  }

  ngOnInit(): void {
    this.cargarProyectos();
    this.cargarProductos();
  }

  cargarProyectos(): void {
    this.balanceService.getProyectos().subscribe(
      (data: Proyecto[]) => {
        this.proyectos = data;
      },
      (error) => {
        console.error('Error al cargar proyectos:', error);
      }
    );
  }

  cargarProductos(): void {
    this.balanceService.getProductos().subscribe(
      (data: Producto[]) => {
        this.productos = data;
      },
      (error) => {
        console.error('Error al cargar productos:', error);
      }
    );
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.pagoForm.reset({
      fecha: new Date().toISOString().substring(0, 10),
    });
    this.modoEdicion = false;
    this.pagoSeleccionadoId = null;
  }

  guardarPago(): void {
    if (this.pagoForm.invalid) {
      Object.keys(this.pagoForm.controls).forEach((key) => {
        const control = this.pagoForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }

    const pago = this.pagoForm.value;

    if (this.modoEdicion && this.pagoSeleccionadoId) {
      this.balanceService
        .actualizarPago(this.pagoSeleccionadoId, pago)
        .subscribe(
          () => {
            this.actualizarBalance.emit();
            this.resetForm();
            this.mostrarFormulario = false;
          },
          (error) => {
            console.error('Error al actualizar pago:', error);
          }
        );
    } else {
      this.balanceService.crearPago(pago).subscribe(
        () => {
          this.actualizarBalance.emit();
          this.resetForm();
          this.mostrarFormulario = false;
        },
        (error) => {
          console.error('Error al crear pago:', error);
        }
      );
    }
  }

  editarPago(pago: Pago): void {
    this.modoEdicion = true;
    this.pagoSeleccionadoId = pago.id;
    this.pagoForm.patchValue({
      proyecto_id: pago.proyecto_id,
      producto_id: pago.producto_id,
      monto: pago.monto,
      fecha: new Date(pago.fecha).toISOString().substring(0, 10),
      descripcion: pago.descripcion,
    });
    this.mostrarFormulario = true;
  }

  eliminarPago(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este ingreso?')) {
      this.balanceService.eliminarPago(id).subscribe(
        () => {
          this.actualizarBalance.emit();
        },
        (error) => {
          console.error('Error al eliminar pago:', error);
        }
      );
    }
  }

  getNombreProyecto(proyecto_id: number): string {
    const proyecto = this.proyectos.find((p) => p.id === proyecto_id);
    return proyecto ? proyecto.nombre : 'Desconocido';
  }

  getNombreProducto(producto_id: number): string {
    const producto = this.productos.find((p) => p.id === producto_id);
    return producto ? producto.nombre : 'Desconocido';
  }

  get pagosFiltrados(): Pago[] {
    if (!this.filtroTexto.trim()) {
      return this.pagos;
    }

    const filtro = this.filtroTexto.toLowerCase();
    return this.pagos.filter((pago) => {
      const proyectoNombre = this.getNombreProyecto(
        pago.proyecto_id
      ).toLowerCase();
      const productoNombre = this.getNombreProducto(
        pago.producto_id
      ).toLowerCase();
      const descripcion = pago.descripcion?.toLowerCase() || '';
      const fecha = new Date(pago.fecha).toLocaleDateString();

      return (
        proyectoNombre.includes(filtro) ||
        productoNombre.includes(filtro) ||
        descripcion.includes(filtro) ||
        fecha.includes(filtro) ||
        pago.monto.toString().includes(filtro)
      );
    });
  }
}
