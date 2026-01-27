import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexXAxis,
  ApexTooltip,
  ApexGrid,
  ApexFill
} from "ng-apexcharts";
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard-service';
import { GraficoVentasDTO } from '../../models/dashboard';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  fill: ApexFill;
  colors: string[];
};

@Component({
  selector: 'app-grafico-ventas-semana',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './grafico-ventas-semana.html',
  styleUrls: ['./grafico-ventas-semana.css']
})
export class GraficoVentasSemanaComponent implements OnInit {
  @ViewChild("chart") chart: ChartComponent | undefined;

  public chartOptions: Partial<ChartOptions>;
  public cargando: boolean = true;
  public error: string = '';

  // Datos para el resumen
  public totalPeriodo: number = 0;
  public promedioDiario: number = 0;
  public transacciones: number = 0;

  // Filtros
  public filtroActual: string = 'Esta Semana';
  public codigoFiltro: string = 'SEMANA'; // Variable interna para la API

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {
    // Configuración "Soft UI" del gráfico
    this.chartOptions = {
      series: [],
      chart: {
        type: "bar",
        height: 350,
        fontFamily: "'Inter', sans-serif",
        toolbar: { show: false },
        animations: { enabled: true }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '50%', // ✅ IMPORTANTE: Esto evita que una sola barra ocupe todo el ancho
          borderRadius: 6,
          borderRadiusApplication: 'end',
          distributed: false // Asegúrate que esté en false para mantener el color uniforme
        }
      },
      dataLabels: { enabled: false },
      colors: ['#6366f1'],
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.25,
          gradientToColors: ["#818cf8"],
          inverseColors: true,
          opacityFrom: 0.85,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      xaxis: {
        categories: [],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: '#94a3b8', fontSize: '12px' }
        }
      },
      yaxis: {
        labels: {
          style: { colors: '#94a3b8', fontSize: '12px' },
          formatter: (value) => `S/ ${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } }
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: function (val) {
            return "S/ " + val.toLocaleString('es-PE', { minimumFractionDigits: 2 });
          }
        }
      }
    };
  }

  ngOnInit(): void {
    this.cambiarFiltro('SEMANA');
  }

  cambiarFiltro(periodo: 'SEMANA' | 'MES' | 'ANIO') {
    this.codigoFiltro = periodo;

    // Actualizar texto visual del botón
    if (periodo === 'SEMANA') this.filtroActual = 'Esta Semana';
    if (periodo === 'MES') this.filtroActual = 'Este Mes';
    if (periodo === 'ANIO') this.filtroActual = 'Este Año';

    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges(); // Prevenir error NG0100

    // ✅ Llamada al nuevo endpoint con el filtro
    this.dashboardService.obtenerVentasGrafico(this.codigoFiltro).subscribe({
      next: (data: GraficoVentasDTO[]) => {

        // 1. Mapear datos (El DTO ahora tiene 'label' y 'total')
        const categories = data.map(v => v.label);
        const values = data.map(v => v.total);

        // 2. Calcular Totales para el Footer
        this.totalPeriodo = data.reduce((acc, curr) => acc + curr.total, 0);
        this.transacciones = data.reduce((acc, curr) => acc + curr.cantidad, 0);
        this.promedioDiario = data.length > 0 ? this.totalPeriodo / data.length : 0;

        // 3. Actualizar Gráfico
        this.chartOptions.series = [{
          name: "Ventas",
          data: values
        }];

        this.chartOptions.xaxis = {
          ...this.chartOptions.xaxis,
          categories: categories // Asignar nuevas etiquetas (Días o Meses)
        };

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudieron cargar los datos del gráfico.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}