import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanzasService } from '../../services/finanzas-service';
import { FinanzasDashboard, TransaccionFinanciera } from '../../models/finanzas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ✅ NUEVAS LIBRERÍAS (Excel y Gráficos)
import * as XLSX from 'xlsx';
import { Chart, registerables } from 'chart.js';

// Registrar componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finanzas.html',
  styleUrls: ['./finanzas.css']
})
export class FinanzasComponent implements OnInit {
  
  dashboardData: FinanzasDashboard | null = null;
  transacciones: TransaccionFinanciera[] = [];
  
  // ✅ NUEVO: Variables para buscador y tabla
  transaccionesMostradas: TransaccionFinanciera[] = [];
  terminoBusqueda: string = '';
  chartInstance: any;

  fechaInicio: string = '';
  fechaFin: string = '';
  cargando: boolean = true;
  
  filtroActual: 'TODOS' | 'INGRESO' | 'EGRESO' = 'TODOS';

  constructor(
    private finanzasService: FinanzasService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    this.fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.finanzasService.obtenerDashboard(this.fechaInicio, this.fechaFin).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.transacciones = data.transacciones || [];
        this.aplicarFiltros(); // ✅ Aplica filtros apenas llega la data
        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error cargando finanzas', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ NUEVA LÓGICA: Ahora es una función para poder disparar el gráfico cuando cambie
  aplicarFiltros(): void {
    let filtradas = this.transacciones;

    // 1. Filtro por Tipo (Dropdown)
    if (this.filtroActual !== 'TODOS') {
      filtradas = filtradas.filter(t => t.tipo === this.filtroActual);
    }

    // 2. Filtro por Buscador (Input de texto)
    if (this.terminoBusqueda.trim()) {
      const term = this.terminoBusqueda.toLowerCase();
      filtradas = filtradas.filter(t => 
        (t.entidad && t.entidad.toLowerCase().includes(term)) ||
        (t.ruc && t.ruc.toLowerCase().includes(term)) ||
        (t.comprobante && t.comprobante.toLowerCase().includes(term))
      );
    }

    this.transaccionesMostradas = filtradas;
    
    // Generar el gráfico después de que Angular pinte el HTML
    setTimeout(() => this.generarGrafico(), 50);
  }

  // ✅ NUEVO: Función para generar el Gráfico de Barras
  generarGrafico(): void {
    const canvas = document.getElementById('finanzasChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy(); // Destruye el anterior si existe
    }

    // Agrupar los montos por fecha para el gráfico
    const resumenPorFecha = new Map<string, { ingresos: number, egresos: number }>();
    
    // Invertimos para que las fechas más antiguas salgan primero en el gráfico
    const dataOrdenada = [...this.transaccionesMostradas].reverse();

    dataOrdenada.forEach(t => {
      const fecha = new Date(t.fechaHora).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      if (!resumenPorFecha.has(fecha)) {
        resumenPorFecha.set(fecha, { ingresos: 0, egresos: 0 });
      }
      const actual = resumenPorFecha.get(fecha)!;
      if (t.tipo === 'INGRESO') actual.ingresos += Number(t.montoTotal);
      else actual.egresos += Number(t.montoTotal);
    });

    const labels = Array.from(resumenPorFecha.keys());
    const dataIngresos = labels.map(l => resumenPorFecha.get(l)!.ingresos);
    const dataEgresos = labels.map(l => resumenPorFecha.get(l)!.egresos);

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Ingresos (S/ o $)', data: dataIngresos, backgroundColor: '#10b981', borderRadius: 4 },
          { label: 'Egresos (S/ o $)', data: dataEgresos, backgroundColor: '#ef4444', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // ✅ NUEVO: Función de Exportar a Excel
  exportarExcel(): void {
    if (this.transaccionesMostradas.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    // Mapeamos los datos a columnas de Excel
    const dataParaExcel = this.transaccionesMostradas.map(t => ({
      'Fecha': new Date(t.fechaHora).toLocaleDateString('es-PE'),
      'Tipo': t.tipo === 'INGRESO' ? 'INGRESO' : 'EGRESO',
      'Documento': t.tipoComprobante,
      'Número': t.comprobante,
      'RUC / DNI': t.ruc || 'S/D',
      'Razón Social': t.entidad || 'S/D',
      'Moneda': t.moneda,
      'SubTotal': Number(t.subTotal || 0),
      'IGV': Number(t.igv || 0),
      'Detracción': Number(t.detraccion || 0),
      'Retención': Number(t.retencion || 0),
      'Percepción': Number(t.percepcion || 0),
      'Monto Total': Number(t.montoTotal || 0),
      'Tipo Cambio': Number(t.tipoCambio || 1)
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Finanzas');

    const nombreArchivo = `Reporte_Contable_${this.fechaInicio}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
  }

  exportarPDF() {
    const datosParaExportar = this.transaccionesMostradas;

    if (datosParaExportar.length === 0) {
      alert("No hay datos para exportar con el filtro actual.");
      return;
    }

    const doc = new jsPDF('landscape'); 
    
    let tituloPDF = 'Reporte Contable General - SMAF';
    let nombreArchivo = `Reporte_General_${this.fechaInicio}.pdf`;

    if (this.filtroActual === 'INGRESO') {
      tituloPDF = 'Reporte de Ingresos (Ventas) - SMAF';
      nombreArchivo = `Reporte_Ingresos_${this.fechaInicio}.pdf`;
    } else if (this.filtroActual === 'EGRESO') {
      tituloPDF = 'Reporte de Egresos (Compras) - SMAF';
      nombreArchivo = `Reporte_Egresos_${this.fechaInicio}.pdf`;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); 
    doc.text(tituloPDF, 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); 
    doc.text(`Periodo: ${this.fechaInicio} al ${this.fechaFin}`, 14, 22);

    const bodyData = datosParaExportar.map(t => [
      new Date(t.fechaHora).toLocaleDateString(),
      t.tipo === 'INGRESO' ? 'ING' : 'EGR',
      `${t.tipoComprobante}\n${t.comprobante}`,
      t.ruc || 'S/D',
      t.entidad || '',
      t.moneda,
      Number(t.subTotal || 0).toFixed(2),
      Number(t.igv || 0).toFixed(2),
      Number(t.detraccion || 0).toFixed(2), 
      Number(t.retencion || 0).toFixed(2),  
      Number(t.percepcion || 0).toFixed(2), 
      Number(t.montoTotal || 0).toFixed(2),
      Number(t.tipoCambio || 1).toFixed(3)
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Fecha', 'Tipo', 'Comprobante', 'RUC', 'Razón Social', 'Mon', 'SubTotal', 'IGV', 'Detrac.', 'Reten.', 'Percep.', 'Total', 'TC']],
      body: bodyData,
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 2, textColor: [40, 40, 40], lineColor: [215, 220, 225], lineWidth: 0.1 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        1: { fontStyle: 'bold' }, 
        6: { halign: 'right' }, 7: { halign: 'right' }, 
        8: { halign: 'right', textColor: [153, 27, 27] }, 9: { halign: 'right', textColor: [153, 27, 27] }, 10: { halign: 'right', textColor: [22, 101, 52] }, 
        11: { halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] }, 12: { halign: 'center' } 
      }
    });

    doc.save(nombreArchivo);
  }
}