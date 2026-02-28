import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
// ✅ IMPORTAMOS LAS HERRAMIENTAS DE FECHA
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, NativeDateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

interface ItemGasto {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

// ✅ DEFINIMOS EL FORMATO DD/MM/YYYY PARA ESTE MODAL
export const MY_DATE_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

// ✅ CREAMOS EL TRADUCTOR DE FECHAS PARA EL MODAL
export class CustomDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if ((typeof value === 'string') && (value.indexOf('/') > -1)) {
      const str = value.split('/');
      if (str.length === 3 && str[2].length === 4) {
          const day = Number(str[0]);
          const month = Number(str[1]) - 1; 
          const year = Number(str[2]);
          return new Date(year, month, day);
      }
    }
    const timestamp = typeof value === 'number' ? value : Date.parse(value);
    return isNaN(timestamp) ? null : new Date(timestamp);
  }

  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'DD/MM/YYYY') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return super.format(date, displayFormat);
  }
}

@Component({
  selector: 'app-gasto-menor-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule
  ],
  providers: [
    // ✅ ACTIVAMOS EL TRADUCTOR AQUÍ
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  templateUrl: './gasto-menor-modal.html',
  styleUrls: ['./gasto-menor-modal.css']
})
export class GastoMenorModalComponent {

  gasto = {
    tipoComprobante: 'BOLETA',
    serie: '',
    numero: '',
    fechaEmision: new Date(), // Inicializa en hoy, pero puedes cambiarlo
    proveedor: '', 
    moneda: 'PEN',
    tipoCambio: 1.00,
    observaciones: ''
  };

  tiposComprobante = ['BOLETA', 'FACTURA', 'TICKET', 'RECIBO DE HONORARIOS', 'NOTA DE VENTA'];

  items: ItemGasto[] = [
    { descripcion: '', cantidad: 1, precioUnitario: 0 }
  ];

  constructor(public dialogRef: MatDialogRef<GastoMenorModalComponent>) {}

  agregarItem(): void {
    this.items.push({ descripcion: '', cantidad: 1, precioUnitario: 0 });
  }

  eliminarItem(index: number): void {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    }
  }

  limpiarCeroPrecio(index: number): void {
    if (this.items[index].precioUnitario === 0) {
      this.items[index].precioUnitario = null as unknown as number;
    }
  }

  verificarVacioPrecio(index: number): void {
    if (!this.items[index].precioUnitario) {
      this.items[index].precioUnitario = 0;
    }
  }

  getSubtotalItem(item: ItemGasto): number {
    return (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0);
  }

  getTotalPagar(): number {
    return this.items.reduce((sum, item) => sum + this.getSubtotalItem(item), 0);
  }

  esValido(): boolean {
    if (!this.gasto.proveedor || !this.gasto.proveedor.trim()) return false;
    if (this.items.length === 0) return false;
    if (this.items.some(item => !item.descripcion || !item.descripcion.trim() || item.precioUnitario <= 0)) return false;
    return true;
  }

  guardar(): void {
    if (!this.esValido()) return;

    const dataFinal = {
      ...this.gasto,
      items: this.items,
      total: this.getTotalPagar()
    };
    
    this.dialogRef.close(dataFinal);
  }
}