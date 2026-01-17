import { 
  Component, 
  OnInit, 
  OnChanges, 
  SimpleChanges, 
  Input, 
  Output, 
  EventEmitter, 
  ChangeDetectorRef, 
  ChangeDetectionStrategy,
  Optional, // 👈 Importante para que no falle si no es modal
  Inject    // 👈 Importante para recibir datos del modal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
// 👇 IMPORTACIONES NECESARIAS PARA EL MODAL
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Proveedor } from '../../../models/proveedor';
import { ProveedorService } from '../../../services/proveedor-service';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './proveedor-form.html',
  styleUrls: ['./proveedor-form.css'],
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
  isLoading: boolean = false;

  constructor(
    private proveedorService: ProveedorService,
    private cd: ChangeDetectorRef,
    // 👇 1. INYECTAR EL CONTROLADOR DEL DIÁLOGO (Opcional por si se usa sin modal)
    @Optional() public dialogRef: MatDialogRef<ProveedorFormComponent>,
    // 👇 2. RECIBIR DATOS SI SE ABRE COMO MODAL
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    // 👇 Si viene data del modal, la usamos
    if (this.data && this.data.idProveedor !== undefined) {
      this.idProveedor = this.data.idProveedor;
    }
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
      this.cd.markForCheck();
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
    this.cd.markForCheck();

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
        
        // 👇 3. LÓGICA DE CIERRE HÍBRIDA
        if (this.dialogRef) {
          this.dialogRef.close(true); // Cierra el modal si existe
        } else {
          this.onCerrar.emit(true); // Emite evento si es componente hijo
        }

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
        
        // 👇 3. LÓGICA DE CIERRE HÍBRIDA
        if (this.dialogRef) {
          this.dialogRef.close(true);
        } else {
          this.onCerrar.emit(true);
        }

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
    // 👇 3. LÓGICA DE CIERRE HÍBRIDA
    if (this.dialogRef) {
      this.dialogRef.close(false); // Cierra modal sin guardar
    } else {
      this.onCerrar.emit(false); // Emite evento
    }
  }

  private manejarError(e: any): void {
    let mensaje = e.error?.message || e.message || 'Error desconocido';
    alert('⛔ ' + mensaje);
  }
}