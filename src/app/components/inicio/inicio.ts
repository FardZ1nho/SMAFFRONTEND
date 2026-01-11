import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard-service'; 
import { DashboardResponseDTO, MetricaCard } from '../../models/dashboard';
import { GraficoVentasSemanaComponent } from '../grafico-ventas-semana/grafico-ventas-semana';  // ✅ AGREGAR
import { ProductosMasVendidosComponent } from '../productos-mas-vendidos/productos-mas-vendidos'; // ✅ AGREGAR

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    GraficoVentasSemanaComponent ,// ✅ AGREGAR
    ProductosMasVendidosComponent
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
    console.log('🔄 Iniciando carga de métricas...');
    this.cargando = true;
    this.error = '';
    
    this.dashboardService.obtenerMetricas().subscribe({
      next: (data) => {
        console.log('✅ Métricas recibidas:', data);
        this.metricas = data;
        this.generarMetricasCards();
        console.log('✅ Cards generadas:', this.metricasCards);
        
        this.cargando = false;
        this.cdr.detectChanges();
        console.log('Estado final - cargando:', this.cargando);
      },
      error: (err) => {
        console.error('❌ Error al cargar métricas:', err);
        this.error = 'Error al cargar las métricas del dashboard';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  generarMetricasCards(): void {
    if (!this.metricas) return;

    this.metricasCards = [
      {
        titulo: 'Ventas del Mes',
        valor: this.formatearMoneda(this.metricas.ventasMes),
        porcentaje: this.metricas.porcentajeCambioVentasMes,
        icono: '💰',
        colorIcono: '#f59e0b',
        colorFondo: '#fef3c7'
      },
      {
        titulo: 'Productos en Stock',
        valor: this.metricas.productosStock.toString(),
        porcentaje: this.metricas.porcentajeCambioProductos,
        icono: '📦',
        colorIcono: '#8b5cf6',
        colorFondo: '#ede9fe'
      },
      {
        titulo: 'Clientes Activos',
        valor: this.metricas.clientesActivos.toString(),
        porcentaje: this.metricas.porcentajeCambioClientes,
        icono: '👥',
        colorIcono: '#6366f1',
        colorFondo: '#e0e7ff'
      },
      {
        titulo: 'Ventas Hoy',
        valor: this.formatearMoneda(this.metricas.ventasHoy),
        porcentaje: this.metricas.porcentajeCambioVentasHoy,
        icono: '🛒',
        colorIcono: '#10b981',
        colorFondo: '#d1fae5'
      }
    ];
  }

  formatearMoneda(valor: number): string {
    return `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

 obtenerClasePorcentaje(porcentaje: number): string {
  return porcentaje >= 0 ? 'positivo' : 'negativo';
}
  obtenerIconoPorcentaje(porcentaje: number): string {
    return porcentaje >= 0 ? '↑' : '↓';
  }

  formatearPorcentaje(porcentaje: number): string {
    return `${Math.abs(porcentaje).toFixed(1)}%`;
  }
}