import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.cargando = true; // Asegurar estado de carga
    this.dashboardService.obtenerMetricas().subscribe({
      next: (data) => {
        // ✅ PROTECCIÓN CRÍTICA: Si data es null, asignamos un objeto vacío para evitar crashes
        this.metricas = data || {} as DashboardResponseDTO;
        
        this.generarMetricasCards();
        this.cargando = false;
        this.cdr.detectChanges(); // Forzar actualización de vista
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
      
      // ✅ USO DE '|| 0' EN TODO: Si algo viene null, se pone 0.
      this.metricasCards = [
        {
          titulo: 'Ventas Hoy',
          valor: this.formatearMoneda(this.metricas.ventasHoy),
          porcentaje: this.metricas.porcentajeCambioVentasHoy || 0,
          icono: 'trending_up',
          colorIcono: '#10b981', // Verde
          colorFondo: '#d1fae5'
        },
        {
          titulo: 'Ventas Mes',
          valor: this.formatearMoneda(this.metricas.ventasMes),
          porcentaje: this.metricas.porcentajeCambioVentasMes || 0,
          icono: 'calendar_today',
          colorIcono: '#3b82f6', // Azul
          colorFondo: '#dbeafe'
        },
        {
          titulo: 'Clientes Activos',
          // Usamos String() o || 0 para evitar errores si viene null
          valor: (this.metricas.clientesActivos || 0).toString(), 
          porcentaje: this.metricas.porcentajeCambioClientes || 0,
          icono: 'users', // Asegúrate de que 'users' o 'group' exista en tu librería de iconos (MatIcon usa 'group')
          colorIcono: '#f59e0b', // Naranja
          colorFondo: '#fef3c7'
        },
        {
          titulo: 'Productos Stock',
          valor: (this.metricas.productosStock || 0).toString(),
          porcentaje: this.metricas.porcentajeCambioProductos || 0,
          icono: 'inventory_2', // 'package' no existe en Material Icons, usa 'inventory_2' o 'local_shipping'
          colorIcono: '#6366f1', // Indigo
          colorFondo: '#e0e7ff'
        }
      ];
  }

  // ✅ FUNCIÓN BLINDADA PARA MONEDA
  formatearMoneda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return 'S/ 0.00';
    }
    return valor.toLocaleString('es-PE', { 
      style: 'currency', 
      currency: 'PEN',
      minimumFractionDigits: 2 
    });
  }

  // ✅ FUNCIÓN BLINDADA PARA CLASES CSS
  obtenerClasePorcentaje(porcentaje: number | undefined | null): string { 
      if (porcentaje === undefined || porcentaje === null) return 'neutro';
      return porcentaje >= 0 ? 'positivo' : 'negativo'; 
  }

  // ✅ FUNCIÓN BLINDADA PARA TEXTO PORCENTAJE
  formatearPorcentaje(porcentaje: number | undefined | null): string { 
      if (porcentaje === undefined || porcentaje === null) return '0.0%';
      return `${Math.abs(porcentaje).toFixed(1)}%`; 
  }
}