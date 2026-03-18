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
  
  transaccionesAnuales: TransaccionFinanciera[] = []; 
  anioActual: number = new Date().getFullYear();

  transaccionesMostradas: TransaccionFinanciera[] = [];
  terminoBusqueda: string = '';
  chartInstance: any;

  fechaInicio: string = '';
  fechaFin: string = '';
  cargando: boolean = true;
  
  filtroActual: 'TODOS' | 'INGRESO' | 'EGRESO' = 'TODOS';
  
  tiposComprobantesDisponibles: string[] = [];
  filtrosComprobantes: string[] = []; 
  dropdownComprobantesAbierto: boolean = false; 

  totalesDinamicos = { ingresos: 0, egresos: 0, neto: 0, igvVentas: 0, igvCompras: 0, balanceIgv: 0, detracciones: 0, retenciones: 0, percepciones: 0 };
  
  totalesAnuales = { ingresos: 0, egresos: 0, neto: 0, igvVentas: 0, igvCompras: 0, balanceIgv: 0, detracciones: 0, retenciones: 0, percepciones: 0 };

  constructor(
    private finanzasService: FinanzasService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.anioActual = hoy.getFullYear();
    this.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    this.fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    
    this.cargarDatosAnuales(); 
    this.cargarDatos();        
  }

  // ✅ UNIFICACIÓN DE COMPROBANTES
  normalizarComprobante(tipo: string): string {
    if (!tipo) return 'OTROS';
    const t = tipo.toUpperCase().trim();
    
    if (t === 'FACTURA_ELECTRONICA' || t === 'FACTURA') return 'FACTURA';
    if (t === 'NOTA_VENTA' || t === 'NOTA') return 'NOTA DE VENTA';
    if (t === 'BOLETA_ELECTRONICA' || t === 'BOLETA') return 'BOLETA';
    
    return t.replace(/_/g, ' '); 
  }

  cargarDatosAnuales(): void {
    const inicioAño = `${this.anioActual}-01-01`;
    const finAño = `${this.anioActual}-12-31`;
    
    this.finanzasService.obtenerDashboard(inicioAño, finAño).subscribe({
      next: (data) => {
        const transaccionesCrudas = data.transacciones || [];
        this.transaccionesAnuales = transaccionesCrudas.map(t => ({
          ...t,
          tipoComprobante: this.normalizarComprobante(t.tipoComprobante)
        }));
        this.calcularTotalesAnuales(this.transaccionesAnuales);
        this.extraerComprobantesUnicos();
      }
    });
  }

  cargarDatos(): void {
    this.cargando = true;
    const nuevoAnio = new Date(this.fechaInicio).getFullYear();
    if (nuevoAnio !== this.anioActual) {
      this.anioActual = nuevoAnio;
      this.cargarDatosAnuales();
    }

    this.finanzasService.obtenerDashboard(this.fechaInicio, this.fechaFin).subscribe({
      next: (data) => {
        this.dashboardData = data;
        const transaccionesCrudas = data.transacciones || [];
        this.transacciones = transaccionesCrudas.map(t => ({
          ...t,
          tipoComprobante: this.normalizarComprobante(t.tipoComprobante)
        }));

        this.extraerComprobantesUnicos();
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

  extraerComprobantesUnicos(): void {
    const todosLosComprobantes = [...this.transacciones, ...this.transaccionesAnuales]
      .map(t => t.tipoComprobante)
      .filter(t => !!t);
      
    const unicos = [...new Set(todosLosComprobantes)];
    if (this.tiposComprobantesDisponibles.length !== unicos.length) {
      this.tiposComprobantesDisponibles = unicos.sort(); 
      this.filtrosComprobantes = [...this.tiposComprobantesDisponibles];
    }
  }

  toggleComprobante(tipo: string): void {
    const index = this.filtrosComprobantes.indexOf(tipo);
    if (index > -1) {
      this.filtrosComprobantes.splice(index, 1);
    } else {
      this.filtrosComprobantes.push(tipo);
    }
    this.aplicarFiltros();
  }

  toggleTodosComprobantes(event: any): void {
    if (event.target.checked) {
      this.filtrosComprobantes = [...this.tiposComprobantesDisponibles]; 
    } else {
      this.filtrosComprobantes = []; 
    }
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtradas = this.transacciones;

    if (this.filtroActual !== 'TODOS') {
      filtradas = filtradas.filter(t => t.tipo === this.filtroActual);
    }
    if (this.filtrosComprobantes.length === 0) {
      filtradas = []; 
    } else {
      filtradas = filtradas.filter(t => this.filtrosComprobantes.includes(t.tipoComprobante));
    }
    if (this.terminoBusqueda.trim()) {
      const term = this.terminoBusqueda.toLowerCase();
      filtradas = filtradas.filter(t => 
        (t.entidad && t.entidad.toLowerCase().includes(term)) ||
        (t.ruc && t.ruc.toLowerCase().includes(term)) ||
        (t.comprobante && t.comprobante.toLowerCase().includes(term))
      );
    }

    this.transaccionesMostradas = filtradas;
    this.calcularTotalesDinamicos(filtradas);
    setTimeout(() => this.generarGrafico(), 50);
  }

  // ✅ CÁLCULOS: Solo suman si NO están anuladas/canceladas
  calcularTotalesDinamicos(filtradas: TransaccionFinanciera[]): void {
    let ing = 0, egr = 0, igvV = 0, igvC = 0, det = 0, ret = 0, per = 0;

    filtradas.forEach(t => {
      const esValida = t.estado !== 'ANULADA' && t.estado !== 'CANCELADA';
      if (esValida) {
        const factorCambio = t.moneda === 'USD' ? (t.tipoCambio || 3.80) : 1;
        const totalVal = Number(t.montoTotal || 0) * factorCambio;
        const igvVal = Number(t.igv || 0) * factorCambio;
        const detVal = Number(t.detraccion || 0) * factorCambio;
        const retVal = Number(t.retencion || 0) * factorCambio;
        const perVal = Number(t.percepcion || 0) * factorCambio;

        if (t.tipo === 'INGRESO') { ing += totalVal; igvV += igvVal; } 
        else { egr += totalVal; igvC += igvVal; }

        det += detVal; ret += retVal; per += perVal;
      }
    });

    this.totalesDinamicos = {
      ingresos: ing, egresos: egr, neto: ing - egr,
      igvVentas: igvV, igvCompras: igvC, balanceIgv: igvV - igvC,
      detracciones: det, retenciones: ret, percepciones: per
    };
  }

  calcularTotalesAnuales(transacciones: TransaccionFinanciera[]): void {
    let ing = 0, egr = 0, igvV = 0, igvC = 0, det = 0, ret = 0, per = 0;

    transacciones.forEach(t => {
      const esValida = t.estado !== 'ANULADA' && t.estado !== 'CANCELADA';
      if (esValida) {
        const factorCambio = t.moneda === 'USD' ? (t.tipoCambio || 3.80) : 1;
        const totalVal = Number(t.montoTotal || 0) * factorCambio;
        const igvVal = Number(t.igv || 0) * factorCambio;
        const detVal = Number(t.detraccion || 0) * factorCambio;
        const retVal = Number(t.retencion || 0) * factorCambio;
        const perVal = Number(t.percepcion || 0) * factorCambio;

        if (t.tipo === 'INGRESO') { ing += totalVal; igvV += igvVal; } 
        else { egr += totalVal; igvC += igvVal; }

        det += detVal; ret += retVal; per += perVal;
      }
    });

    this.totalesAnuales = {
      ingresos: ing, egresos: egr, neto: ing - egr,
      igvVentas: igvV, igvCompras: igvC, balanceIgv: igvV - igvC,
      detracciones: det, retenciones: ret, percepciones: per
    };
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
      const esValida = t.estado !== 'ANULADA' && t.estado !== 'CANCELADA';
      if (esValida) {
        const fecha = new Date(t.fechaHora).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
        if (!resumenPorFecha.has(fecha)) {
          resumenPorFecha.set(fecha, { ingresos: 0, egresos: 0 });
        }
        const actual = resumenPorFecha.get(fecha)!;
        if (t.tipo === 'INGRESO') actual.ingresos += Number(t.montoTotal);
        else actual.egresos += Number(t.montoTotal);
      }
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
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }

  exportarExcel(): void {
    if (this.transaccionesMostradas.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const dataParaExcel = this.transaccionesMostradas.map(t => {
      const esAnulada = t.estado === 'ANULADA' || t.estado === 'CANCELADA';
      return {
        'Fecha': new Date(t.fechaHora).toLocaleDateString('es-PE'),
        'Tipo Flujo': t.tipo === 'INGRESO' ? 'INGRESO' : 'EGRESO',
        'Documento': t.tipoComprobante,
        'Número': t.comprobante,
        'RUC / DNI': t.ruc || 'S/D',
        'Razón Social': t.entidad || 'S/D',
        'Estado': esAnulada ? 'ANULADA' : 'VÁLIDA',
        'Moneda': t.moneda,
        'SubTotal': Number(t.subTotal || 0),
        'IGV': Number(t.igv || 0),
        'Detracción': Number(t.detraccion || 0),
        'Retención': Number(t.retencion || 0),
        'Percepción': Number(t.percepcion || 0),
        'Monto Total': Number(t.montoTotal || 0),
        'Tipo Cambio': Number(t.tipoCambio || 1)
      };
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Finanzas');
    XLSX.writeFile(workbook, `Reporte_Contable_${this.fechaInicio}.xlsx`);
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

    // ✅ REPORTE SUNAT: Etiqueta y control de filas en PDF
    const bodyData = datosParaExportar.map(t => {
      const esAnulada = t.estado === 'ANULADA' || t.estado === 'CANCELADA';
      const textoComprobante = esAnulada ? `${t.tipoComprobante}\n${t.comprobante}\n(ANULADA)` : `${t.tipoComprobante}\n${t.comprobante}`;

      return [
        new Date(t.fechaHora).toLocaleDateString(),
        t.tipo === 'INGRESO' ? 'ING' : 'EGR',
        textoComprobante,
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
      ];
    });

    let sumSubTotal = 0, sumIgv = 0, sumDet = 0, sumRet = 0, sumPer = 0, sumTotal = 0;

    datosParaExportar.forEach(t => {
      const esValida = t.estado !== 'ANULADA' && t.estado !== 'CANCELADA';
      if (esValida) {
        const factorCambio = t.moneda === 'USD' ? (t.tipoCambio || 3.80) : 1;
        sumSubTotal += Number(t.subTotal || 0) * factorCambio;
        sumIgv += Number(t.igv || 0) * factorCambio;
        sumDet += Number(t.detraccion || 0) * factorCambio;
        sumRet += Number(t.retencion || 0) * factorCambio;
        sumPer += Number(t.percepcion || 0) * factorCambio;
        sumTotal += Number(t.montoTotal || 0) * factorCambio;
      }
    });

    const footData: any[] = [[
      { content: 'TOTALES (Expresado en PEN S/)', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: sumSubTotal.toFixed(2), styles: { halign: 'right' } },
      { content: sumIgv.toFixed(2), styles: { halign: 'right' } },
      { content: sumDet.toFixed(2), styles: { halign: 'right' } },
      { content: sumRet.toFixed(2), styles: { halign: 'right' } },
      { content: sumPer.toFixed(2), styles: { halign: 'right' } },
      { content: sumTotal.toFixed(2), styles: { halign: 'right' } },
      '' 
    ]];

    autoTable(doc, {
      startY: 28,
      head: [['Fecha', 'Flujo', 'Comprobante', 'RUC', 'Razón Social', 'Mon', 'SubTotal', 'IGV', 'Detrac.', 'Reten.', 'Percep.', 'Total', 'TC']],
      body: bodyData,
      foot: footData, 
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 2, textColor: [40, 40, 40], lineColor: [215, 220, 225], lineWidth: 0.1 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' }, 
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        1: { fontStyle: 'bold' }, 
        6: { halign: 'right' }, 7: { halign: 'right' }, 
        8: { halign: 'right', textColor: [153, 27, 27] }, 9: { halign: 'right', textColor: [153, 27, 27] }, 10: { halign: 'right', textColor: [22, 101, 52] }, 
        11: { halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] }, 12: { halign: 'center' } 
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
           if (data.cell.text.some(t => t.includes('(ANULADA)'))) {
               data.cell.styles.textColor = [220, 38, 38]; // Pinta texto en rojo en el PDF
           }
        }
      }
    });

    doc.save(nombreArchivo);
  }
}