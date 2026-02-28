import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-gasto-menor-detalle-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './gasto-menor-detalle-modal.html',
  styleUrls: ['./gasto-menor-detalle-modal.css']
})
export class GastoMenorDetalleModalComponent implements OnInit {

  comprobante: string = '';
  observaciones: string = '';
  items: { cantidad: string, descripcion: string }[] = [];

  constructor(
    public dialogRef: MatDialogRef<GastoMenorDetalleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // Recibe el movimiento entero desde la tabla
  ) {}

  ngOnInit(): void {
    this.desarmarMotivo(this.data.motivo);
  }

  desarmarMotivo(motivoOriginal: string): void {
    let motivo = motivoOriginal || '';
    this.comprobante = 'Ajuste Manual';
    this.observaciones = 'Sin observaciones';
    let itemsTexto = motivo;

    // 1. Extraer el comprobante [BOLETA F001-123]
    if (motivo.startsWith('[')) {
      const finCorchete = motivo.indexOf(']');
      if (finCorchete > -1) {
        this.comprobante = motivo.substring(1, finCorchete);
        motivo = motivo.substring(finCorchete + 1).trim();
      }
    }

    // 2. Extraer observaciones (". Obs: ...")
    if (motivo.includes('. Obs: ')) {
      const partesObs = motivo.split('. Obs: ');
      this.observaciones = partesObs[1];
      motivo = partesObs[0];
    }

    // 3. Limpiar la palabra "Compra: "
    if (motivo.startsWith('Compra: ')) {
      itemsTexto = motivo.replace('Compra: ', '').trim();
    } else {
      itemsTexto = motivo;
    }

    // 4. Separar los items (Ej: "2x Gasolina, 1x Papel")
    this.items = itemsTexto.split(', ').map(item => {
      const indexX = item.indexOf('x ');
      if (indexX > -1) {
        return {
          cantidad: item.substring(0, indexX),
          descripcion: item.substring(indexX + 2)
        };
      }
      return { cantidad: '-', descripcion: item }; // Por si es un formato distinto
    });
  }
}