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
import { Router } from '@angular/router';

import { VentaService } from '../../../services/venta-service';
import { Venta, EstadoVenta } from '../../../models/venta';

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
    ventas: Venta[] = [];
    ventasFiltradas = new MatTableDataSource<Venta>([]);
    terminoBusqueda: string = '';
    estadoFiltro: string = 'TODAS';
    isLoading: boolean = false;
    errorMessage: string = '';

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
        { value: EstadoVenta.BORRADOR, label: 'Borradores' },
        { value: EstadoVenta.CANCELADA, label: 'Canceladas' }
    ];

    constructor(
        private ventaService: VentaService,
        private cdr: ChangeDetectorRef,
        private snackBar: MatSnackBar,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.cargarVentas();
    }

    cargarVentas(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.ventaService.listarTodas().subscribe({
            next: (data) => {
                this.ventas = data;
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

    // ⭐ PUNTO 5: Solo suma ventas COMPLETADAS
    calcularMontoTotal(): number {
        return this.ventasFiltradas.data
            .filter(v => v.estado === EstadoVenta.COMPLETADA)
            .reduce((sum, v) => sum + v.total, 0);
    }

    // ⭐ PUNTO 4: Redirigir a edición de borrador
    // En VentasListaComponent - editarBorrador():
    editarBorrador(venta: Venta): void {
        if (venta.estado !== EstadoVenta.BORRADOR) {
            this.mostrarMensaje('Solo se pueden editar borradores', 'error');
            return;
        }
        // Usa la misma ruta pero con ID
        this.router.navigate(['/ventas', venta.id]);
    }

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
    nuevaVenta(): void { this.router.navigate(['/ventas']); }

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

    getEstadoClass(estado: string): string {
        switch (estado) {
            case EstadoVenta.COMPLETADA: return 'estado-completada';
            case EstadoVenta.BORRADOR: return 'estado-borrador';
            case EstadoVenta.CANCELADA: return 'estado-cancelada';
            default: return '';
        }
    }

    getEstadoLabel(estado: string): string {
        switch (estado) {
            case EstadoVenta.COMPLETADA: return 'Completada';
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
        return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 3000,
            panelClass: tipo === 'success' ? 'snackbar-success' : 'snackbar-error',
            horizontalPosition: 'right',
            verticalPosition: 'top'
        });
    }

    verDetalle(venta: Venta): void { this.mostrarMensaje('Función en desarrollo', 'error'); }
    exportarDatos(): void { this.mostrarMensaje('Función en desarrollo', 'error'); }
}