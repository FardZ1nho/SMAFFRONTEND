import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard-service'; 
import { DashboardResponseDTO, MetricaCard } from '../../models/dashboard';
import { GraficoVentasSemanaComponent } from '../grafico-ventas-semana/grafico-ventas-semana';
import { ProductosMasVendidosComponent } from '../productos-mas-vendidos/productos-mas-vendidos';
import { MetodosPagoWidgetComponent } from '../dashboard/metodos-pago-widget/metodos-pago-widget';
// ✅ 1. IMPORTAR EL WIDGET DE LLEGADAS
import { LlegadasWidgetComponent } from '../llegadas-widget/llegadas-widget'; 

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    GraficoVentasSemanaComponent,
    ProductosMasVendidosComponent,
    MetodosPagoWidgetComponent,
    LlegadasWidgetComponent // ✅ 2. AGREGAR AL ARRAY DE IMPORTS
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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.dashboardService.obtenerMetricas().subscribe({
      next: (data) => {
        this.metricas = data;
        this.generarMetricasCards();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar métricas';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  generarMetricasCards(): void {
     if (!this.metricas) return;
     
     // Mapeo de datos a tarjetas
     this.metricasCards = [
       {
         titulo: 'Ventas Hoy',
         valor: this.formatearMoneda(this.metricas.ventasHoy),
         porcentaje: this.metricas.porcentajeCambioVentasHoy,
         icono: 'trending_up',
         colorIcono: '#10b981', // Verde
         colorFondo: '#d1fae5'
       },
       {
         titulo: 'Ventas Mes',
         valor: this.formatearMoneda(this.metricas.ventasMes),
         porcentaje: this.metricas.porcentajeCambioVentasMes,
         icono: 'calendar_today',
         colorIcono: '#3b82f6', // Azul
         colorFondo: '#dbeafe'
       },
       {
         titulo: 'Clientes Activos',
         valor: this.metricas.clientesActivos,
         porcentaje: this.metricas.porcentajeCambioClientes,
         icono: 'users',
         colorIcono: '#f59e0b', // Naranja
         colorFondo: '#fef3c7'
       },
       {
         titulo: 'Productos Stock',
         valor: this.metricas.productosStock,
         porcentaje: this.metricas.porcentajeCambioProductos,
         icono: 'package',
         colorIcono: '#6366f1', // Indigo
         colorFondo: '#e0e7ff'
       }
     ];
  }

  formatearMoneda(valor: number): string {
    return `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  obtenerClasePorcentaje(porcentaje: number): string { return porcentaje >= 0 ? 'positivo' : 'negativo'; }
  formatearPorcentaje(porcentaje: number): string { return `${Math.abs(porcentaje).toFixed(1)}%`; }
}