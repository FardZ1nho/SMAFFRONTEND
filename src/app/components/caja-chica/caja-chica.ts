import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select'; 
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { forkJoin } from 'rxjs';
import { Router, RouterLink } from '@angular/router'; 

import { VentaService } from '../../services/venta-service';
import { CompraService } from '../../services/compra-service';
import { MovimientoCajaService } from '../../services/movimiento-caja-service';  

import { Venta, EstadoVenta } from '../../models/venta';
import { CompraResponse } from '../../models/compra';
import { MovimientoCajaResponse, TurnoCaja } from '../../models/movimiento-caja'; 

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
    MatSelectModule, MatPaginatorModule,
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
  mostrarModalAjuste: boolean = false;
  
  turnoActivo: TurnoCaja | null = null;

  filtroFecha: Date | null = null; 
  comprobantesSeleccionados: string[] = [];
  tiposComprobanteDisponibles: string[] = [];
  terminoBusqueda: string = '';

  displayedColumns: string[] = ['fecha', 'tipo', 'comprobante', 'descripcion', 'entidad', 'monto', 'acciones'];
  displayedColumnsGastos: string[] = ['fecha', 'comprobante', 'entidad', 'monto', 'acciones'];

  @ViewChild('paginatorGeneral') set matPaginatorGeneral(mp: MatPaginator) {
    this.dataSource.paginator = mp;
  }
  @ViewChild('paginatorGastos') set matPaginatorGastos(mp: MatPaginator) {
    this.dataSourceGastos.paginator = mp;
  }

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
    this.verificarTurno();
    this.cargarFlujoCaja();
  }

  verificarTurno(): void {
    this.movimientoManualService.obtenerTurnoActivo().subscribe({
      next: (turno) => {
        this.turnoActivo = turno;
        this.cdr.detectChanges(); 
      },
      error: () => {
        this.turnoActivo = null;
        this.cdr.detectChanges(); 
      }
    });
  }

  abrirCaja(): void {
    const saldoSugerido = this.saldoEnCaja.toFixed(2);
    
    const input = prompt(
      `APERTURA DE CAJA\nEl sistema detecta un saldo acumulado de S/ ${saldoSugerido}.\n\nConfirme el dinero físico exacto con el que inicia el turno:`, 
      saldoSugerido
    );
    
    if (input !== null && !isNaN(Number(input))) {
      this.movimientoManualService.abrirCaja(Number(input), 'Usuario Actual').subscribe({
        next: () => {
          this.snackBar.open('Turno de Caja Abierto correctamente', 'OK', { duration: 3000, panelClass: 'snackbar-success' });
          this.verificarTurno();
        },
        error: (err) => this.snackBar.open('Error al abrir caja', 'Cerrar', { duration: 3000 })
      });
    }
  }

  cerrarCaja(): void {
    const saldoEsperado = this.saldoEnCaja.toFixed(2);
    
    const input = prompt(
      `ARQUEO DE CAJA\nEl sistema espera que en tu cajón haya: S/ ${saldoEsperado}\n\nCuente sus billetes y monedas, e ingrese el monto físico REAL:`, 
      saldoEsperado
    );
    
    if (input !== null && !isNaN(Number(input))) {
      this.movimientoManualService.cerrarCaja(Number(input)).subscribe({
        
        // ✅ CORREGIDO: Un solo bloque "next", sin código duplicado.
        next: (turnoCerrado) => {
          
          const descuadre = turnoCerrado.descuadre ?? 0; 
          const diferenciaStr = Math.abs(descuadre).toFixed(2);

          if (descuadre === 0) {
            alert(`✅ CIERRE PERFECTO\nLa caja cuadró exactamente en S/ ${saldoEsperado}. Buen trabajo.`);
          } else if (descuadre > 0) {
            alert(`⚠️ SOBRANTE DE CAJA\nTe sobran S/ ${diferenciaStr} físicos respecto a lo que dice el sistema.`);
          } else {
            alert(`🚨 FALTANTE DE CAJA\nTe faltan S/ ${diferenciaStr} para que la caja cuadre.`);
          }

          this.turnoActivo = null;
          this.cdr.detectChanges(); 
        },
        error: (err) => this.snackBar.open('Error al cerrar caja', 'Cerrar', { duration: 3000 })
      });
    }
  }

  transferirBanco(): void {
    if (!this.turnoActivo) {
      this.snackBar.open('Debe abrir la caja primero', 'OK', { duration: 3000 });
      return;
    }
    const input = prompt(`SALDO DISPONIBLE: S/ ${this.saldoEnCaja}\n\nIngrese el monto a depositar al banco:`);
    if (input !== null && Number(input) > 0) {
      this.movimientoManualService.depositarABanco(Number(input), 1, 'Usuario Actual').subscribe({
        next: () => {
          this.snackBar.open('Depósito registrado', 'OK', { duration: 3000, panelClass: 'snackbar-success' });
          this.cargarFlujoCaja();
        }
      });
    }
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
        this.tiposComprobanteDisponibles = [...new Set(this.movimientos.map(m => m.tipoComprobante))].sort();

        this.aplicarFiltros(); 
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando caja chica', err);
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    let filtrados = this.movimientos;

    if (this.filtroFecha) {
      const fechaSel = this.filtroFecha.toDateString();
      filtrados = filtrados.filter(m => m.fecha.toDateString() === fechaSel);
    }

    if (this.comprobantesSeleccionados && this.comprobantesSeleccionados.length > 0) {
      filtrados = filtrados.filter(m => this.comprobantesSeleccionados.includes(m.tipoComprobante));
    }

    if (this.terminoBusqueda && this.terminoBusqueda.trim() !== '') {
      const term = this.terminoBusqueda.toLowerCase();
      filtrados = filtrados.filter(m => 
        (m.descripcion && m.descripcion.toLowerCase().includes(term)) ||
        (m.entidad && m.entidad.toLowerCase().includes(term)) ||
        (m.referencia && m.referencia.toLowerCase().includes(term))
      );
    }

    this.dataSource.data = filtrados;
    this.dataSourceGastos.data = filtrados.filter(m => m.esAjuste && m.tipo === 'EGRESO');
    this.calcularTotales();

    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
    if (this.dataSourceGastos.paginator) this.dataSourceGastos.paginator.firstPage();
  }

  limpiarFiltro(): void {
    this.filtroFecha = null;
    this.comprobantesSeleccionados = [];
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  formatearTipoComprobante(tipo: string): string {
    if (!tipo) return '';
    return tipo.replace(/_/g, ' ');
  }

  calcularTotales(): void {
    const datos = this.dataSource.data;
    this.totalIngresosEfectivo = datos.filter(m => m.tipo === 'INGRESO').reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
    this.totalEgresosEfectivo = datos.filter(m => m.tipo === 'EGRESO').reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
    this.saldoEnCaja = this.totalIngresosEfectivo - this.totalEgresosEfectivo;
  }

  abrirModalAjuste(): void { this.mostrarModalAjuste = true; }
  onAjusteCreado(): void { this.mostrarModalAjuste = false; this.cargarFlujoCaja(); }

  verDetalleGasto(gasto: MovimientoCaja): void {
    this.dialog.open(GastoMenorDetalleModalComponent, { width: '600px', data: gasto.rawData });
  }

  editarMovimiento(row: MovimientoCaja): void {
    if (row.origen === 'COMPRA') {
      this.router.navigate(['/compras/editar', row.idRegistro]);
    } else if (row.origen === 'CAJA_CHICA') {
      this.abrirModalGastoMenor(row);
    } else if (row.origen === 'VENTA') {
      this.snackBar.open('Las ventas se editan desde el Módulo de Ventas.', 'Cerrar', { duration: 3000 });
    }
  }

  eliminarMovimiento(row: MovimientoCaja): void {
    if (row.origen === 'CAJA_CHICA' && row.idRegistro) {
      if (confirm('¿Estás seguro de eliminar este movimiento? El saldo en caja se recalculará automáticamente.')) {
        this.movimientoManualService.eliminar(row.idRegistro).subscribe({
          next: () => {
            this.snackBar.open('Movimiento eliminado correctamente', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
            this.cargarFlujoCaja(); 
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open('Error al eliminar el movimiento', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
          }
        });
      }
    } else {
      this.snackBar.open('Las compras/ventas deben anularse desde su propio módulo (Inventario o Ventas).', 'Entendido', { duration: 5000 });
    }
  }

  abrirModalGastoMenor(rowAEditar?: MovimientoCaja): void {
    if (!this.turnoActivo) {
      this.snackBar.open('¡Caja Cerrada! Debe abrir la caja para registrar gastos.', 'Entendido', { duration: 4000 });
      return;
    }

    const dialogRef = this.dialog.open(GastoMenorModalComponent, {
      width: '1200px', maxWidth: '95vw', height: '85vh', disableClose: true, data: rowAEditar || null 
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
            fechaHora: fechaPerfectaParaJava,
            categoria: resultado.categoria
          };

          if (rowAEditar && rowAEditar.idRegistro) {
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