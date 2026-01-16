import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { Router } from '@angular/router';

// Servicios
import { VentaService } from '../../../services/venta-service';
import { NotaCreditoService } from '../../../services/nota-credito-service';

// Modelos y Enums
import { Venta, EstadoVenta, TipoPago } from '../../../models/venta';

// Componentes Modales
import { VentaDetalleComponent } from '../venta-detalle/venta-detalle'; 
import { NotaCreditoModalComponent } from '../nota-credito-modal/nota-credito-modal'; 
import { AmortizarModalComponent } from '../amortizar-modal/amortizar-modal'; 

@Component({
    selector: 'app-ventas-lista',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatChipsModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatMenuModule
    ],
    templateUrl: './ventas-lista.html',
    styleUrls: ['./ventas-lista.css']
})
export class VentasListaComponent implements OnInit {
    
    // Datos de la tabla
    ventas: Venta[] = [];
    ventasFiltradas = new MatTableDataSource<Venta>([]);
    
    // Filtros
    terminoBusqueda: string = '';
    estadoFiltro: string = 'TODAS';
    
    // Estados de carga
    isLoading: boolean = false;
    errorMessage: string = '';

    // ⭐ VARIABLES FINANCIERAS
    totalVentas: number = 0;        // Suma de ventas completadas + pagos parciales
    totalNotasCredito: number = 0;  // Suma de devoluciones
    ingresoNetoReal: number = 0;    // El resultado final

    displayedColumns: string[] = [
        'codigo',
        'fechaVenta',
        'cliente',
        'metodoPago',
        'total',
        'estado',
        'acciones'
    ];

    estadosVenta = [
        { value: 'TODAS', label: 'Todas' },
        { value: EstadoVenta.COMPLETADA, label: 'Completadas' },
        { value: EstadoVenta.PENDIENTE, label: 'Pendientes (Crédito)' }, 
        { value: EstadoVenta.BORRADOR, label: 'Borradores' },
        { value: EstadoVenta.CANCELADA, label: 'Canceladas' }
    ];

    constructor(
        private ventaService: VentaService,
        private notaCreditoService: NotaCreditoService,
        private cdr: ChangeDetectorRef,
        private snackBar: MatSnackBar,
        private router: Router,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.cargarVentas();
        this.cargarTotalNotasCredito();
    }

    // ========== CARGA DE DATOS ==========

    cargarVentas(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.ventaService.listarTodas().subscribe({
            next: (data) => {
                this.ventas = data;
                this.aplicarFiltros();
                this.calcularFinanzas(); 
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

    irANotasCredito(): void {
        this.router.navigate(['/ventas/notas-credito']);
    }

    cargarTotalNotasCredito(): void {
        this.notaCreditoService.obtenerTotalDevoluciones().subscribe({
            next: (monto) => {
                this.totalNotasCredito = monto || 0;
                this.calcularFinanzas();
            },
            error: (err) => console.error('Error cargando notas de crédito', err)
        });
    }
    

    calcularFinanzas(): void {
        // 1. Sumamos las ventas COMPLETADAS al 100%
        let sumaCompletadas = this.ventas
            .filter(v => v.estado === EstadoVenta.COMPLETADA)
            .reduce((sum, v) => sum + v.total, 0);

        // 2. Sumamos los PAGOS PARCIALES de las ventas PENDIENTES
        let sumaParciales = this.ventas
            .filter(v => v.estado === EstadoVenta.PENDIENTE)
            .reduce((sum, v) => {
                // Si es crédito, sumamos la inicial + historial de pagos
                const inicial = v.montoInicial || 0;
                const abonos = v.pagos ? v.pagos.reduce((acc, p) => acc + p.monto, 0) : 0;
                return sum + inicial + abonos;
            }, 0);

        this.totalVentas = sumaCompletadas + sumaParciales;
        this.ingresoNetoReal = this.totalVentas - this.totalNotasCredito;
    }

    // ========== LÓGICA DE TABLA Y FILTROS ==========

    aplicarFiltros(): void {
        let filtradas = [...this.ventas];

        if (this.estadoFiltro !== 'TODAS') {
            filtradas = filtradas.filter(v => v.estado === this.estadoFiltro);
        }

        if (this.terminoBusqueda.trim()) {
            const termino = this.terminoBusqueda.toLowerCase();
            filtradas = filtradas.filter(v =>
                v.codigo.toLowerCase().includes(termino) ||
                (v.nombreCliente && v.nombreCliente.toLowerCase().includes(termino))
            );
        }

        this.ventasFiltradas.data = filtradas;
    }

    onEstadoChange(): void { this.aplicarFiltros(); }
    buscarVentas(): void { this.aplicarFiltros(); }
    limpiarBusqueda(): void { this.terminoBusqueda = ''; this.aplicarFiltros(); }
    
    // ========== ACCIONES DE VENTA ==========

    nuevaVenta(): void { this.router.navigate(['/ventas']); }

    editarBorrador(venta: Venta): void {
        if (venta.estado !== EstadoVenta.BORRADOR) {
            this.mostrarMensaje('Solo se pueden editar borradores', 'error');
            return;
        }
        this.router.navigate(['/ventas', venta.id]);
    }

    completarVenta(venta: Venta): void {
        if (venta.estado !== EstadoVenta.BORRADOR) return;
        if (confirm(`¿Deseas completar la venta ${venta.codigo}?`)) {
            this.ventaService.completarVenta(venta.id).subscribe({
                next: () => {
                    this.mostrarMensaje('✅ Venta completada exitosamente', 'success');
                    this.cargarVentas();
                },
                error: () => this.mostrarMensaje('Error al completar la venta', 'error')
            });
        }
    }

    // ✅ REGISTRAR PAGO DE CUOTA (AMORTIZAR) CON MODAL
    amortizarDeuda(venta: Venta): void {
        const dialogRef = this.dialog.open(AmortizarModalComponent, {
            width: '500px', // Ancho del modal
            data: { venta: venta }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // result tiene { monto, metodo, cuentaId }
                this.ventaService.registrarPago(venta.id, result.monto, result.metodo, result.cuentaId)
                    .subscribe({
                        next: () => {
                            this.mostrarMensaje('✅ Pago registrado exitosamente', 'success');
                            this.cargarVentas(); // Recargar la tabla para ver cambios de estado
                        },
                        error: () => this.mostrarMensaje('Error al registrar pago', 'error')
                    });
            }
        });
    }

    cancelarVenta(venta: Venta): void {
        if (confirm(`¿Estás seguro de cancelar la venta ${venta.codigo}?`)) {
            this.ventaService.cancelarVenta(venta.id).subscribe({
                next: () => {
                    this.mostrarMensaje('✅ Venta cancelada exitosamente', 'success');
                    this.cargarVentas();
                },
                error: () => this.mostrarMensaje('Error al cancelar la venta', 'error')
            });
        }
    }

    eliminarVenta(venta: Venta): void {
        if (confirm(`¿Estás seguro de eliminar la venta ${venta.codigo}?`)) {
            this.ventaService.eliminarVenta(venta.id).subscribe({
                next: () => {
                    this.mostrarMensaje('✅ Venta eliminada exitosamente', 'success');
                    this.ventas = this.ventas.filter(v => v.id !== venta.id);
                    this.aplicarFiltros();
                }
            });
        }
    }

    // ========== MODALES ==========

    verDetalle(venta: Venta): void {
        this.dialog.open(VentaDetalleComponent, {
            width: '800px',
            maxWidth: '95vw',
            data: venta
        });
    }

    abrirModalNotaCredito(venta: Venta): void {
        const dialogRef = this.dialog.open(NotaCreditoModalComponent, {
            width: '500px',
            disableClose: true,
            data: venta
        });

        dialogRef.afterClosed().subscribe(seEmitioNota => {
            if (seEmitioNota === true) {
                this.cargarVentas();
                this.cargarTotalNotasCredito();
            }
        });
    }

    // ========== UTILIDADES DE FORMATO ==========

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

    getMetodoPagoIcon(metodoPago: string): string {
        switch (metodoPago) {
            case 'EFECTIVO': return 'payments';
            case 'TARJETA': return 'credit_card';
            case 'TRANSFERENCIA': return 'account_balance';
            default: return 'payment';
        }
    }

    formatearFecha(fecha: Date): string {
        return new Date(fecha).toLocaleDateString('es-PE', { 
            day: '2-digit', month: '2-digit', year: 'numeric' 
        });
    }

    private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 3000,
            panelClass: tipo === 'success' ? 'snackbar-success' : 'snackbar-error',
            horizontalPosition: 'right',
            verticalPosition: 'top'
        });
    }

    exportarDatos(): void { 
        this.mostrarMensaje('Función en desarrollo', 'error'); 
    }
}