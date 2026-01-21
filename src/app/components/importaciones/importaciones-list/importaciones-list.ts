import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';

import { ImportacionEditarModalComponent } from '../importacion-editar-modal/importacion-editar-modal'; 
import { ImportacionService } from '../../../services/importacion-service'; 
import { ImportacionResponse, EstadoImportacion, TipoTransporte } from '../../../models/importacion';

@Component({
  selector: 'app-importaciones-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatIconModule, MatInputModule, 
    MatSelectModule, MatTooltipModule, MatChipsModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule
  ],
  templateUrl: './importaciones-list.html',
  styleUrls: ['./importaciones-list.css']
})
export class ImportacionesListComponent implements OnInit {

  importaciones: ImportacionResponse[] = [];
  importacionesFiltradas: ImportacionResponse[] = [];
  loading: boolean = true;

  // --- CONTROL DE UI ---
  mostrarFiltros: boolean = false;

  // --- VARIABLES DE FILTROS ---
  filtroTexto: string = '';
  filtroEstado: string = 'TODOS';
  filtroTransporte: string = 'TODOS';
  
  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;

  // Enums para los selectores
  estados = Object.values(EstadoImportacion);
  transportes = Object.values(TipoTransporte);

  constructor(
    private importacionService: ImportacionService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.importacionService.listarTodas().subscribe({
      next: (data) => {
        this.importaciones = data;
        this.filtrar(); 
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando importaciones', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ LÓGICA DE FILTRADO MAESTRA
  filtrar(): void {
    let lista = this.importaciones;

    // 1. Búsqueda por Texto (Proveedor, Factura, Tracking, DUA)
    if (this.filtroTexto.trim()) {
      const texto = this.filtroTexto.toLowerCase();
      lista = lista.filter(imp => 
        (imp.compra.nombreProveedor && imp.compra.nombreProveedor.toLowerCase().includes(texto)) ||
        (imp.compra.numero && imp.compra.numero.toLowerCase().includes(texto)) ||
        (imp.trackingNumber && imp.trackingNumber.toLowerCase().includes(texto)) ||
        (imp.numeroDua && imp.numeroDua.toLowerCase().includes(texto)) // 👈 Búsqueda por DUA agregada
      );
    }

    // 2. Filtro por Estado
    if (this.filtroEstado !== 'TODOS') {
      lista = lista.filter(imp => imp.estado === this.filtroEstado);
    }

    // 3. Filtro por Tipo de Transporte
    if (this.filtroTransporte !== 'TODOS') {
      lista = lista.filter(imp => imp.tipoTransporte === this.filtroTransporte);
    }

    // 4. Filtro por Fechas (Usamos Fecha Estimada de Llegada como referencia principal)
    if (this.filtroFechaInicio) {
      lista = lista.filter(imp => imp.fechaEstimadaLlegada && new Date(imp.fechaEstimadaLlegada) >= this.filtroFechaInicio!);
    }
    if (this.filtroFechaFin) {
      const finDia = new Date(this.filtroFechaFin);
      finDia.setHours(23, 59, 59);
      lista = lista.filter(imp => imp.fechaEstimadaLlegada && new Date(imp.fechaEstimadaLlegada) <= finDia);
    }

    this.importacionesFiltradas = lista;
  }

  // --- CONTROLADORES UI ---
  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  limpiarBusqueda(): void {
    this.filtroTexto = '';
    this.filtrar();
  }

  limpiarFiltros(): void {
    this.filtroEstado = 'TODOS';
    this.filtroTransporte = 'TODOS';
    this.filtroFechaInicio = null;
    this.filtroFechaFin = null;
    this.filtroTexto = '';
    this.filtrar();
  }

  editarImportacion(id: number): void {
    const importacion = this.importaciones.find(i => i.id === id);
    if (!importacion) return;

    const dialogRef = this.dialog.open(ImportacionEditarModalComponent, {
      width: '1200px',
      maxWidth: '95vw',
      data: importacion,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.cargarDatos(); 
      }
    });
  }

  // --- HELPERS VISUALES ---

  getClassEstado(estado: string): string {
    switch (estado) {
      case 'ORDENADO': return 'badge-ordenado';
      case 'EN_TRANSITO': return 'badge-transito';
      case 'EN_ADUANAS': return 'badge-aduanas';
      case 'NACIONALIZADO': return 'badge-nacionalizado';
      case 'EN_ALMACEN': return 'badge-almacen';
      case 'CERRADO': return 'badge-cerrado';
      default: return '';
    }
  }

  getLabelEstado(estado: string): string {
    return estado.replace(/_/g, ' ');
  }

  getIconoTransporte(tipo?: string): string {
    if (tipo === 'MARITIMO') return 'directions_boat';
    if (tipo === 'AEREO') return 'flight';
    if (tipo === 'TERRESTRE') return 'local_shipping';
    return 'help_outline';
  }

  calcularCostosExtra(imp: ImportacionResponse): number {
    return (imp.costoFlete || 0) + 
           (imp.costoSeguro || 0) + 
           (imp.impuestosAduanas || 0) + 
           (imp.gastosOperativos || 0) +
           (imp.costoTransporteLocal || 0);
  }
}