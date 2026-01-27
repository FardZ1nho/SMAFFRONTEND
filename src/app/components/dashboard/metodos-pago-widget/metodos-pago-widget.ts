import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ChartComponent, ApexNonAxisChartSeries, ApexResponsive, ApexChart, ApexDataLabels, ApexLegend, ApexPlotOptions } from "ng-apexcharts";
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { DashboardService } from '../../../services/dashboard-service';
import { ReporteMetodoPagoDTO } from '../../../models/dashboard'; 

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  colors: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-metodos-pago-widget',
  standalone: true,
  imports: [
    CommonModule, 
    NgApexchartsModule, 
    MatMenuModule, 
    MatButtonModule, 
    MatIconModule
  ],
  templateUrl: './metodos-pago-widget.html',
  styleUrls: ['./metodos-pago-widget.css']
})
export class MetodosPagoWidgetComponent implements OnInit {
  @ViewChild("chart") chart: ChartComponent | undefined;
  
  public chartOptions: Partial<ChartOptions>;
  public reporteData: ReporteMetodoPagoDTO[] = [];
  public isLoading: boolean = true;
  
  // ✅ Esta es la variable correcta que usa el HTML
  public totalVentasPeriodo: number = 0; 

  public filtroActual: string = 'Hoy';

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {
    this.chartOptions = {
      series: [],
      chart: {
        type: "donut",
        height: 240,
        fontFamily: "'Inter', sans-serif",
        background: 'transparent'
      },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'],
      labels: [],
      dataLabels: { enabled: false },
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px', fontFamily: 'Inter', color: '#64748b', offsetY: -5 },
              value: { 
                show: true, 
                fontSize: '18px', 
                fontWeight: 700, 
                color: '#1e293b',
                offsetY: 5,
                // ✅ CORREGIDO: String(val) asegura que sea texto antes de parsear
                formatter: (val) => `S/ ${parseFloat(String(val)).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              },
              total: {
                show: true,
                label: 'Total',
                color: '#64748b',
                fontSize: '12px',
                formatter: (w) => {
                  const total = w.globals.seriesTotals.reduce((a: any, b: any) => a + b, 0);
                  return `S/ ${total.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                }
              }
            }
          }
        }
      },
      responsive: [{ breakpoint: 480, options: { chart: { width: 280 } } }]
    };
  }

  ngOnInit(): void {
    this.cambiarFiltro('MES');
  }

  cambiarFiltro(periodo: 'HOY' | 'SEMANA' | 'MES' | 'ANIO') {
    this.isLoading = true;
    this.cdr.detectChanges();

    const hoy = new Date();
    let fechaInicio = new Date();
    const fechaFin = hoy;

    switch (periodo) {
      case 'HOY':
        this.filtroActual = 'Hoy';
        fechaInicio = hoy;
        break;
      case 'SEMANA':
        this.filtroActual = 'Esta Semana';
        const diaSemana = hoy.getDay() || 7; 
        fechaInicio.setDate(hoy.getDate() - diaSemana + 1);
        break;
      case 'MES':
        this.filtroActual = 'Este Mes';
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'ANIO':
        this.filtroActual = 'Este Año';
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        break;
    }

    const inicioStr = this.formatearFechaISO(fechaInicio);
    const finStr = this.formatearFechaISO(fechaFin);

    this.cargarDatos(inicioStr, finStr);
  }

  cargarDatos(inicio?: string, fin?: string) {
    this.dashboardService.obtenerReporteMetodosPago(inicio, fin).subscribe({
      next: (data) => {
        this.reporteData = data;
        
        const series = data.map(item => item.total);
        const labels = data.map(item => this.formatearNombre(item.metodo));
        
        // ✅ Calculamos el total y lo asignamos a la variable correcta
        this.totalVentasPeriodo = data.reduce((sum, item) => sum + item.total, 0);

        this.chartOptions.series = series;
        this.chartOptions.labels = labels;
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error("Error cargando reporte de pagos", e);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatearFechaISO(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  formatearNombre(texto: string): string {
    if(!texto) return '';
    return texto.charAt(0) + texto.slice(1).toLowerCase().replace(/_/g, ' ');
  }

  getColor(index: number): string {
    const colors = this.chartOptions.colors || [];
    return colors[index % colors.length];
  }
}