import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // ✅ Agregar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DashboardService } from '../../services/dashboard-service';
import { VentasSemanaDTO } from '../../models/dashboard';

@Component({
  selector: 'app-grafico-ventas-semana',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './grafico-ventas-semana.html',
  styleUrls: ['./grafico-ventas-semana.css']
})
export class GraficoVentasSemanaComponent implements OnInit, OnDestroy {

  cargando: boolean = true;
  error: string = '';
  ventasSemana: VentasSemanaDTO[] = [];

  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y as number;
            return `S/ ${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
          drawTicks: false
        },
        border: {
          display: false
        },
        ticks: {
          padding: 8,
          color: '#6b7280',
          font: {
            size: 12
          },
          callback: (value) => {
            return 'S/ ' + value;
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          padding: 8,
          color: '#6b7280',
          font: {
            size: 12,
            weight: 500 // ✅ Usar número
          }
        }
      }
    }
  };

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef // ✅ AGREGAR
  ) { }

  ngOnInit(): void {
    // ✅ Usar setTimeout para evitar el error de detección de cambios
    setTimeout(() => {
      this.cargarVentasSemana();
    }, 0);
  }

  cargarVentasSemana(): void {
    this.cargando = true;
    this.error = '';

    this.dashboardService.obtenerVentasSemana().subscribe({
      next: (data) => {
        console.log('✅ Ventas de la semana recibidas:', data);
        this.ventasSemana = data;
        this.configurarGrafico();
        this.cargando = false;
        this.cdr.detectChanges(); // ✅ AGREGAR
      },
      error: (err) => {
        console.error('❌ Error al cargar ventas de la semana:', err);
        this.error = 'Error al cargar las ventas de la semana';
        this.cargando = false;
        this.cdr.detectChanges(); // ✅ AGREGAR
      }
    });
  }

  configurarGrafico(): void {
    const labels = this.ventasSemana.map(v => v.diaSemana);
    const data = this.ventasSemana.map(v => v.totalVentas);

    this.barChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Ventas',
          data: data,
          backgroundColor: '#60a5fa',
          hoverBackgroundColor: '#3b82f6',
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 50,
          maxBarThickness: 60
        }
      ]
    };
  }

  calcularTotalSemana(): number {
    return this.ventasSemana.reduce((sum, v) => sum + v.totalVentas, 0);
  }

  calcularPromedioDiario(): number {
    const total = this.calcularTotalSemana();
    return this.ventasSemana.length > 0 ? total / this.ventasSemana.length : 0;
  }

  calcularTotalTransacciones(): number {
    return this.ventasSemana.reduce((sum, v) => sum + v.cantidadVentas, 0);
  }

  ngOnDestroy(): void {
    // Limpieza automática
  }
}