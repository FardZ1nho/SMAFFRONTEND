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
import { MatTabsModule } from '@angular/material/tabs'; 
import { forkJoin } from 'rxjs';
import { Router, RouterLink } from '@angular/router'; 

// Servicios
import { VentaService } from '../../services/venta-service';
import { CompraService } from '../../services/compra-service';
import { MovimientoCajaService } from '../../services/movimiento-caja-service';  

// Modelos
import { Venta, EstadoVenta } from '../../models/venta';
import { CompraResponse } from '../../models/compra';
import { MovimientoCajaResponse } from '../../models/movimiento-caja'; 

// Componentes Modal
import { NuevoMovimientoModalComponent } from './nuevo-movimiento-modal/nuevo-movimiento-modal'; 
import { GastoMenorModalComponent } from './gasto-menor-modal/gasto-menor-modal'; 
import { GastoMenorDetalleModalComponent } from './gasto-menor-detalle-modal/gasto-menor-detalle-modal';

export interface MovimientoCaja {
  idRegistro?: number; 
  origen?: string;     
  fecha: Date;
  tipo: 'INGRESO' | 'EGRESO';
  descripcion: string;
  tipoComprobante: string;
  referencia: string; 
  monto: number;
  entidad: string; 
  metodoPago?: string; 
  esAjuste?: boolean; 
  rawData?: any; 
}

@Component({
  selector: 'app-caja-chica',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatCardModule, MatProgressBarModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule,
    MatTooltipModule, MatDialogModule, MatSnackBarModule, MatTabsModule,
    NuevoMovimientoModalComponent,
    RouterLink
  ],
  templateUrl: './caja-chica.html',
  styleUrls: ['./caja-chica.css']
})
export class CajaChicaComponent implements OnInit {

  movimientos: MovimientoCaja[] = [];
  dataSource = new MatTableDataSource<MovimientoCaja>([]);
  dataSourceGastos = new MatTableDataSource<MovimientoCaja>([]);

  totalIngresosEfectivo: number = 0;
  totalEgresosEfectivo: number = 0;
  saldoEnCaja: number = 0;

  cargando: boolean = true;
  filtroFecha: Date | null = null; 

  mostrarModalAjuste: boolean = false;

  displayedColumns: string[] = ['fecha', 'tipo', 'comprobante', 'descripcion', 'entidad', 'monto', 'acciones'];
  displayedColumnsGastos: string[] = ['fecha', 'comprobante', 'entidad', 'monto', 'acciones'];

  constructor(
    private ventaService: VentaService,
    private compraService: CompraService,
    private movimientoManualService: MovimientoCajaService, 
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog, 
    private snackBar: MatSnackBar,
    private router: Router 
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
              if (String(pago.metodoPago).toUpperCase() === 'EFECTIVO') {
                ingresos.push({
                  idRegistro: v.id,      
                  origen: 'VENTA',       
                  fecha: new Date(v.fechaVenta), 
                  tipo: 'INGRESO',
                  descripcion: 'VENTA',
                  tipoComprobante: v.tipoDocumento || 'VENTA',
                  referencia: v.numeroDocumento || v.codigo,
                  monto: pago.monto,
                  entidad: v.nombreCliente || 'Cliente General',
                  metodoPago: 'EFECTIVO',
                  esAjuste: false,
                  rawData: v
                });
              }
            });
          }
        });

        compras.forEach((c: CompraResponse) => {
          if (c.estado !== 'ANULADA' && c.pagos && c.pagos.length > 0) {
            c.pagos.forEach(pago => {
              if (String(pago.metodoPago).toUpperCase() === 'EFECTIVO') {
                egresos.push({
                  idRegistro: c.id,      
                  origen: 'COMPRA',      
                  fecha: new Date(c.fechaEmision), 
                  tipo: 'EGRESO',
                  descripcion: 'COMPRA',
                  tipoComprobante: c.tipoComprobante || 'COMPRA',
                  referencia: `${c.serie}-${c.numero}`,
                  monto: pago.monto, 
                  entidad: c.nombreProveedor || 'Proveedor General',
                  metodoPago: 'EFECTIVO',
                  esAjuste: false,
                  rawData: c
                });
              }
            });
          }
        });

        ajustes.forEach((a: MovimientoCajaResponse) => {
          let tipoComp = 'AJUSTE MANUAL';
          let ref = 'Ajuste Manual';
          let descLimpia = a.motivo; 
          
          if (a.motivo.startsWith('[')) {
             const finCorchete = a.motivo.indexOf(']');
             if(finCorchete > -1) {
                 const extraido = a.motivo.substring(1, finCorchete);
                 const partes = extraido.split(' ');
                 tipoComp = partes[0]; 
                 if(partes.length > 1) ref = partes[1]; 
                 descLimpia = a.tipo === 'EGRESO' ? 'COMPRA' : 'VENTA';
             }
          }

          const ajusteMapeado: MovimientoCaja = {
            idRegistro: a.id,         
            origen: 'CAJA_CHICA',     
            fecha: new Date(a.fechaHora),
            tipo: a.tipo,
            descripcion: descLimpia, 
            tipoComprobante: tipoComp, 
            referencia: ref,
            monto: a.monto,
            entidad: a.responsable, 
            metodoPago: 'EFECTIVO',
            esAjuste: true,
            rawData: a 
          };

          if (a.tipo === 'INGRESO') ingresos.push(ajusteMapeado);
          if (a.tipo === 'EGRESO') egresos.push(ajusteMapeado);
        });

        this.movimientos = [...ingresos, ...egresos].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        this.dataSource.data = this.movimientos;
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
    this.totalIngresosEfectivo = datos.filter(m => m.tipo === 'INGRESO').reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
    this.totalEgresosEfectivo = datos.filter(m => m.tipo === 'EGRESO').reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
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

  abrirModalAjuste(): void { this.mostrarModalAjuste = true; }
  onAjusteCreado(): void { this.mostrarModalAjuste = false; this.cargarFlujoCaja(); }

  verDetalleGasto(gasto: MovimientoCaja): void {
    this.dialog.open(GastoMenorDetalleModalComponent, {
      width: '600px',
      data: gasto.rawData 
    });
  }

  // ✅ INTELIGENCIA DEL BOTÓN EDITAR
  editarMovimiento(row: MovimientoCaja): void {
    if (row.origen === 'COMPRA') {
      this.router.navigate(['/compras/editar', row.idRegistro]);
    } else if (row.origen === 'CAJA_CHICA') {
      // Abrimos el mismo modal pero le pasamos los datos a editar
      this.abrirModalGastoMenor(row);
    } else if (row.origen === 'VENTA') {
      this.snackBar.open('Las ventas se editan desde el Módulo de Ventas.', 'Cerrar', { duration: 3000 });
    }
  }

  // ✅ AHORA EL MODAL ACEPTA UN PARÁMETRO OPCIONAL (rowAEditar)
  abrirModalGastoMenor(rowAEditar?: MovimientoCaja): void {
    const dialogRef = this.dialog.open(GastoMenorModalComponent, {
      width: '1200px', 
      maxWidth: '95vw', 
      height: '85vh', 
      disableClose: true,
      data: rowAEditar || null // Pasamos los datos si estamos editando
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        setTimeout(() => {
          this.cargando = true;
          const detalleItems = resultado.items.map((i: any) => `${i.cantidad}x ${i.descripcion}`).join(', ');
          const comprobanteStr = resultado.serie && resultado.numero ? `[${resultado.tipoComprobante} ${resultado.serie}-${resultado.numero}]` : `[${resultado.tipoComprobante}]`;
          let motivoCompleto = `${comprobanteStr} Compra: ${detalleItems}. ${resultado.observaciones ? 'Obs: '+resultado.observaciones : ''}`;
          if (motivoCompleto.length > 250) motivoCompleto = motivoCompleto.substring(0, 247) + '...';

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

          // DECIDIMOS SI ACTUALIZAR O REGISTRAR NUEVO
          if (rowAEditar && rowAEditar.idRegistro) {
            // 🔄 ACTUALIZAR (Asegúrate que tu service tenga el método actualizar)
            this.movimientoManualService.actualizar(rowAEditar.idRegistro, request).subscribe({
              next: () => {
                this.snackBar.open('Gasto actualizado correctamente', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
                this.cargarFlujoCaja(); 
              },
              error: (err) => {
                this.snackBar.open(err.error?.mensaje || 'Error al actualizar', 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
                this.cargando = false;
              }
            });
          } else {
            // ➕ REGISTRAR NUEVO
            this.movimientoManualService.registrar(request).subscribe({
              next: () => {
                this.snackBar.open('Gasto registrado correctamente', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
                this.cargarFlujoCaja(); 
              },
              error: (err) => {
                this.snackBar.open(err.error?.mensaje || 'Error', 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
                this.cargando = false;
              }
            });
          }
        });
      }
    });
  }
}