import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // ✅ NUEVO
import { DashboardService } from '../../services/dashboard-service'; 
import { DashboardResponseDTO, MetricaCard } from '../../models/dashboard';

// COMPONENTES HIJOS
import { GraficoVentasSemanaComponent } from '../grafico-ventas-semana/grafico-ventas-semana';
import { ProductosMasVendidosComponent } from '../productos-mas-vendidos/productos-mas-vendidos';
import { MetodosPagoWidgetComponent } from '../dashboard/metodos-pago-widget/metodos-pago-widget';
import { LlegadasWidgetComponent } from '../llegadas-widget/llegadas-widget'; 

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // ✅ NUEVO para los botones de acción rápida
    GraficoVentasSemanaComponent,
    ProductosMasVendidosComponent,
    MetodosPagoWidgetComponent,
    LlegadasWidgetComponent
  ],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class InicioComponent implements OnInit {
  
  metricas: DashboardResponseDTO | null = null;
  metricasCards: MetricaCard[] = [];
  cargando: boolean = true;
  error: string = '';

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.cargando = true; 
    this.dashboardService.obtenerMetricas().subscribe({
      next: (data) => {
        this.metricas = data || {} as DashboardResponseDTO;
        this.generarMetricasCards();
        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error cargando dashboard:', err);
        this.error = 'No se pudieron cargar los datos del dashboard.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  generarMetricasCards(): void {
      if (!this.metricas) return;
      
      this.metricasCards = [
        {
          titulo: 'Ventas Mes',
          valor: this.formatearMoneda(this.metricas.ventasMes),
          porcentaje: this.metricas.porcentajeCambioVentasMes || 0,
          icono: 'trending_up',
          colorIcono: '#10b981', 
          colorFondo: '#dcfce7'
        },
        {
          titulo: 'Ventas Hoy',
          valor: this.formatearMoneda(this.metricas.ventasHoy),
          porcentaje: this.metricas.porcentajeCambioVentasHoy || 0,
          icono: 'point_of_sale',
          colorIcono: '#3b82f6', 
          colorFondo: '#dbeafe'
        },
        {
          titulo: 'Efectivo en Caja',
          valor: this.formatearMoneda(this.metricas.saldoCajaChica),
          porcentaje: 0, // Podrías poner variación si lo calculas luego
          icono: 'savings', 
          colorIcono: '#f59e0b', 
          colorFondo: '#fef3c7'
        },
        {
          titulo: 'Valor Inventario',
          valor: this.formatearMoneda(this.metricas.valorInventario),
          porcentaje: 0, 
          icono: 'inventory_2',
          colorIcono: '#6366f1', 
          colorFondo: '#e0e7ff'
        }
      ];
  }

  formatearMoneda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) return 'S/ 0.00';
    return valor.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });
  }

  obtenerClasePorcentaje(porcentaje: number | undefined | null): string { 
      if (porcentaje === undefined || porcentaje === null) return 'neutro';
      return porcentaje >= 0 ? 'positivo' : 'negativo'; 
  }

  formatearPorcentaje(porcentaje: number | undefined | null): string { 
      if (porcentaje === undefined || porcentaje === null) return '0.0%';
      return `${Math.abs(porcentaje).toFixed(1)}%`; 
  }

  // Funciones para botones de acción
  irANuevaVenta(): void { this.router.navigate(['/ventas/nueva']); }
  irANuevoGasto(): void { this.router.navigate(['/caja-chica']); }
  irACotizacion(): void { this.router.navigate(['/cotizaciones/nueva']); }
}