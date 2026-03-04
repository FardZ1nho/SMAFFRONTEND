import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanzasService } from '../../services/finanzas-service';
import { FinanzasDashboard, TransaccionFinanciera } from '../../models/finanzas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  
  fechaInicio: string = '';
  fechaFin: string = '';
  cargando: boolean = true;
  
  // ✅ NUEVO: Variable para controlar el filtro actual
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

  // ✅ NUEVO: Función que retorna solo los datos según el filtro seleccionado
  get transaccionesFiltradas(): TransaccionFinanciera[] {
    if (this.filtroActual === 'TODOS') return this.transacciones;
    return this.transacciones.filter(t => t.tipo === this.filtroActual);
  }

  exportarPDF() {
    const datosParaExportar = this.transaccionesFiltradas;

    if (datosParaExportar.length === 0) {
      alert("No hay datos para exportar con el filtro actual.");
      return;
    }

    const doc = new jsPDF('landscape'); 
    
    // ✅ Determinamos el título del PDF según el filtro
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

    // Usamos 'datosParaExportar' en lugar de 'this.transacciones'
    const bodyData = datosParaExportar.map(t => [
      new Date(t.fechaHora).toLocaleDateString(),
      t.tipo === 'INGRESO' ? 'ING' : 'EGR',
      `${t.tipoComprobante}\n${t.comprobante}`,
      t.ruc || 'S/D',
      t.entidad || '',
      t.descripcion?.substring(0, 45) || '', 
      t.moneda,
      Number(t.subTotal || 0).toFixed(2),
      Number(t.igv || 0).toFixed(2),
      Number(t.montoTotal || 0).toFixed(2),
      Number(t.tipoCambio || 1).toFixed(3)
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Fecha', 'Tipo', 'Comprobante', 'RUC', 'Razón Social', 'Descripción', 'Mon', 'SubTotal', 'IGV', 'Total', 'TC']],
      body: bodyData,
      theme: 'striped',
      styles: { 
        fontSize: 8,            
        cellPadding: 3,         
        textColor: [40, 40, 40], 
        lineColor: [215, 220, 225], 
        lineWidth: 0.1 
      },
      headStyles: { 
        fillColor: [30, 58, 138], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold' 
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] 
      },
      columnStyles: {
        1: { fontStyle: 'bold' }, 
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] }, 
        10: { halign: 'center' }
      }
    });

    doc.save(nombreArchivo);
  }
}