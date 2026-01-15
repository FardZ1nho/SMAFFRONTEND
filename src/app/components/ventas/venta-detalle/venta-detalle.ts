import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Venta } from '../../../models/venta'; // Asegúrate que la ruta sea correcta

@Component({
  selector: 'app-venta-detalle',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './venta-detalle.html',
  styleUrls: ['./venta-detalle.css']
})
export class VentaDetalleComponent {

  constructor(
    public dialogRef: MatDialogRef<VentaDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public venta: Venta
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }

  // Helper para mostrar fecha bonita
  formatearFecha(fecha: any): string {
    return new Date(fecha).toLocaleString('es-PE', { 
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  }
}