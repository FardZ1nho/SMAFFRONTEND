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

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    
    ventas: Venta[] = [];
    ventasFiltradas = new MatTableDataSource<Venta>([]);
    deudasFiltradas = new MatTableDataSource<Venta>([]);
    
    terminoBusqueda: string = '';
    estadoFiltro: string = 'TODAS';
    metodoPagoFiltro: string = 'TODOS';
    fechaInicio: string = ''; 
    fechaFin: string = '';
    anioActual: number = new Date().getFullYear();

    tiposComprobantesDisponibles: string[] = [];
    filtrosComprobantes: string[] = []; 
    dropdownComprobantesAbierto: boolean = false; 

    isLoading: boolean = false;
    errorMessage: string = '';

    totalesPeriodo = { emitido: 0, recaudado: 0, porCobrar: 0, cantidad: 0 };
    totalesAnuales = { emitido: 0, recaudado: 0, porCobrar: 0, cantidad: 0 };

    totalPorCobrar: number = 0;
    clientesDeudores: number = 0;

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
    }

    establecerMesActual(): void {
        const hoy = new Date();
        this.anioActual = hoy.getFullYear();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.fechaInicio = primerDia.toISOString().split('T')[0];
        this.fechaFin = hoy.toISOString().split('T')[0];
    }

    cargarVentas(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.ventaService.listarTodas().subscribe({
            next: (data) => {
                this.ventas = data.sort((a, b) => {
    const numA = this.extraerNumeroCorrelativo(a);
    const numB = this.extraerNumeroCorrelativo(b);
    return numB - numA; // descendente: el más nuevo (mayor número) primero
});
                
                this.extraerComprobantesUnicos();
                this.aplicarFiltros();     
                
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.errorMessage = 'Error al cargar las ventas';
                this.isLoading = false;
                this.mostrarMensaje('Error al cargar ventas', 'error');
                this.cdr.detectChanges();
            }
        });
    }

    private extraerNumeroCorrelativo(venta: Venta): number {
    const doc = (venta.numeroDocumento && venta.numeroDocumento !== '') 
        ? venta.numeroDocumento 
        : venta.codigo;
    
    if (!doc) return 0;
    
    // Extrae solo los dígitos finales, ej: "F001-00001050" -> "00001050" -> 1050
    const match = doc.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
}

    extraerComprobantesUnicos(): void {
        const tiposBase = ['FACTURA', 'BOLETA', 'NOTA DE VENTA', 'OTROS'];
        
        const unicosBD = this.ventas
            .map(v => v.tipoDocumento ? v.tipoDocumento.toUpperCase() : 'OTROS')
            .filter(t => !!t);
        
        const unicos = [...new Set([...tiposBase, ...unicosBD])];
        
        this.tiposComprobantesDisponibles = unicos;
        
        if (this.filtrosComprobantes.length === 0) {
            this.filtrosComprobantes = [...this.tiposComprobantesDisponibles];
        }
    }

    toggleComprobante(tipo: string): void {
        const index = this.filtrosComprobantes.indexOf(tipo);
        if (index > -1) {
            this.filtrosComprobantes.splice(index, 1);
        } else {
            this.filtrosComprobantes.push(tipo);
        }
        this.aplicarFiltros();
    }

    toggleTodosComprobantes(event: any): void {
        if (event.target.checked) {
            this.filtrosComprobantes = [...this.tiposComprobantesDisponibles]; 
        } else {
            this.filtrosComprobantes = []; 
        }
        this.aplicarFiltros();
    }

    aplicarFiltros(): void {
        this.anioActual = new Date(this.fechaInicio).getFullYear() || new Date().getFullYear();

        let baseFiltradas = this.ventas.filter(v => {
            if (this.estadoFiltro !== 'TODAS' && v.estado !== this.estadoFiltro) return false;
            
            if (this.metodoPagoFiltro !== 'TODOS') {
                if (this.metodoPagoFiltro === 'CREDITO' && v.tipoPago !== 'CREDITO') return false;
                if (this.metodoPagoFiltro !== 'CREDITO' && (!v.pagos || !v.pagos.some(p => p.metodoPago === this.metodoPagoFiltro))) return false;
            }

            const tipoDoc = v.tipoDocumento ? v.tipoDocumento.toUpperCase() : 'OTROS';
            const filtrosMayusculas = this.filtrosComprobantes.map(f => f.toUpperCase());
            
            if (filtrosMayusculas.length === 0 || !filtrosMayusculas.includes(tipoDoc)) return false;

            if (this.terminoBusqueda.trim()) {
                const term = this.terminoBusqueda.toLowerCase();
                const match = v.codigo.toLowerCase().includes(term) ||
                              (v.numeroDocumento && v.numeroDocumento.toLowerCase().includes(term)) ||
                              (v.nombreCliente && v.nombreCliente.toLowerCase().includes(term));
                if (!match) return false;
            }
            return true;
        });

        const ventasAnuales = baseFiltradas.filter(v => new Date(v.fechaVenta).getFullYear() === this.anioActual);
        this.totalesAnuales = this.calcularMétricas(ventasAnuales);

        let ventasPeriodo = baseFiltradas;
        if (this.fechaInicio && this.fechaFin) {
            const fInicio = new Date(this.fechaInicio + 'T00:00:00');
            const fFin = new Date(this.fechaFin + 'T23:59:59');
            ventasPeriodo = ventasPeriodo.filter(v => {
                const fVenta = new Date(v.fechaVenta);
                return fVenta >= fInicio && fVenta <= fFin;
            });
        }
        
        this.ventasFiltradas.data = ventasPeriodo;
        this.totalesPeriodo = this.calcularMétricas(ventasPeriodo);
        this.actualizarDeudas(this.terminoBusqueda); 

        if (this.ventasFiltradas.paginator) this.ventasFiltradas.paginator.firstPage();
    }

    calcularMétricas(lista: Venta[]) {
        let emitido = 0, porCobrar = 0, recaudado = 0;
        let cantidad = 0;

        lista.forEach(v => {
            if (v.estado !== EstadoVenta.CANCELADA && v.estado !== EstadoVenta.BORRADOR) {
                const factor = v.moneda === 'USD' ? (v.tipoCambio || 3.80) : 1;
                const totalSoles = (v.total || 0) * factor;
                const saldoSoles = (v.saldoPendiente || 0) * factor;

                emitido += totalSoles;
                porCobrar += saldoSoles;
                recaudado += (totalSoles - saldoSoles);
                cantidad++;
            }
        });

        return { emitido, recaudado, porCobrar, cantidad };
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
        
        this.totalPorCobrar = deudas.reduce((acc, v) => {
            let saldo = v.saldoPendiente || 0;
            if (v.moneda === 'USD') saldo = saldo * (v.tipoCambio || 3.80); 
            return acc + saldo;
        }, 0);
        
        const uniqueClients = new Set(deudas.map(v => v.nombreCliente));
        this.clientesDeudores = uniqueClients.size;

        if (this.deudasFiltradas.paginator) this.deudasFiltradas.paginator.firstPage();
    }

    onEstadoChange(): void { this.aplicarFiltros(); }
    buscarVentas(): void { this.aplicarFiltros(); }
    limpiarBusqueda(): void { this.terminoBusqueda = ''; this.aplicarFiltros(); }
    
    irANotasCredito(): void { this.router.navigate(['/ventas/notas-credito']); }
    nuevaVenta(): void { this.router.navigate(['/ventas/nueva']); }
    
    // ✅ CORRECCIÓN: Función habilitada para editar cualquier venta
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
            if (seEmitioNota) { this.cargarVentas(); }
        });
    }

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

    formatearFecha(fecha: Date | string): string {
        if (!fecha) return '';
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
        const datosParaExportar = this.ventasFiltradas.data;

        if (datosParaExportar.length === 0) {
            this.mostrarMensaje('No hay datos para exportar con los filtros actuales.', 'error');
            return;
        }

        const doc = new jsPDF('landscape');
        const nombreArchivo = `Reporte_Ventas_${this.fechaInicio}_al_${this.fechaFin}.pdf`;

        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text('Reporte de Ventas - SMAF', 14, 15);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Periodo: ${this.fechaInicio} al ${this.fechaFin} | Estado: ${this.estadoFiltro}`, 14, 22);

        let sumTotalPEN = 0;

        const bodyData = datosParaExportar.map(v => {
            const factorCambio = v.moneda === 'USD' ? (v.tipoCambio || 3.80) : 1;
            
            if (v.estado !== EstadoVenta.CANCELADA && v.estado !== EstadoVenta.BORRADOR) {
                sumTotalPEN += (v.total || 0) * factorCambio;
            }

            return [
                this.formatearFecha(v.fechaVenta),
                (v.numeroDocumento && v.numeroDocumento !== '') ? v.numeroDocumento : '#' + v.codigo,
                v.nombreCliente || 'Cliente General',
                this.getNombreMetodoPago(v),
                this.getEstadoLabel(v.estado),
                `${v.moneda === 'USD' ? '$' : 'S/'} ${(v.total || 0).toFixed(2)}`
            ];
        });

        const footData: any[] = [[
            { content: 'TOTAL EMITIDO VÁLIDO (Expresado en PEN S/)', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
            `S/ ${sumTotalPEN.toFixed(2)}`
        ]];

        autoTable(doc, {
            startY: 28,
            head: [['Fecha', 'Comprobante', 'Cliente', 'Método Pago', 'Estado', 'Total']],
            body: bodyData,
            foot: footData,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40], lineColor: [215, 220, 225], lineWidth: 0.1 },
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' }, 
            footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                5: { halign: 'right', fontStyle: 'bold' }
            }
        });

        doc.save(nombreArchivo);
        this.mostrarMensaje('✅ PDF Exportado exitosamente', 'success');
    }
}