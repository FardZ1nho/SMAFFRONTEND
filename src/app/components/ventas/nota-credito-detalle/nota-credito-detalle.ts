import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotaCredito } from '../../../models/nota-credito';
import { Venta } from '../../../models/venta';
import { VentaService } from '../../../services/venta-service';

@Component({
  selector: 'app-nota-credito-detalle',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, 
    MatIconModule, MatDividerModule, MatProgressSpinnerModule
  ],
  templateUrl: './nota-credito-detalle.html',
  styleUrls: ['./nota-credito-detalle.css']
})
export class NotaCreditoDetalleComponent implements OnInit {

  ventaOriginal: Venta | null = null;
  isLoadingVenta: boolean = true;

  constructor(
    public dialogRef: MatDialogRef<NotaCreditoDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public nota: NotaCredito,
    private ventaService: VentaService,
    private cdr: ChangeDetectorRef // 2. Inyectar CDR
  ) {}

  ngOnInit(): void {
    // 3. Usar setTimeout para evitar el error NG0100
    setTimeout(() => {
        this.cargarDetallesVenta();
    }, 0);
  }

  cargarDetallesVenta(): void {
    // Validación de seguridad
    if (!this.nota.codigoVentaAfectada) {
      this.isLoadingVenta = false;
      this.cdr.detectChanges();
      return;
    }

    console.log('Buscando venta original:', this.nota.codigoVentaAfectada);

    this.ventaService.buscarPorCodigo(this.nota.codigoVentaAfectada).subscribe({
      next: (venta) => {
        console.log('Venta encontrada:', venta);
        this.ventaOriginal = venta;
        this.isLoadingVenta = false;
        this.cdr.detectChanges(); // 4. Forzar actualización visual
      },
      error: (err) => {
        console.error('Error buscando venta:', err);
        this.isLoadingVenta = false;
        this.cdr.detectChanges(); // 4. Forzar actualización incluso en error
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  formatearFecha(fecha: string | Date): string {
    if(!fecha) return '-';
    return new Date(fecha).toLocaleString('es-PE', { 
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  }
}