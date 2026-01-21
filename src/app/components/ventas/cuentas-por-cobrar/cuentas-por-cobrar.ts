import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Servicios y Modelos
import { VentaService } from '../../../services/venta-service';
import { Venta } from '../../../models/venta';
import { AmortizarModalComponent } from '../amortizar-modal/amortizar-modal'; // Reutilizamos tu modal de pago

@Component({
  selector: 'app-cuentas-por-cobrar',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, 
    MatIconModule, MatInputModule, MatTooltipModule, MatProgressBarModule
  ],
  templateUrl: './cuentas-por-cobrar.html',
  styleUrls: ['./cuentas-por-cobrar.css']
})
export class CuentasPorCobrarComponent implements OnInit {

  deudas: Venta[] = [];
  dataSource = new MatTableDataSource<Venta>([]);
  
  // Stats
  totalPorCobrar: number = 0;
  clientesDeudores: number = 0;
  
  filtroTexto: string = '';
  cargando: boolean = true;

  displayedColumns: string[] = ['cliente', 'comprobante', 'fecha', 'total', 'abonado', 'saldo', 'acciones'];

  constructor(
    private ventaService: VentaService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDeudas();
  }

  cargarDeudas(): void {
    this.cargando = true;
    this.ventaService.listarTodas().subscribe({
      next: (ventas) => {
        // FILTRO MAESTRO: Solo ventas a CRÉDITO con SALDO PENDIENTE positivo
        this.deudas = ventas.filter(v => v.tipoPago === 'CREDITO' && (v.saldoPendiente || 0) > 0.1);
        
        this.dataSource.data = this.deudas;
        this.calcularTotales();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  calcularTotales(): void {
    this.totalPorCobrar = this.deudas.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0);
    // Contar clientes únicos
    const clientesSet = new Set(this.deudas.map(v => v.nombreCliente));
    this.clientesDeudores = clientesSet.size;
  }

  filtrar(): void {
    const texto = this.filtroTexto.toLowerCase();
    this.dataSource.data = this.deudas.filter(v => 
      v.nombreCliente?.toLowerCase().includes(texto) ||
      v.codigo.toLowerCase().includes(texto)
    );
  }

  // ✅ ACCIÓN DE COBRAR
  registrarCobro(venta: Venta): void {
    const dialogRef = this.dialog.open(AmortizarModalComponent, {
      width: '500px',
      data: { venta: venta }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ventaService.registrarPago(venta.id, result.monto, result.metodo, result.cuentaId)
          .subscribe(() => {
            this.cargarDeudas(); // Recargar para actualizar saldos
          });
      }
    });
  }

  verDetalle(id: number): void {
    // Redirigir al detalle de la venta o abrir modal
    // this.router.navigate(['/ventas/detalle', id]);
  }

  // Helpers
  getPorcentajePagado(venta: Venta): number {
    if (!venta.total || venta.total === 0) return 0;
    const pagado = venta.total - (venta.saldoPendiente || 0);
    return (pagado / venta.total) * 100;
  }
}