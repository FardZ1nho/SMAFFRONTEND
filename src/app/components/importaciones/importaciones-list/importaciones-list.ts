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

export interface ImportacionGroup {
  id: string;
  items: ImportacionResponse[];
  totalFob: number;
  totalCosto: number;
  moneda: string; 
  estadoGeneral: string; 
  proveedores: string; 
  fechaEta: Date | null;
  expanded: boolean;
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

  importaciones: ImportacionResponse[] = [];
  gruposFiltrados: ImportacionGroup[] = [];
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

  filtrar(): void {
    let lista = this.importaciones;

    if (this.filtroTexto.trim()) {
      const texto = this.filtroTexto.toLowerCase();
      lista = lista.filter(imp => 
        ((imp.compra as any).codImportacion && (imp.compra as any).codImportacion.toLowerCase().includes(texto)) ||
        (imp.compra.nombreProveedor && imp.compra.nombreProveedor.toLowerCase().includes(texto)) ||
        (imp.compra.numero && imp.compra.numero.toLowerCase().includes(texto)) ||
        (imp.trackingNumber && imp.trackingNumber.toLowerCase().includes(texto)) ||
        (imp.numeroDua && imp.numeroDua.toLowerCase().includes(texto))
      );
    }

    if (this.filtroEstado !== 'TODOS') {
      lista = lista.filter(imp => imp.estado === this.filtroEstado);
    }

    if (this.filtroTransporte !== 'TODOS') {
      lista = lista.filter(imp => imp.tipoTransporte === this.filtroTransporte);
    }

    if (this.filtroFechaInicio) {
      lista = lista.filter(imp => {
        if (!imp.fechaEstimadaLlegada) return false;
        const fecha = new Date(imp.fechaEstimadaLlegada);
        return fecha >= this.filtroFechaInicio!;
      });
    }
    if (this.filtroFechaFin) {
      const finDia = new Date(this.filtroFechaFin);
      finDia.setHours(23, 59, 59);
      lista = lista.filter(imp => {
        if (!imp.fechaEstimadaLlegada) return false;
        const fecha = new Date(imp.fechaEstimadaLlegada);
        return fecha <= finDia;
      });
    }

    this.gruposFiltrados = this.agruparImportaciones(lista);
  }

  agruparImportaciones(lista: ImportacionResponse[]): ImportacionGroup[] {
    const gruposMap = new Map<string, ImportacionGroup>();

    lista.forEach(item => {
      let codigo = (item.compra as any).codImportacion;
      const key = (codigo && codigo.trim() !== '') ? codigo : 'SIN_AGRUPAR';

      if (!gruposMap.has(key)) {
        gruposMap.set(key, {
          id: key,
          items: [],
          totalFob: 0,
          totalCosto: 0,
          moneda: item.compra.moneda,
          estadoGeneral: item.estado,
          proveedores: '',
          fechaEta: item.fechaEstimadaLlegada ? new Date(item.fechaEstimadaLlegada) : null,
          expanded: false
        });
      }

      const grupo = gruposMap.get(key)!;
      grupo.items.push(item);

      grupo.totalFob += item.compra.total;
      grupo.totalCosto += (item.compra.total + this.calcularCostosExtra(item));
      
      if (item.fechaEstimadaLlegada) {
        const itemDate = new Date(item.fechaEstimadaLlegada);
        if (!grupo.fechaEta || itemDate < grupo.fechaEta) {
          grupo.fechaEta = itemDate;
        }
      }
    });

    return Array.from(gruposMap.values()).map(grupo => {
      const uniqueProveedores = [...new Set(grupo.items.map(i => i.compra.nombreProveedor))];
      grupo.proveedores = uniqueProveedores.join(', ');
      return grupo;
    });
  }

  toggleFiltros(): void { this.mostrarFiltros = !this.mostrarFiltros; }
  limpiarBusqueda(): void { this.filtroTexto = ''; this.filtrar(); }
  limpiarFiltros(): void { 
    this.filtroEstado = 'TODOS'; 
    this.filtroTransporte = 'TODOS'; 
    this.filtroFechaInicio = null; 
    this.filtroFechaFin = null; 
    this.filtroTexto = ''; 
    this.filtrar(); 
  }
  toggleGroup(group: ImportacionGroup): void { group.expanded = !group.expanded; }

  editarImportacion(id: number): void {
    const importacion = this.importaciones.find(i => i.id === id);
    if (!importacion) return;
    
    const dialogRef = this.dialog.open(ImportacionEditarModalComponent, {
      width: '1200px', maxWidth: '95vw', data: importacion, disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => { if (result === true) this.cargarDatos(); });
  }

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

  getLabelEstado(estado: string): string { return estado ? estado.replace(/_/g, ' ') : 'ND'; }

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