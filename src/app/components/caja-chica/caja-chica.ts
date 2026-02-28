import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip'; 
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; 
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; 
// ✅ IMPORTAMOS LAS TABS
import { MatTabsModule } from '@angular/material/tabs'; 
import { forkJoin } from 'rxjs';

// Servicios
import { VentaService } from '../../services/venta-service';
import { CompraService } from '../../services/compra-service';
import { MovimientoCajaService } from '../../services/movimiento-caja-service';  

// Modelos
import { Venta, MetodoPago, EstadoVenta } from '../../models/venta';
import { CompraResponse } from '../../models/compra';
import { MovimientoCajaResponse, MovimientoCajaRequest } from '../../models/movimiento-caja'; 

// Componentes Modal
import { NuevoMovimientoModalComponent } from './nuevo-movimiento-modal/nuevo-movimiento-modal'; 
import { GastoMenorModalComponent } from './gasto-menor-modal/gasto-menor-modal'; 
import { GastoMenorDetalleModalComponent } from './gasto-menor-detalle-modal/gasto-menor-detalle-modal';  
export interface MovimientoCaja {
  fecha: Date;
  tipo: 'INGRESO' | 'EGRESO';
  descripcion: string;
  tipoComprobante: string;
  referencia: string; 
  monto: number;
  entidad: string; 
  metodoPago?: string; 
  esAjuste?: boolean; 
  rawData?: any; // ✅ Para pasar la data original al modal de detalle
}

@Component({
  selector: 'app-caja-chica',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, 
    MatIconModule, MatCardModule, MatProgressBarModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule,
    MatTooltipModule, MatDialogModule, MatSnackBarModule, MatTabsModule, // ✅ AÑADIDO Módulo de Tabs
    NuevoMovimientoModalComponent 
  ],
  templateUrl: './caja-chica.html',
  styleUrls: ['./caja-chica.css']
})
export class CajaChicaComponent implements OnInit {

  movimientos: MovimientoCaja[] = [];
  dataSource = new MatTableDataSource<MovimientoCaja>([]);
  
  // ✅ NUEVA DATA SOURCE PARA LA SEGUNDA TAB (Solo Gastos Manuales)
  dataSourceGastos = new MatTableDataSource<MovimientoCaja>([]);

  totalIngresosEfectivo: number = 0;
  totalEgresosEfectivo: number = 0;
  saldoEnCaja: number = 0;

  cargando: boolean = true;
  filtroFecha: Date | null = null; 

  mostrarModalAjuste: boolean = false;

  displayedColumns: string[] = ['fecha', 'tipo', 'comprobante', 'descripcion', 'entidad', 'monto'];
  // ✅ COLUMNAS PARA LA NUEVA TAB
  displayedColumnsGastos: string[] = ['fecha', 'comprobante', 'entidad', 'monto', 'acciones'];

  constructor(
    private ventaService: VentaService,
    private compraService: CompraService,
    private movimientoManualService: MovimientoCajaService, 
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog, 
    private snackBar: MatSnackBar 
  ) {}

  ngOnInit(): void {
    this.cargarFlujoCaja();
  }

  cargarFlujoCaja(): void {
    this.cargando = true;

    forkJoin({
      ventas: this.ventaService.listarTodas(),
      compras: this.compraService.listarTodas(),
      ajustes: this.movimientoManualService.listar() 
    }).subscribe({
      next: (response) => {
        const { ventas, compras, ajustes } = response;
        
        const ingresos: MovimientoCaja[] = [];
        const egresos: MovimientoCaja[] = []; 

        ventas.forEach((v: Venta) => {
          if (v.estado !== EstadoVenta.CANCELADA && v.pagos && v.pagos.length > 0) {
            v.pagos.forEach(pago => {
              const metodoStr = String(pago.metodoPago).toUpperCase();

              if (metodoStr === 'EFECTIVO') {
                ingresos.push({
                  fecha: new Date(v.fechaVenta), 
                  tipo: 'INGRESO',
                  descripcion: `Cobro Venta #${v.codigo}`,
                  tipoComprobante: v.tipoDocumento || 'VENTA',
                  referencia: v.numeroDocumento || v.codigo,
                  monto: pago.monto,
                  entidad: v.nombreCliente || 'Cliente General',
                  metodoPago: 'EFECTIVO',
                  esAjuste: false
                });
              }
            });
          }
        });

        compras.forEach((c: CompraResponse) => {
          if (c.estado !== 'ANULADA' && c.pagos && c.pagos.length > 0) {
            c.pagos.forEach(pago => {
              const metodoStr = String(pago.metodoPago).toUpperCase();

              if (metodoStr === 'EFECTIVO') {
                egresos.push({
                  fecha: new Date(c.fechaEmision), 
                  tipo: 'EGRESO',
                  descripcion: c.tipoCompra === 'BIEN' ? 'Compra de Mercadería' : 'Gasto / Servicio',
                  tipoComprobante: c.tipoComprobante || 'COMPRA',
                  referencia: `${c.serie}-${c.numero}`,
                  monto: pago.monto, 
                  entidad: c.nombreProveedor || 'Proveedor General',
                  metodoPago: 'EFECTIVO',
                  esAjuste: false
                });
              }
            });
          }
        });

        ajustes.forEach((a: MovimientoCajaResponse) => {
          let tipoComp = 'AJUSTE MANUAL';
          let ref = 'Ajuste Manual';
          
          if (a.motivo.startsWith('[')) {
             const finCorchete = a.motivo.indexOf(']');
             if(finCorchete > -1) {
                 const extraido = a.motivo.substring(1, finCorchete);
                 const partes = extraido.split(' ');
                 tipoComp = partes[0]; 
                 if(partes.length > 1) {
                     ref = partes[1]; 
                 }
             }
          }

          const ajusteMapeado: MovimientoCaja = {
            fecha: new Date(a.fechaHora),
            tipo: a.tipo,
            descripcion: a.motivo, 
            tipoComprobante: tipoComp, 
            referencia: ref,
            monto: a.monto,
            entidad: a.responsable, 
            metodoPago: 'EFECTIVO',
            esAjuste: true,
            rawData: a // Guardamos la data cruda para el modal
          };

          if (a.tipo === 'INGRESO') ingresos.push(ajusteMapeado);
          if (a.tipo === 'EGRESO') egresos.push(ajusteMapeado);
        });

        this.movimientos = [...ingresos, ...egresos].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        
        this.dataSource.data = this.movimientos;
        
        // ✅ POBLAMOS LA TABLA DE GASTOS MANULES SOLO CON EGRESOS DE TIPO AJUSTE
        this.dataSourceGastos.data = this.movimientos.filter(m => m.esAjuste && m.tipo === 'EGRESO');

        this.calcularTotales();
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando caja chica', err);
        this.cargando = false;
      }
    });
  }

calcularTotales(): void {
    const datos = this.dataSource.data;

    this.totalIngresosEfectivo = datos
      .filter(m => m.tipo === 'INGRESO')
      // ✅ CORRECCIÓN: Forzamos a que sea Número antes de sumar. Si viene vacío, suma 0.
      .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

    this.totalEgresosEfectivo = datos
      .filter(m => m.tipo === 'EGRESO')
      // ✅ CORRECCIÓN: Forzamos a que sea Número antes de sumar
      .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

    this.saldoEnCaja = this.totalIngresosEfectivo - this.totalEgresosEfectivo;
  }

  aplicarFiltroFecha(): void {
    if (!this.filtroFecha) {
      this.dataSource.data = this.movimientos;
      this.dataSourceGastos.data = this.movimientos.filter(m => m.esAjuste && m.tipo === 'EGRESO');
    } else {
      const fechaSel = this.filtroFecha.toDateString();
      const filtrados = this.movimientos.filter(m => m.fecha.toDateString() === fechaSel);
      this.dataSource.data = filtrados;
      this.dataSourceGastos.data = filtrados.filter(m => m.esAjuste && m.tipo === 'EGRESO');
    }
    this.calcularTotales();
  }

  limpiarFiltro(): void {
    this.filtroFecha = null;
    this.dataSource.data = this.movimientos;
    this.dataSourceGastos.data = this.movimientos.filter(m => m.esAjuste && m.tipo === 'EGRESO');
    this.calcularTotales();
  }

  abrirModalAjuste(): void {
    this.mostrarModalAjuste = true;
  }

  onAjusteCreado(): void {
    this.mostrarModalAjuste = false;
    this.cargarFlujoCaja(); 
  }

  // ✅ FUNCIÓN PARA VER EL DETALLE DE LA COMPRA MANUAL
  verDetalleGasto(gasto: MovimientoCaja): void {
    this.dialog.open(GastoMenorDetalleModalComponent, {
      width: '600px',
      data: gasto.rawData // Le pasamos la data original al modal
    });
  }

  abrirModalGastoMenor(): void {
    const dialogRef = this.dialog.open(GastoMenorModalComponent, {
      width: '1200px', 
      maxWidth: '95vw',
      height: '85vh',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        setTimeout(() => {
          this.cargando = true;

          const detalleItems = resultado.items.map((i: any) => `${i.cantidad}x ${i.descripcion}`).join(', ');
          const comprobanteStr = resultado.serie && resultado.numero ? `[${resultado.tipoComprobante} ${resultado.serie}-${resultado.numero}]` : `[${resultado.tipoComprobante}]`;
          
          let motivoCompleto = `${comprobanteStr} Compra: ${detalleItems}. ${resultado.observaciones ? 'Obs: '+resultado.observaciones : ''}`;
          
          if (motivoCompleto.length > 250) {
            motivoCompleto = motivoCompleto.substring(0, 247) + '...';
          }

          const fechaObj = new Date(resultado.fechaEmision);
          const tzOffset = fechaObj.getTimezoneOffset() * 60000;
          const fechaPerfectaParaJava = new Date(fechaObj.getTime() - tzOffset).toISOString().split('.')[0]; 

          const request: any = {
            tipo: 'EGRESO',
            monto: Number(resultado.total), 
            motivo: motivoCompleto,
            responsable: resultado.proveedor.trim(),
            fechaHora: fechaPerfectaParaJava 
          };

          this.movimientoManualService.registrar(request).subscribe({
            next: () => {
              this.snackBar.open('Gasto registrado correctamente', 'Cerrar', {
                duration: 3000, panelClass: ['snackbar-success'], horizontalPosition: 'right', verticalPosition: 'top'
              });
              this.cargarFlujoCaja(); 
            },
            error: (err) => {
              console.error('Error del backend:', err);
              const mensajeError = err.error?.mensaje || err.error?.message || 'Error del servidor';
              this.snackBar.open(mensajeError, 'Cerrar', {
                duration: 5000, panelClass: ['snackbar-error'], horizontalPosition: 'right', verticalPosition: 'top'
              });
              this.cargando = false;
            }
          });
        });
      }
    });
  }
}