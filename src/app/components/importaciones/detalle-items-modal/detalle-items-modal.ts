import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FacturaResumen } from '../../../models/importacion';

@Component({
  selector: 'app-detalle-items-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './detalle-items-modal.html',
  styles: [`
    .alert-info { background: #eff6ff; color: #1e40af; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; border: 1px solid #dbeafe; }
    .custom-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .custom-table th { background: #f8fafc; color: #64748b; font-weight: 600; padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
    .custom-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .highlight-col { background-color: #f0fdf4; font-weight: 700; color: #166534; }
    .fob-col { color: #64748b; }
  `]
})
export class DetalleItemsModalComponent {
  constructor(
    public dialogRef: MatDialogRef<DetalleItemsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FacturaResumen
  ) {}

  cerrar() {
    this.dialogRef.close();
  }
}