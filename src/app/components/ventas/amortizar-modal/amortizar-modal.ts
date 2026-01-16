import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion'; // Para desplegar
import { MatDividerModule } from '@angular/material/divider';

import { Venta } from '../../../models/venta';
import { CuentaBancaria } from '../../../models/cuenta-bancaria';
import { CuentaBancariaService } from '../../../services/cuenta-bancaria-service'; 

// Interfaz visual interna para el modal
interface CuotaVisual {
  numero: number;
  monto: number;
  estado: 'PAGADO' | 'PARCIAL' | 'PENDIENTE';
  pagado: number; // Cuánto se ha pagado de esta cuota específica
  pendiente: number;
}

@Component({
  selector: 'app-amortizar-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, 
    MatInputModule, MatSelectModule, MatIconModule, MatExpansionModule, MatDividerModule
  ],
  templateUrl: './amortizar-modal.html',
  styleUrls: ['./amortizar-modal.css']
})
export class AmortizarModalComponent implements OnInit {

  cuotasVisuales: CuotaVisual[] = [];
  
  // Variables del Formulario de Pago
  montoAPagar: number = 0;
  metodoPago: string = 'EFECTIVO';
  cuentaId?: number;
  cuentas: CuentaBancaria[] = [];
  
  // Control visual
  cuotaSeleccionada?: CuotaVisual; 

  constructor(
    public dialogRef: MatDialogRef<AmortizarModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { venta: Venta },
    private cuentaService: CuentaBancariaService
  ) {}

  ngOnInit(): void {
    // 1. Cargar Cuentas
    this.cuentaService.listarActivas().subscribe(data => this.cuentas = data);

    // 2. Generar la Visualización de las Cuotas
    this.calcularEstadoCuotas();
  }

  calcularEstadoCuotas() {
    const v = this.data.venta;
    const numCuotas = v.numeroCuotas || 1;
    const totalVenta = v.total;
    const saldoPendienteTotal = v.saldoPendiente || 0;
    const montoPagadoTotal = totalVenta - saldoPendienteTotal;

    // Calculamos el valor base de cada cuota
    // Nota: La última cuota suele llevar los centavos de ajuste, pero haremos un promedio simple por ahora
    const valorCuota = totalVenta / numCuotas; 

    let dineroDisponibleParaCubrir = montoPagadoTotal;

    this.cuotasVisuales = [];

    for (let i = 1; i <= numCuotas; i++) {
      let estado: 'PAGADO' | 'PARCIAL' | 'PENDIENTE' = 'PENDIENTE';
      let pagadoEnEsta = 0;
      
      if (dineroDisponibleParaCubrir >= valorCuota) {
        // Esta cuota está cubierta totalmente
        estado = 'PAGADO';
        pagadoEnEsta = valorCuota;
        dineroDisponibleParaCubrir -= valorCuota;
      } else if (dineroDisponibleParaCubrir > 0) {
        // Esta cuota tiene un pago parcial
        estado = 'PARCIAL';
        pagadoEnEsta = dineroDisponibleParaCubrir;
        dineroDisponibleParaCubrir = 0;
      } else {
        // No queda dinero para esta cuota
        estado = 'PENDIENTE';
        pagadoEnEsta = 0;
      }

      this.cuotasVisuales.push({
        numero: i,
        monto: valorCuota,
        estado: estado,
        pagado: pagadoEnEsta,
        pendiente: valorCuota - pagadoEnEsta
      });
    }

    // Seleccionamos automáticamente la primera cuota no pagada para facilitar
    const primeraPendiente = this.cuotasVisuales.find(c => c.estado !== 'PAGADO');
    if (primeraPendiente) {
      this.seleccionarCuota(primeraPendiente);
    }
  }

  seleccionarCuota(c: CuotaVisual) {
    if (c.estado === 'PAGADO') return; // No se puede pagar lo ya pagado
    
    this.cuotaSeleccionada = c;
    // Sugerimos pagar lo que falta de esa cuota
    this.montoAPagar = Number(c.pendiente.toFixed(2));
  }

  esPagoDigital(): boolean {
    return ['YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'].includes(this.metodoPago);
  }

  confirmarPago() {
    if (this.montoAPagar <= 0) return;
    
    this.dialogRef.close({
      monto: this.montoAPagar,
      metodo: this.metodoPago,
      cuentaId: this.cuentaId
    });
  }
}