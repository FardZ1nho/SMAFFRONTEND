import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ImportacionResponse, FacturaResumen } from '../../../models/importacion';

@Component({
  selector: 'app-prorrateo-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './prorrateo-modal.html', 
  styleUrls: ['./prorrateo-modal.css']
})
export class ProrrateoModalComponent {
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: ImportacionResponse) {}

  // Función para mostrar el factor de sobrecosto (opcional, para estilos visuales)
  getFactor(f: FacturaResumen): number {
    if (!f.total || f.total === 0) return 0;
    return f.costoTotalImportacion / f.total;
  }

  // ✅ ESTA ES LA FUNCIÓN QUE FALTABA
  // Verifica si un campo de la importación (ej: costoOtros1) tiene valor > 0
  hasValue(field: keyof ImportacionResponse): boolean {
    const value = this.data[field];
    return typeof value === 'number' && value > 0;
  }
}