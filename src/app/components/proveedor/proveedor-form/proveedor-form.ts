import { 
  Component, 
  OnInit, 
  OnChanges, 
  SimpleChanges, 
  Input, 
  Output, 
  EventEmitter, 
  ChangeDetectorRef, 
  ChangeDetectionStrategy // 1. Importante para rendimiento
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { Proveedor } from '../../../models/proveedor';
import { ProveedorService } from '../../../services/proveedor-service';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './proveedor-form.html',
  styleUrls: ['./proveedor-form.css'],
  // ⚡ 2. ESTRATEGIA ONPUSH: Angular no "escanea" esto a menos que haya cambios reales
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class ProveedorFormComponent implements OnInit, OnChanges {

  @Input() idProveedor: number | null = null;
  @Output() onCerrar = new EventEmitter<boolean>();

  proveedor: Proveedor = {
    nombre: '', ruc: '', pais: 'PERÚ', 
    contacto: '', telefono: '', email: '', direccion: '', activo: true
  };

  titulo: string = 'Registrar Nuevo Proveedor';
  btnTexto: string = 'Guardar Proveedor';
  isLoading: boolean = false; // Para evitar doble clic

  constructor(
    private proveedorService: ProveedorService,
    private cd: ChangeDetectorRef // 3. Necesario para actualizar la vista manualmente
  ) {}

  ngOnInit(): void {
    this.verificarEstado();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idProveedor']) {
      this.verificarEstado();
    }
  }

  verificarEstado(): void {
    if (this.idProveedor) {
      this.titulo = 'Editar Información del Proveedor';
      this.btnTexto = 'Actualizar Datos';
      this.cargarProveedor(this.idProveedor);
    } else {
      this.titulo = 'Registrar Nuevo Proveedor';
      this.btnTexto = 'Guardar Proveedor';
      this.limpiarFormulario();
      this.cd.markForCheck(); // Actualizar vista
    }
  }

  limpiarFormulario(): void {
    this.proveedor = {
      nombre: '', ruc: '', pais: 'PERÚ', 
      contacto: '', telefono: '', email: '', direccion: '', activo: true
    };
  }

  cargarProveedor(id: number): void {
    this.isLoading = true;
    this.proveedorService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.proveedor = data;
        if (!this.proveedor.pais) this.proveedor.pais = 'PERÚ';
        this.isLoading = false;
        // 4. IMPORTANTÍSIMO: Avisar a Angular que llegaron datos
        this.cd.markForCheck(); 
      },
      error: (e) => {
        console.error('Error al cargar:', e);
        this.cancelar();
      }
    });
  }

  guardar(): void {
    if (this.isLoading) return;

    // Validaciones
    if (!this.proveedor.nombre || !this.proveedor.ruc) {
      alert('⚠️ Por favor complete la Razón Social y la Identificación.');
      return;
    }

    if (/^\d+$/.test(this.proveedor.nombre.trim())) {
      alert('⚠️ La Razón Social no puede ser solo números.');
      return;
    }

    if (this.proveedor.pais === 'PERÚ' && !/^\d{11}$/.test(this.proveedor.ruc)) {
      alert('🇵🇪 El RUC peruano debe tener 11 dígitos.');
      return;
    }

    this.isLoading = true;
    this.cd.markForCheck(); // Bloquear botón visualmente

    if (this.idProveedor) {
      this.actualizar();
    } else {
      this.crear();
    }
  }

  crear(): void {
    this.proveedorService.crear(this.proveedor).subscribe({
      next: () => {
        alert('✅ Proveedor registrado correctamente');
        this.onCerrar.emit(true);
        this.isLoading = false;
      },
      error: (e) => {
        this.manejarError(e);
        this.isLoading = false;
        this.cd.markForCheck();
      }
    });
  }

  actualizar(): void {
    this.proveedorService.actualizar(this.idProveedor!, this.proveedor).subscribe({
      next: () => {
        alert('✅ Proveedor actualizado correctamente');
        this.onCerrar.emit(true);
        this.isLoading = false;
      },
      error: (e) => {
        this.manejarError(e);
        this.isLoading = false;
        this.cd.markForCheck();
      }
    });
  }

  cancelar(): void {
    this.onCerrar.emit(false);
  }

  private manejarError(e: any): void {
    let mensaje = e.error?.message || e.message || 'Error desconocido';
    alert('⛔ ' + mensaje);
  }
}