import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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

interface ImportacionUI extends ImportacionResponse {
  expanded?: boolean;
}

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

  importaciones: ImportacionUI[] = [];
  importacionesFiltradas: ImportacionUI[] = [];
  loading: boolean = true;

  mostrarFiltros: boolean = false;
  filtroTexto: string = '';
  filtroEstado: string = 'TODOS';
  filtroTransporte: string = 'TODOS';
  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;

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
        this.importaciones = data.map(i => ({ ...i, expanded: false }));
        this.filtrar(); 
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando importaciones', err);
        this.loading = false;
      }
    });
  }

  filtrar(): void {
    let lista = this.importaciones;

    if (this.filtroTexto.trim()) {
      const texto = this.filtroTexto.toLowerCase();
      lista = lista.filter(imp => 
        (imp.codigoAgrupador && imp.codigoAgrupador.toLowerCase().includes(texto)) ||
        (imp.numeroDua && imp.numeroDua.toLowerCase().includes(texto)) ||
        (imp.trackingNumber && imp.trackingNumber.toLowerCase().includes(texto)) ||
        (imp.facturasComerciales && imp.facturasComerciales.some(f => 
            f.nombreProveedor.toLowerCase().includes(texto) || 
            f.numero.toLowerCase().includes(texto)
        ))
      );
    }

    if (this.filtroEstado !== 'TODOS') lista = lista.filter(imp => imp.estado === this.filtroEstado);
    if (this.filtroTransporte !== 'TODOS') lista = lista.filter(imp => imp.tipoTransporte === this.filtroTransporte);

    if (this.filtroFechaInicio) {
      lista = lista.filter(imp => {
        if (!imp.fechaEstimadaLlegada) return false;
        return new Date(imp.fechaEstimadaLlegada) >= this.filtroFechaInicio!;
      });
    }
    if (this.filtroFechaFin) {
      const finDia = new Date(this.filtroFechaFin);
      finDia.setHours(23, 59, 59);
      lista = lista.filter(imp => {
        if (!imp.fechaEstimadaLlegada) return false;
        return new Date(imp.fechaEstimadaLlegada) <= finDia;
      });
    }

    this.importacionesFiltradas = lista;
  }

  toggleFiltros(): void { this.mostrarFiltros = !this.mostrarFiltros; }
  limpiarBusqueda(): void { this.filtroTexto = ''; this.filtrar(); }
  limpiarFiltros(): void { 
    this.filtroEstado = 'TODOS'; this.filtroTransporte = 'TODOS'; 
    this.filtroFechaInicio = null; this.filtroFechaFin = null; this.filtroTexto = ''; 
    this.filtrar(); 
  }
  
  toggleGroup(imp: ImportacionUI): void { imp.expanded = !imp.expanded; }

  editarImportacion(imp: ImportacionResponse): void {
    const dialogRef = this.dialog.open(ImportacionEditarModalComponent, {
      width: '1200px', maxWidth: '95vw', data: imp, disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => { if (result === true) this.cargarDatos(); });
  }

  // --- HELPERS VISUALES (Estos son los que te faltaban) ---

  getClassEstado(estado: string): string {
    switch (estado) {
      case 'ORDENADO': return 'badge-ordenado';
      case 'EN_TRANSITO': return 'badge-transito';
      case 'EN_ADUANAS': return 'badge-aduanas';
      case 'EN_ALMACEN': return 'badge-almacen';
      case 'CERRADA': return 'badge-cerrado';
      case 'LIQUIDADA': return 'badge-liquidada';
      default: return '';
    }
  }

  getLabelEstado(estado: string): string { return estado ? estado.replace(/_/g, ' ') : 'ND'; }

  getIconoTransporte(tipo?: string): string {
    if (tipo === 'MARITIMO') return 'directions_boat';
    if (tipo === 'AEREO') return 'flight';
    if (tipo === 'TERRESTRE') return 'local_shipping';
    return 'help_outline';
  }

  getProveedoresResumen(imp: ImportacionResponse): string {
    if (!imp.facturasComerciales || imp.facturasComerciales.length === 0) return 'Sin Facturas';
    const nombres = [...new Set(imp.facturasComerciales.map(f => f.nombreProveedor))];
    return nombres.join(', ');
  }

  getTotalCostoEstimado(imp: ImportacionResponse): number {
      const fob = imp.sumaFobTotal || 0;
      const gastos = (imp.totalFleteInternacional || 0) + 
                     (imp.totalSeguro || 0) + 
                     (imp.totalGastosAduana || 0) +
                     (imp.totalGastosAlmacen || 0) +
                     (imp.totalTransporteLocal || 0) +
                     (imp.otrosGastosGlobales || 0);
      return fob + gastos;
  }

  // ✅ ESTA ES LA FUNCIÓN CRÍTICA QUE FALTABA
  isStepComplete(estadoActual: string, paso: string): boolean {
    const orden = ['ORDENADO', 'EN_TRANSITO', 'EN_ADUANAS', 'EN_ALMACEN', 'CERRADA', 'LIQUIDADA'];
    let estadoNormalizado = estadoActual;
    if (estadoActual === 'NACIONALIZADO') estadoNormalizado = 'EN_ADUANAS'; 
    
    const idxActual = orden.indexOf(estadoNormalizado);
    const idxPaso = orden.indexOf(paso);

    if (idxActual === -1) return false;
    return idxActual >= idxPaso;
  }
}