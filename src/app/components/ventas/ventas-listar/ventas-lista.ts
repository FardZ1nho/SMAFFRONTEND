import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs'; 
import { MatProgressBarModule } from '@angular/material/progress-bar'; 
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';

import { VentaService } from '../../../services/venta-service';
import { NotaCreditoService } from '../../../services/nota-credito-service';
import { Venta, EstadoVenta } from '../../../models/venta';
import { VentaDetalleComponent } from '../venta-detalle/venta-detalle'; 
import { NotaCreditoModalComponent } from '../nota-credito-modal/nota-credito-modal'; 
import { AmortizarModalComponent } from '../amortizar-modal/amortizar-modal'; 

@Component({
    selector: 'app-ventas-lista',
    standalone: true,
    imports: [
        CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
        MatInputModule, MatFormFieldModule, MatSelectModule, MatChipsModule,
        MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule, MatMenuModule,
        MatTabsModule, MatProgressBarModule, MatPaginatorModule
    ],
    templateUrl: './ventas-lista.html',
    styleUrls: ['./ventas-lista.css']
})
export class VentasListaComponent implements OnInit {
    
    // === TAB 1: HISTORIAL ===
    ventas: Venta[] = [];
    ventasFiltradas = new MatTableDataSource<Venta>([]);
    
    // === TAB 2: CUENTAS POR COBRAR ===
    deudasFiltradas = new MatTableDataSource<Venta>([]);
    totalPorCobrar: number = 0;
    clientesDeudores: number = 0;
    
    // Filtros Extendidos
    terminoBusqueda: string = '';
    estadoFiltro: string = 'TODAS';
    metodoPagoFiltro: string = 'TODOS';
    fechaInicio: string = ''; 
    fechaFin: string = '';

    // Estados de carga
    isLoading: boolean = false;
    errorMessage: string = '';

    // Variables Financieras (Dinámicas)
    totalVentas: number = 0;       
    totalNotasCredito: number = 0; 
    ingresoNetoReal: number = 0;    

    // Columnas
    displayedColumns: string[] = ['codigo', 'fechaVenta', 'cliente', 'metodoPago', 'total', 'estado', 'acciones'];
    displayedColumnsDeudas: string[] = ['cliente', 'codigo', 'fechaVenta', 'total', 'abonado', 'saldo', 'acciones'];

    estadosVenta = [
        { value: 'TODAS', label: 'Todas' },
        { value: EstadoVenta.COMPLETADA, label: 'Completadas' },
        { value: EstadoVenta.PENDIENTE, label: 'Pendientes (Crédito)' }, 
        { value: EstadoVenta.BORRADOR, label: 'Borradores' },
        { value: EstadoVenta.CANCELADA, label: 'Canceladas' }
    ];

    @ViewChild('paginatorVentas') set matPaginatorVentas(mp: MatPaginator) {
        this.ventasFiltradas.paginator = mp;
    }
    @ViewChild('paginatorDeudas') set matPaginatorDeudas(mp: MatPaginator) {
        this.deudasFiltradas.paginator = mp;
    }

    constructor(
        private ventaService: VentaService,
        private notaCreditoService: NotaCreditoService,
        private cdr: ChangeDetectorRef,
        private snackBar: MatSnackBar,
        private router: Router,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.establecerMesActual();
        this.cargarVentas();
        this.cargarTotalNotasCredito();
    }

    establecerMesActual(): void {
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.fechaInicio = primerDia.toISOString().split('T')[0];
        this.fechaFin = hoy.toISOString().split('T')[0];
    }

    // ========== CARGA DE DATOS ==========

    cargarVentas(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.ventaService.listarTodas().subscribe({
            next: (data) => {
                this.ventas = data.sort((a, b) => {
                    const fechaA = new Date(a.fechaVenta || 0).getTime();
                    const fechaB = new Date(b.fechaVenta || 0).getTime();
                    return fechaB - fechaA; 
                });
                
                this.aplicarFiltros();     
                
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar ventas:', error);
                this.errorMessage = 'Error al cargar las ventas';
                this.isLoading = false;
                this.mostrarMensaje('Error al cargar ventas', 'error');
                this.cdr.detectChanges();
            }
        });
    }

    cargarTotalNotasCredito(): void {
        this.notaCreditoService.obtenerTotalDevoluciones().subscribe({
            next: (monto) => {
                this.totalNotasCredito = monto || 0;
                this.aplicarFiltros(); 
            },
            error: (err) => console.error('Error cargando notas de crédito', err)
        });
    }

    // ========== FILTROS Y FINANZAS ==========

    aplicarFiltros(): void {
        let filtradas = [...this.ventas];

        if (this.estadoFiltro !== 'TODAS') {
            filtradas = filtradas.filter(v => v.estado === this.estadoFiltro);
        }

        if (this.metodoPagoFiltro !== 'TODOS') {
            filtradas = filtradas.filter(v => {
                if (this.metodoPagoFiltro === 'CREDITO') return v.tipoPago === 'CREDITO';
                if (!v.pagos || v.pagos.length === 0) return false;
                return v.pagos.some(p => p.metodoPago === this.metodoPagoFiltro);
            });
        }

        if (this.fechaInicio && this.fechaFin) {
            const fInicio = new Date(this.fechaInicio + 'T00:00:00');
            const fFin = new Date(this.fechaFin + 'T23:59:59');
            
            filtradas = filtradas.filter(v => {
                const fechaVenta = new Date(v.fechaVenta);
                return fechaVenta >= fInicio && fechaVenta <= fFin;
            });
        }

        if (this.terminoBusqueda.trim()) {
            const termino = this.terminoBusqueda.toLowerCase();
            filtradas = filtradas.filter(v =>
                v.codigo.toLowerCase().includes(termino) ||
                (v.numeroDocumento && v.numeroDocumento.toLowerCase().includes(termino)) ||
                (v.nombreCliente && v.nombreCliente.toLowerCase().includes(termino))
            );
        }

        this.ventasFiltradas.data = filtradas;
        
        this.actualizarDeudas(this.terminoBusqueda); 
        this.calcularFinanzasDinamicas(filtradas);

        if (this.ventasFiltradas.paginator) {
            this.ventasFiltradas.paginator.firstPage();
        }
    }

    actualizarDeudas(termino: string = ''): void {
        let deudas = this.ventas.filter(v => v.estado === EstadoVenta.PENDIENTE && (v.saldoPendiente || 0) > 0.1);
        
        if (termino.trim()) {
            const t = termino.toLowerCase();
            deudas = deudas.filter(v => 
                v.codigo.toLowerCase().includes(t) ||
                (v.numeroDocumento && v.numeroDocumento.toLowerCase().includes(t)) ||
                (v.nombreCliente && v.nombreCliente.toLowerCase().includes(t))
            );
        }

        this.deudasFiltradas.data = deudas;
        
        // 🔥 CORRECCIÓN: Convierte deudas en USD a PEN para el resumen global
        this.totalPorCobrar = deudas.reduce((acc, v) => {
            let saldo = v.saldoPendiente || 0;
            if (v.moneda === 'USD') {
                saldo = saldo * (v.tipoCambio || 3.80); // Usa el tipo de cambio de la venta
            }
            return acc + saldo;
        }, 0);
        
        const uniqueClients = new Set(deudas.map(v => v.nombreCliente));
        this.clientesDeudores = uniqueClients.size;

        if (this.deudasFiltradas.paginator) {
            this.deudasFiltradas.paginator.firstPage();
        }
    }

    calcularFinanzasDinamicas(ventasFiltradas: Venta[]): void {
        // 🔥 CORRECCIÓN: Multiplica las ventas en USD por su tipo de cambio
        let sumaCompletadas = ventasFiltradas
            .filter(v => v.estado === EstadoVenta.COMPLETADA)
            .reduce((sum, v) => {
                let total = v.total || 0;
                if (v.moneda === 'USD') {
                    total = total * (v.tipoCambio || 3.80);
                }
                return sum + total;
            }, 0);

        let sumaParciales = ventasFiltradas
            .filter(v => v.estado === EstadoVenta.PENDIENTE)
            .reduce((sum, v) => {
                let inicial = v.montoInicial || 0;
                let abonos = v.pagos ? v.pagos.reduce((acc, p) => acc + p.monto, 0) : 0;
                let pagadoTotal = inicial + abonos;
                
                if (v.moneda === 'USD') {
                    pagadoTotal = pagadoTotal * (v.tipoCambio || 3.80);
                }
                return sum + pagadoTotal;
            }, 0);

        this.totalVentas = sumaCompletadas + sumaParciales;
        this.ingresoNetoReal = this.totalVentas - this.totalNotasCredito;
    }

    onEstadoChange(): void { this.aplicarFiltros(); }
    buscarVentas(): void { this.aplicarFiltros(); }
    limpiarBusqueda(): void { this.terminoBusqueda = ''; this.aplicarFiltros(); }
    
    // ========== ACCIONES ==========
    irANotasCredito(): void { this.router.navigate(['/ventas/notas-credito']); }
    nuevaVenta(): void { this.router.navigate(['/ventas/nueva']); }
    editarBorrador(venta: Venta): void { this.router.navigate(['/ventas', venta.id]); }
    editarVenta(venta: Venta): void { this.router.navigate(['/ventas', venta.id]); }

    completarVenta(venta: Venta): void {
        if (confirm(`¿Deseas completar la venta ${venta.numeroDocumento ? venta.numeroDocumento : venta.codigo}?`)) {
            this.ventaService.completarVenta(venta.id).subscribe({
                next: () => { this.mostrarMensaje('✅ Venta completada', 'success'); this.cargarVentas(); },
                error: () => this.mostrarMensaje('Error al completar', 'error')
            });
        }
    }

    amortizarDeuda(venta: Venta): void {
        const dialogRef = this.dialog.open(AmortizarModalComponent, { width: '500px', data: { venta: venta } });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.ventaService.registrarPago(venta.id, result.monto, result.metodo, result.cuentaId).subscribe({
                    next: () => { this.mostrarMensaje('✅ Pago registrado', 'success'); this.cargarVentas(); },
                    error: () => this.mostrarMensaje('Error al registrar pago', 'error')
                });
            }
        });
    }

    cancelarVenta(venta: Venta): void {
        if (confirm(`¿Estás seguro de cancelar la venta ${venta.numeroDocumento ? venta.numeroDocumento : venta.codigo}?`)) {
            this.ventaService.cancelarVenta(venta.id).subscribe({
                next: () => { this.mostrarMensaje('✅ Venta cancelada', 'success'); this.cargarVentas(); },
                error: () => this.mostrarMensaje('Error al cancelar', 'error')
            });
        }
    }

    eliminarVenta(venta: Venta): void {
        if (confirm(`¿Estás seguro de eliminar la venta ${venta.numeroDocumento ? venta.numeroDocumento : venta.codigo}?`)) {
            this.ventaService.eliminarVenta(venta.id).subscribe({
                next: () => { this.mostrarMensaje('✅ Venta eliminada', 'success'); this.cargarVentas(); }
            });
        }
    }

    verDetalle(venta: Venta): void {
        this.dialog.open(VentaDetalleComponent, { width: '800px', maxWidth: '95vw', data: venta });
    }

    abrirModalNotaCredito(venta: Venta): void {
        const dialogRef = this.dialog.open(NotaCreditoModalComponent, { width: '500px', disableClose: true, data: venta });
        dialogRef.afterClosed().subscribe(seEmitioNota => {
            if (seEmitioNota) { this.cargarVentas(); this.cargarTotalNotasCredito(); }
        });
    }

    // ========== UTILIDADES DE VISTA ==========

    getPorcentajePagado(venta: Venta): number {
        if (!venta.total || venta.total === 0) return 0;
        const saldo = venta.saldoPendiente || 0;
        const pagado = venta.total - saldo;
        return (pagado / venta.total) * 100;
    }

    getEstadoClass(estado: string): string {
        switch (estado) {
            case EstadoVenta.COMPLETADA: return 'estado-completada';
            case EstadoVenta.PENDIENTE: return 'estado-pendiente'; 
            case EstadoVenta.BORRADOR: return 'estado-borrador';
            case EstadoVenta.CANCELADA: return 'estado-cancelada';
            default: return '';
        }
    }

    getEstadoLabel(estado: string): string {
        switch (estado) {
            case EstadoVenta.COMPLETADA: return 'Completada';
            case EstadoVenta.PENDIENTE: return 'Pendiente'; 
            case EstadoVenta.BORRADOR: return 'Borrador';
            case EstadoVenta.CANCELADA: return 'Cancelada';
            default: return estado;
        }
    }

    getMetodoPagoIcon(venta: any): string {
        if (venta.tipoPago === 'CREDITO' && (!venta.pagos || venta.pagos.length === 0)) return 'schedule'; 
        if (venta.pagos && venta.pagos.length > 0) {
            const metodo = venta.pagos[0].metodoPago;
            switch (metodo) {
                case 'EFECTIVO': return 'payments'; 
                case 'TARJETA': return 'credit_card'; 
                case 'TRANSFERENCIA': return 'account_balance'; 
                case 'YAPE': return 'qr_code_scanner'; 
                case 'PLIN': return 'send_to_mobile'; 
                default: return 'payment';
            }
        }
        return 'payment'; 
    }

    getNombreMetodoPago(venta: any): string {
        if (venta.tipoPago === 'CREDITO' && (!venta.pagos || venta.pagos.length === 0)) return 'Por Cobrar';
        if (venta.pagos && venta.pagos.length > 0) {
            if (venta.pagos.length > 1) return 'Pago Mixto';
            return venta.pagos[0].metodoPago;
        }
        return 'No definido';
    }

    getMetodoPagoColor(venta: any): string {
        if (venta.tipoPago === 'CREDITO' && (!venta.pagos || venta.pagos.length === 0)) return '#f59e0b'; 
        if (venta.pagos && venta.pagos.length > 0) {
            const metodo = venta.pagos[0].metodoPago;
            switch (metodo) {
                case 'EFECTIVO': return '#16a34a'; 
                case 'TARJETA': return '#2563eb'; 
                case 'TRANSFERENCIA': return '#0891b2'; 
                case 'YAPE': return '#7c3aed'; 
                case 'PLIN': return '#be185d'; 
                default: return '#64748b'; 
            }
        }
        return '#64748b';
    }

    formatearFecha(fecha: Date): string {
        return new Date(fecha).toLocaleDateString('es-PE', { 
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 3000,
            panelClass: tipo === 'success' ? 'snackbar-success' : 'snackbar-error',
            horizontalPosition: 'right', verticalPosition: 'top'
        });
    }

    exportarDatos(): void { 
        this.mostrarMensaje('Función de exportación en desarrollo', 'error'); 
    }
}