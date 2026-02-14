import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FacturaResumen } from '../../../models/importacion'; // Asegúrate que la ruta sea correcta

@Component({
  selector: 'app-detalle-items-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './detalle-items-modal.html',
  styleUrls: ['./detalle-items-modal.css']
})
export class DetalleItemsModalComponent implements OnInit {

  itemsEditables: any[] = [];
  tasaPercepcion = 0.035; // 3.5%

  constructor(
    public dialogRef: MatDialogRef<DetalleItemsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FacturaResumen
  ) {}

  ngOnInit() {
    this.prepararItems();
  }

  prepararItems() {
    // Validación de seguridad para evitar errores si items es undefined
    if (!this.data || !this.data.items) return;

    // Total de gastos fijos de la factura (sin impuestos)
    // Usamos ( || 0) para evitar error "Object is possibly undefined"
    const totalGastosFactura = 
      (this.data.proFlete || 0) + 
      (this.data.proAlmacenaje || 0) + 
      (this.data.proTransporte || 0) + 
      (this.data.proPersonalDescarga || 0) + 
      (this.data.proMontacarga || 0) + 
      (this.data.proDesconsolidacion || 0) + 
      (this.data.proVistosBuenos || 0) + 
      (this.data.proTransmision || 0) + 
      (this.data.proComisionAgencia || 0) + 
      (this.data.proVobo || 0) + 
      (this.data.proGastosOperativos || 0) + 
      (this.data.proResguardo || 0) + 
      (this.data.proOtros1 || 0) + 
      (this.data.proOtros2 || 0);

    const totalFobFactura = this.data.total || 1; // Evitar división por cero

    this.itemsEditables = this.data.items.map(item => {
      // Aseguramos valores por defecto
      const fobItem = item.importeFob || 0;
      const precioUnit = item.precioUnitarioFob || 0;
      const qty = item.cantidad || 1; 

      const factor = fobItem / totalFobFactura; // % Participación

      // Costo Logístico Unitario (Fijo)
      const logisticaUnit = (totalGastosFactura * factor) / qty;
      
      // Base CIF Unitaria aprox (FOB + Flete proporcional). 
      // He quitado 'proSeguro' porque no existe en tu modelo.
      const fleteUnit = ((this.data.proFlete || 0) * factor) / qty;
      const cifUnit = precioUnit + fleteUnit;

      const nuevoItem = {
        ...item,
        cifUnit: cifUnit,              
        logisticaUnit: logisticaUnit,  
        
        // EL CAMPO QUE QUIERES EDITAR (Inicia en 0)
        adValoremUnit: 0, 

        // Campos calculados
        igvUnit: 0,
        ipmUnit: 0,
        percepUnit: 0,
        landedUnit: 0,
        landedTotal: 0
      };
      
      // Calcular la primera vez
      this.actualizarFila(nuevoItem);

      return nuevoItem;
    });
  }

  // Se ejecuta cada vez que escribes en el input de Ad Valorem
  actualizarFila(item: any) {
    // 1. Base Imponible = CIF + AdValorem (Manual)
    const baseImponible = (item.cifUnit || 0) + (item.adValoremUnit || 0);

    // 2. Impuestos (IGV 16%, IPM 2%)
    item.igvUnit = baseImponible * 0.16;
    item.ipmUnit = baseImponible * 0.02;

    // 3. Percepción
    const basePercep = baseImponible + item.igvUnit + item.ipmUnit;
    item.percepUnit = basePercep * this.tasaPercepcion;

    // 4. Costo Landed Unitario
    // Fórmula: FOB + Logística + AdValorem + Percepción
    const fob = item.precioUnitarioFob || 0;
    item.landedUnit = fob + item.logisticaUnit + (item.adValoremUnit || 0) + item.percepUnit;
    
    // 5. Total
    item.landedTotal = item.landedUnit * (item.cantidad || 1);
  }

  guardar() {
    this.dialogRef.close(this.itemsEditables);
  }
}