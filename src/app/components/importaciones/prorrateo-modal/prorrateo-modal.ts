import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImportacionResponse, FacturaResumen } from '../../../models/importacion';
import { DetalleItemsModalComponent } from '../detalle-items-modal/detalle-items-modal';

@Component({
  selector: 'app-prorrateo-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './prorrateo-modal.html', 
  styleUrls: ['./prorrateo-modal.css']
})
export class ProrrateoModalComponent {
  
  constructor(
    public dialog: MatDialog, // ✅ Inyectamos MatDialog
    @Inject(MAT_DIALOG_DATA) public data: ImportacionResponse
  ) {}

  // Función para mostrar el factor de sobrecosto
  getFactor(f: FacturaResumen): number {
    if (!f.total || f.total === 0) return 0;
    return f.costoTotalImportacion / f.total;
  }

  // Verifica si un campo de la importación tiene valor > 0
  hasValue(field: keyof ImportacionResponse): boolean {
    const value = this.data[field];
    return typeof value === 'number' && value > 0;
  }

  // ✅ NUEVO MÉTODO PARA ABRIR EL DETALLE
  verDetalleItems(factura: any) {
    this.dialog.open(DetalleItemsModalComponent, {
      width: '900px', // Ancho suficiente para la tabla
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: factura // Pasamos la factura completa con su lista de items
    });
  }
}