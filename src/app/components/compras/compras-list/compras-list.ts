import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Material Modules
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CompraService } from '../../../services/compra-service'; 
import { CompraResponse } from '../../../models/compra';

@Component({
  selector: 'app-compras-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatTableModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './compras-list.html',
  styleUrls: ['./compras-list.css']
})
export class ComprasListComponent implements OnInit {

  compras: CompraResponse[] = [];
  comprasFiltradas: CompraResponse[] = [];
  
  // Estado de carga
  cargando: boolean = false;

  // --- FILTROS ---
  mostrarFiltros: boolean = false;
  terminoBusqueda: string = '';
  
  // Variables para los selectores
  proveedoresUnicos: string[] = [];
  tiposComprobante: string[] = ['FACTURA_ELECTRONICA', 'FACTURA_COMERCIAL', 'BOLETA', 'GUIA_REMISION', 'RECIBO_HONORARIOS'];

  // Valores de los filtros
  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;
  filtroProveedor: string = 'TODOS';
  filtroTipo: string = 'TODOS';

  constructor(
    private compraService: CompraService,
    private router: Router,
    private cd: ChangeDetectorRef 
  ) { }

  ngOnInit(): void {
    this.cargarCompras();
  }

  cargarCompras(): void {
    this.cargando = true;
    this.compraService.listarTodas().subscribe({
      next: (data) => {
        console.log('Datos recibidos:', data);
        this.compras = data;
        
        // Extraer proveedores únicos para el filtro
        this.proveedoresUnicos = [...new Set(data.map(c => c.nombreProveedor).filter(p => !!p))].sort();

        this.filtrar(); // Aplicar filtros iniciales
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar compras', err);
        this.cargando = false;
      }
    });
  }

  // --- LÓGICA DE FILTRADO MAESTRA ---
  filtrar(): void {
    let resultado = [...this.compras];

    // 1. Búsqueda por Texto (Numero, Serie, RUC)
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(c => 
        (c.numero && c.numero.toLowerCase().includes(termino)) || 
        (c.serie && c.serie.toLowerCase().includes(termino)) ||
        (c.rucProveedor && c.rucProveedor.includes(termino))
      );
    }

    // 2. Filtro por Proveedor
    if (this.filtroProveedor !== 'TODOS') {
      resultado = resultado.filter(c => c.nombreProveedor === this.filtroProveedor);
    }

    // 3. Filtro por Tipo de Comprobante
    if (this.filtroTipo !== 'TODOS') {
      resultado = resultado.filter(c => c.tipoComprobante === this.filtroTipo);
    }

    // 4. Filtro por Rango de Fechas
    if (this.filtroFechaInicio) {
      resultado = resultado.filter(c => new Date(c.fechaEmision) >= this.filtroFechaInicio!);
    }
    if (this.filtroFechaFin) {
      // Ajustamos al final del día para incluir la fecha seleccionada completa
      const finDia = new Date(this.filtroFechaFin);
      finDia.setHours(23, 59, 59);
      resultado = resultado.filter(c => new Date(c.fechaEmision) <= finDia);
    }

    this.comprasFiltradas = resultado;
  }

  // --- CONTROLADORES UI ---

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroProveedor = 'TODOS';
    this.filtroTipo = 'TODOS';
    this.filtroFechaInicio = null;
    this.filtroFechaFin = null;
    this.filtrar();
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.filtrar();
  }

  // --- ACCIONES DE NAVEGACIÓN ---

  irANuevaCompra(): void {
    this.router.navigate(['/compras/nueva']);
  }

  verDetalle(id: number): void {
    this.router.navigate(['/compras/detalle', id]);
  }

  editarCompra(id: number): void {
    console.log('Editar compra', id);
  }

  eliminarCompra(id: number): void {
    if(confirm('¿Está seguro de anular esta compra? Esta acción revertirá el stock.')) {
        console.log('Anulando compra ID:', id);
    }
  }

  // Helper visual para tipos de comprobante
  formatearTipo(tipo: string): string {
    return tipo.replace(/_/g, ' ');
  }
}