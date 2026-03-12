import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanzasService } from '../../services/finanzas-service';
import { FinanzasDashboard, TransaccionFinanciera } from '../../models/finanzas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import * as XLSX from 'xlsx';
import { Chart, registerables } from 'chart.js';

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
  
  transaccionesMostradas: TransaccionFinanciera[] = [];
  terminoBusqueda: string = '';
  chartInstance: any;

  fechaInicio: string = '';
  fechaFin: string = '';
  cargando: boolean = true;
  
  filtroActual: 'TODOS' | 'INGRESO' | 'EGRESO' = 'TODOS';
  
  // ✅ NUEVAS VARIABLES: Filtro Múltiple de Comprobantes
  tiposComprobantesDisponibles: string[] = [];
  filtrosComprobantes: string[] = []; 
  dropdownComprobantesAbierto: boolean = false; // Controla si la lista está visible

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
        
        // 1. Extraemos los comprobantes únicos que existen en esta data
        this.tiposComprobantesDisponibles = [...new Set(this.transacciones
          .map(t => t.tipoComprobante)
          .filter(t => !!t))];

        // 2. Por defecto, seleccionamos todos para que la tabla empiece llena
        this.filtrosComprobantes = [...this.tiposComprobantesDisponibles];

        this.aplicarFiltros(); 
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

  // ✅ LOGICA DE SELECCIÓN MÚLTIPLE
  toggleComprobante(tipo: string): void {
    const index = this.filtrosComprobantes.indexOf(tipo);
    if (index > -1) {
      this.filtrosComprobantes.splice(index, 1); // Lo quita
    } else {
      this.filtrosComprobantes.push(tipo); // Lo agrega
    }
    this.aplicarFiltros();
  }

  toggleTodosComprobantes(event: any): void {
    if (event.target.checked) {
      this.filtrosComprobantes = [...this.tiposComprobantesDisponibles]; // Selecciona todos
    } else {
      this.filtrosComprobantes = []; // Deselecciona todos
    }
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtradas = this.transacciones;

    // 1. Filtro por Tipo de Flujo (Ingreso/Egreso)
    if (this.filtroActual !== 'TODOS') {
      filtradas = filtradas.filter(t => t.tipo === this.filtroActual);
    }

    // 2. Filtro por Tipo de Comprobante (Múltiple)
    if (this.filtrosComprobantes.length === 0) {
      filtradas = []; // Si no hay nada marcado, la tabla queda vacía
    } else {
      filtradas = filtradas.filter(t => this.filtrosComprobantes.includes(t.tipoComprobante));
    }

    // 3. Filtro por Buscador de texto
    if (this.terminoBusqueda.trim()) {
      const term = this.terminoBusqueda.toLowerCase();
      filtradas = filtradas.filter(t => 
        (t.entidad && t.entidad.toLowerCase().includes(term)) ||
        (t.ruc && t.ruc.toLowerCase().includes(term)) ||
        (t.comprobante && t.comprobante.toLowerCase().includes(term))
      );
    }

    this.transaccionesMostradas = filtradas;
    
    // Generar el gráfico con la data ya filtrada
    setTimeout(() => this.generarGrafico(), 50);
  }

  generarGrafico(): void {
    const canvas = document.getElementById('finanzasChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy(); 
    }

    const resumenPorFecha = new Map<string, { ingresos: number, egresos: number }>();
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

  exportarExcel(): void {
    if (this.transaccionesMostradas.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const dataParaExcel = this.transaccionesMostradas.map(t => ({
      'Fecha': new Date(t.fechaHora).toLocaleDateString('es-PE'),
      'Tipo Flujo': t.tipo === 'INGRESO' ? 'INGRESO' : 'EGRESO',
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
      head: [['Fecha', 'Flujo', 'Comprobante', 'RUC', 'Razón Social', 'Mon', 'SubTotal', 'IGV', 'Detrac.', 'Reten.', 'Percep.', 'Total', 'TC']],
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