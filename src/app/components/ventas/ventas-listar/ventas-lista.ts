// src/app/components/ventas-lista/ventas-lista.component.ts

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
                console.log('✅ Ventas cargadas:', data);
                this.ventas = data;
                this.aplicarFiltros();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('❌ Error al cargar ventas:', error);
                this.errorMessage = 'Error al cargar las ventas';
                this.isLoading = false;
                this.mostrarMensaje('Error al cargar ventas', 'error');
                this.cdr.detectChanges();
            }
        });
    }

    calcularMontoTotal(): number {
        return this.ventasFiltradas.data.reduce((sum, v) => sum + v.total, 0);
    }

    aplicarFiltros(): void {
        let ventasFiltradas = [...this.ventas];

        // Filtrar por estado
        if (this.estadoFiltro !== 'TODAS') {
            ventasFiltradas = ventasFiltradas.filter(v => v.estado === this.estadoFiltro);
        }

        // Filtrar por búsqueda
        if (this.terminoBusqueda.trim()) {
            const termino = this.terminoBusqueda.toLowerCase();
            ventasFiltradas = ventasFiltradas.filter(venta =>
                venta.codigo.toLowerCase().includes(termino) ||
                (venta.nombreCliente && venta.nombreCliente.toLowerCase().includes(termino))
            );
        }

        this.ventasFiltradas.data = ventasFiltradas;
    }

    onEstadoChange(): void {
        this.aplicarFiltros();
    }

    buscarVentas(): void {
        this.aplicarFiltros();
    }

    limpiarBusqueda(): void {
        this.terminoBusqueda = '';
        this.aplicarFiltros();
    }

    nuevaVenta(): void {
        this.router.navigate(['/ventas']);
    }

    verDetalle(venta: Venta): void {
        console.log('Ver detalle:', venta);
        // TODO: Implementar modal o navegación a detalle
        this.mostrarMensaje('Función en desarrollo', 'error');
    }

    completarVenta(venta: Venta): void {
        if (venta.estado !== EstadoVenta.BORRADOR) {
            this.mostrarMensaje('Solo se pueden completar borradores', 'error');
            return;
        }

        if (confirm(`¿Deseas completar la venta ${venta.codigo}?`)) {
            this.ventaService.completarVenta(venta.id).subscribe({
                next: (ventaActualizada) => {
                    this.mostrarMensaje('✅ Venta completada exitosamente', 'success');
                    this.cargarVentas();
                },
                error: (error) => {
                    console.error('❌ Error al completar venta:', error);
                    this.mostrarMensaje('Error al completar la venta', 'error');
                }
            });
        }
    }

    cancelarVenta(venta: Venta): void {
        if (venta.estado === EstadoVenta.CANCELADA) {
            this.mostrarMensaje('Esta venta ya está cancelada', 'error');
            return;
        }

        if (confirm(`¿Estás seguro de cancelar la venta ${venta.codigo}?`)) {
            this.ventaService.cancelarVenta(venta.id).subscribe({
                next: () => {
                    this.mostrarMensaje('✅ Venta cancelada exitosamente', 'success');
                    this.cargarVentas();
                },
                error: (error) => {
                    console.error('❌ Error al cancelar venta:', error);
                    this.mostrarMensaje('Error al cancelar la venta', 'error');
                }
            });
        }
    }

    eliminarVenta(venta: Venta): void {
        if (confirm(`¿Estás seguro de eliminar la venta ${venta.codigo}? Esta acción no se puede deshacer.`)) {
            this.ventaService.eliminarVenta(venta.id).subscribe({
                next: () => {
                    this.mostrarMensaje('✅ Venta eliminada exitosamente', 'success');
                    this.ventas = this.ventas.filter(v => v.id !== venta.id);
                    this.aplicarFiltros();
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('❌ Error al eliminar venta:', error);
                    this.mostrarMensaje('Error al eliminar la venta', 'error');
                }
            });
        }
    }

    getEstadoClass(estado: string): string {
        switch (estado) {
            case EstadoVenta.COMPLETADA:
                return 'estado-completada';
            case EstadoVenta.BORRADOR:
                return 'estado-borrador';
            case EstadoVenta.CANCELADA:
                return 'estado-cancelada';
            default:
                return '';
        }
    }

    getEstadoLabel(estado: string): string {
        switch (estado) {
            case EstadoVenta.COMPLETADA:
                return 'Completada';
            case EstadoVenta.BORRADOR:
                return 'Borrador';
            case EstadoVenta.CANCELADA:
                return 'Cancelada';
            default:
                return estado;
        }
    }

    getMetodoPagoIcon(metodoPago: string): string {
        switch (metodoPago) {
            case 'EFECTIVO':
                return 'payments';
            case 'TARJETA':
                return 'credit_card';
            case 'TRANSFERENCIA':
                return 'account_balance';
            case 'YAPE':
            case 'PLIN':
                return 'phone_android';
            default:
                return 'payment';
        }
    }

    formatearFecha(fecha: Date): string {
        return new Date(fecha).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
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
        console.log('Exportar datos');
        this.mostrarMensaje('Función en desarrollo', 'error');
    }
}