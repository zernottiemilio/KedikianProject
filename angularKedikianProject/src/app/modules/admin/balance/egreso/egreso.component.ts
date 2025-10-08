// egreso.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { BalanceService } from '../../../../core/services/balance.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface Gasto {
  id: number;
  usuario_id: number;
  maquina_id: number | null;
  tipo: string;
  importe_total: number;
  fecha: Date;
  descripcion: string;
  imagen: string;
}

interface Usuario {
  id: number;
  nombre: string;
}

interface Maquina {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-egreso',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './egreso.component.html',
  styleUrls: ['./egreso.component.css'],
})
export class EgresoComponent implements OnInit {
  @Input() gastos: Gasto[] = [];
  @Output() actualizarBalance = new EventEmitter<void>();

  usuarios: Usuario[] = [];
  maquinas: Maquina[] = [];
  gastoForm: FormGroup;
  mostrarFormulario = false;
  modoEdicion = false;
  gastoSeleccionadoId: number | null = null;
  filtroTexto = '';
  imagenSeleccionada: File | null = null;
  previewURL: string | ArrayBuffer | null = null;
  mostrarModal = false;
  imagenModal = '';
  eliminarImagenExistente = false; // Flag para indicar que se debe eliminar la imagen
  tiposGasto = [
    { value: 'material', label: 'Material' },
    { value: 'servicio', label: 'Servicio' },
    { value: 'herramienta', label: 'Herramienta' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'otro', label: 'Otro' },
  ];

  constructor(private balanceService: BalanceService, private fb: FormBuilder) {
    this.gastoForm = this.fb.group({
      usuario_id: ['', Validators.required],
      maquina_id: [''],
      tipo: ['', Validators.required],
      importe_total: ['', [Validators.required, Validators.min(0)]],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      descripcion: [''],
      imagen: [''],
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarMaquinas();
  }

  cargarUsuarios(): void {
    this.balanceService.getUsuarios().subscribe(
      (data: Usuario[]) => (this.usuarios = data),
      (error) => console.error('Error al cargar usuarios:', error)
    );
  }

  cargarMaquinas(): void {
    this.balanceService.getMaquinas().subscribe(
      (data: Maquina[]) => (this.maquinas = data),
      (error) => console.error('Error al cargar máquinas:', error)
    );
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) this.resetForm();
  }

  resetForm(): void {
    this.gastoForm.reset({
      fecha: new Date().toISOString().substring(0, 10),
    });
    this.modoEdicion = false;
    this.gastoSeleccionadoId = null;
    this.imagenSeleccionada = null;
    this.previewURL = null;
    this.eliminarImagenExistente = false;
  }

  onImagenChange(event: Event): void {
    const element = event.target as HTMLInputElement;
    const files = element.files;

    if (files && files.length > 0) {
      this.imagenSeleccionada = files[0];
      this.eliminarImagenExistente = false;

      // Crear preview
      const reader = new FileReader();
      reader.onload = () => (this.previewURL = reader.result);
      reader.readAsDataURL(this.imagenSeleccionada);
    }
  }

  eliminarImagen(): void {
    this.previewURL = null;
    this.imagenSeleccionada = null;
    this.eliminarImagenExistente = true;
    
    // Limpiar el input file
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  guardarGasto(): void {
    if (this.gastoForm.invalid) {
      Object.keys(this.gastoForm.controls).forEach((key) => {
        const control = this.gastoForm.get(key);
        if (control) control.markAsTouched();
      });
      return;
    }

    const formValue = this.gastoForm.value;

    const gastoPayload: any = {
      usuario_id: Number(formValue.usuario_id),
      maquina_id: formValue.maquina_id ? Number(formValue.maquina_id) : null,
      tipo: formValue.tipo,
      importe_total: Number(formValue.importe_total),
      fecha: formValue.fecha,
      descripcion: formValue.descripcion || '',
    };

    // Determinar qué hacer con la imagen
    let imagenParaEnviar: File | undefined | null = undefined;
    
    if (this.imagenSeleccionada) {
      // Si hay una nueva imagen seleccionada, enviarla
      imagenParaEnviar = this.imagenSeleccionada;
    } else if (this.eliminarImagenExistente && this.modoEdicion) {
      // Si se marcó para eliminar en modo edición, enviar null explícitamente
      imagenParaEnviar = null;
    }

    // Llamada al servicio según modo
    if (this.modoEdicion && this.gastoSeleccionadoId) {
      // Si eliminamos la imagen, necesitamos enviarla como null
      if (this.eliminarImagenExistente) {
        // Pasamos null para indicar que se debe eliminar
        this.balanceService.actualizarGasto(this.gastoSeleccionadoId, gastoPayload, null as any).subscribe(
          () => {
            this.actualizarBalance.emit();
            this.resetForm();
            this.mostrarFormulario = false;
          },
          (error) => console.error('Error al actualizar gasto:', error)
        );
      } else {
        // Pasamos la imagen nueva o undefined si no hay cambios
        this.balanceService.actualizarGasto(this.gastoSeleccionadoId, gastoPayload, imagenParaEnviar as any).subscribe(
          () => {
            this.actualizarBalance.emit();
            this.resetForm();
            this.mostrarFormulario = false;
          },
          (error) => console.error('Error al actualizar gasto:', error)
        );
      }
    } else {
      // Para crear: pasar los datos y la imagen por separado
      this.balanceService.crearGasto(gastoPayload, imagenParaEnviar as any).subscribe(
        () => {
          this.actualizarBalance.emit();
          this.resetForm();
          this.mostrarFormulario = false;
        },
        (error) => console.error('Error al crear gasto:', error)
      );
    }
  }

  editarGasto(gasto: Gasto): void {
    this.modoEdicion = true;
    this.gastoSeleccionadoId = gasto.id;
    this.gastoForm.patchValue({
      usuario_id: gasto.usuario_id,
      maquina_id: gasto.maquina_id,
      tipo: gasto.tipo,
      importe_total: gasto.importe_total,
      fecha: new Date(gasto.fecha).toISOString().substring(0, 10),
      descripcion: gasto.descripcion,
    });

    // Resetear estados de imagen
    this.imagenSeleccionada = null;
    this.eliminarImagenExistente = false;
    
    if (gasto.imagen) {
      this.previewURL = this.getImagenSrc(gasto.imagen);
    } else {
      this.previewURL = null;
    }

    this.mostrarFormulario = true;
  }

  eliminarGasto(id: number): void {
    if (!confirm('¿Está seguro de que desea eliminar este egreso?')) return;
    this.balanceService.eliminarGasto(id).subscribe(
      () => this.actualizarBalance.emit(),
      (error) => console.error('Error al eliminar gasto:', error)
    );
  }

  getNombreUsuario(usuario_id: number): string {
    const usuario = this.usuarios.find((u) => u.id === usuario_id);
    return usuario ? usuario.nombre : 'Desconocido';
  }

  getNombreMaquina(maquina_id: number | null): string {
    if (!maquina_id) return 'N/A';
    const maquina = this.maquinas.find((m) => m.id === maquina_id);
    return maquina ? maquina.nombre : 'Desconocido';
  }

  getTipoLabel(tipo: string): string {
    const tipoEncontrado = this.tiposGasto.find((t) => t.value === tipo);
    return tipoEncontrado ? tipoEncontrado.label : tipo;
  }

  getImagenSrc(imagen: string): string {
    if (!imagen) return '';
    return 'data:image/png;base64,' + imagen;
  }

  abrirModalImagen(imagen: string): void {
    this.imagenModal = imagen;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.imagenModal = '';
  }

  get gastosFiltrados(): Gasto[] {
    if (!this.filtroTexto.trim()) return this.gastos;
    const filtro = this.filtroTexto.toLowerCase();
    return this.gastos.filter((gasto) => {
      const usuarioNombre = this.getNombreUsuario(gasto.usuario_id).toLowerCase();
      const maquinaNombre = this.getNombreMaquina(gasto.maquina_id)?.toLowerCase() || '';
      const tipo = this.getTipoLabel(gasto.tipo).toLowerCase();
      const descripcion = gasto.descripcion?.toLowerCase() || '';
      const fecha = new Date(gasto.fecha).toLocaleDateString();
      return (
        usuarioNombre.includes(filtro) ||
        maquinaNombre.includes(filtro) ||
        tipo.includes(filtro) ||
        descripcion.includes(filtro) ||
        fecha.includes(filtro) ||
        gasto.importe_total.toString().includes(filtro)
      );
    });
  }
}