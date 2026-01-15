import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { NotaCreditoService } from '../../../services/nota-credito-service';
import { NotaCreditoRequest, MotivoNota } from '../../../models/nota-credito';
import { Venta } from '../../../models/venta';

@Component({
  selector: 'app-nota-credito-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './nota-credito-modal.html',
  styleUrls: ['./nota-credito-modal.css']
})
export class NotaCreditoModalComponent {
  
  // Datos del formulario
  motivoSeleccionado: MotivoNota = MotivoNota.DEVOLUCION_TOTAL;
  monto: number = 0;
  observaciones: string = '';
  isSaving: boolean = false;

  // Lista de motivos para el desplegable
  motivos = [
    { value: MotivoNota.ANULACION_DE_LA_OPERACION, label: 'Anulación de la Operación' },
    { value: MotivoNota.ANULACION_POR_ERROR_EN_RUC, label: 'Anulación por error en RUC' },
    { value: MotivoNota.CORRECCION_POR_ERROR_EN_LA_DESCRIPCION, label: 'Corrección por error en descripción' },
    { value: MotivoNota.DESCUENTO_GLOBAL, label: 'Descuento Global' },
    { value: MotivoNota.DEVOLUCION_TOTAL, label: 'Devolución Total' },
    { value: MotivoNota.DEVOLUCION_POR_ITEM, label: 'Devolución por Ítem' }
  ];

  constructor(
    public dialogRef: MatDialogRef<NotaCreditoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public venta: Venta,
    private notaCreditoService: NotaCreditoService,
    private snackBar: MatSnackBar
  ) {
    // Por defecto, sugerimos devolver el monto total de la venta
    this.monto = venta.total;
  }

  cerrar(): void {
    this.dialogRef.close(false); // Cerramos sin hacer nada
  }

  emitir(): void {
    // --- VALIDACIONES ---
    if (this.monto <= 0) {
      this.mostrarMensaje('El monto debe ser mayor a 0', 'error');
      return;
    }
    // Validamos que no quiera devolver más dinero del que costó la venta
    if (this.monto > this.venta.total) {
      this.mostrarMensaje(`El monto no puede superar el total (S/ ${this.venta.total})`, 'error');
      return;
    }
    if (!this.motivoSeleccionado) {
      this.mostrarMensaje('Debe seleccionar un motivo', 'error');
      return;
    }

    this.isSaving = true;

    // Preparamos el objeto para enviar al Backend
    const request: NotaCreditoRequest = {
      ventaId: this.venta.id,
      motivo: this.motivoSeleccionado,
      monto: this.monto,
      observaciones: this.observaciones
    };

    // Llamamos al servicio
    this.notaCreditoService.emitirNotaCredito(request).subscribe({
      next: () => {
        this.mostrarMensaje('✅ Nota de Crédito emitida exitosamente', 'success');
        this.dialogRef.close(true); // Retornamos TRUE para que la lista se actualice
      },
      error: (err) => {
        console.error(err);
        this.isSaving = false;
        this.mostrarMensaje('Error al emitir la nota de crédito', 'error');
      }
    });
  }

  mostrarMensaje(msg: string, tipo: 'success' | 'error') {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'snackbar-success' : 'snackbar-error',
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}