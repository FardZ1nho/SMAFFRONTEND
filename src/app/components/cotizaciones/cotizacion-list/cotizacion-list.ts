import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Importante para [(ngModel)]
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu'; // ✅ Nuevo para menú de opciones
import { RouterModule, Router, NavigationEnd } from '@angular/router'; 
import { filter } from 'rxjs/operators';

import { CotizacionService } from '../../../services/cotizacion-service'; 
import { CotizacionResponse } from '../../../models/cotizacion';

@Component({
  selector: 'app-cotizacion-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, // ✅ Para el buscador
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule, // ✅ Para el menú "..."
    RouterModule
  ],
  templateUrl: './cotizacion-list.html', 
  styleUrls: ['./cotizacion-list.css']
})
export class CotizacionListComponent implements OnInit {

  cotizaciones: CotizacionResponse[] = [];
  dataSource = new MatTableDataSource<CotizacionResponse>([]); // ✅ Usamos DataSource para filtrar localmente
  
  // Variables para filtros
  terminoBusqueda: string = '';
  filtroEstado: string = 'TODOS';

  // KPIs
  kpiTotalCotizado: number = 0;
  kpiGanadas: number = 0;
  kpiEnNegociacion: number = 0;
  kpiPerdidas: number = 0;

  displayedColumns: string[] = ['codigo', 'cliente', 'fecha', 'total', 'estado', 'acciones'];

  constructor(
    private cotizacionService: CotizacionService,
    private cdr: ChangeDetectorRef, 
    private router: Router          
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.cargarDatos();
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cotizacionService.listar().subscribe({
      next: (data) => {
        this.cotizaciones = data;
        this.aplicarFiltros(); // Esto cargará la tabla y calculará los KPIs
      },
      error: (err) => console.error('Error al cargar cotizaciones:', err)
    });
  }

  // ✅ NUEVA LÓGICA: Calcula los KPIs en tiempo real
  calcularKPIs(): void {
    this.kpiTotalCotizado = this.cotizaciones.reduce((acc, cot) => acc + (cot.total || 0), 0);
    this.kpiGanadas = this.cotizaciones.filter(c => c.estado === 'GANADA').reduce((acc, cot) => acc + (cot.total || 0), 0);
    this.kpiEnNegociacion = this.cotizaciones.filter(c => c.estado === 'EN_NEGOCIACION').reduce((acc, cot) => acc + (cot.total || 0), 0);
    this.kpiPerdidas = this.cotizaciones.filter(c => c.estado === 'PERDIDA').reduce((acc, cot) => acc + (cot.total || 0), 0);
  }

  // ✅ NUEVA LÓGICA: Filtra la tabla sin llamar al backend
  aplicarFiltros(): void {
    let filtradas = this.cotizaciones;

    // Filtro por Estado
    if (this.filtroEstado !== 'TODOS') {
      filtradas = filtradas.filter(c => c.estado === this.filtroEstado);
    }

    // Filtro de Texto (Buscador)
    if (this.terminoBusqueda && this.terminoBusqueda.trim() !== '') {
      const term = this.terminoBusqueda.toLowerCase();
      filtradas = filtradas.filter(c => 
        (c.serie && c.serie.toLowerCase().includes(term)) ||
        (c.numero && c.numero.toLowerCase().includes(term)) ||
        (c.cliente?.nombreCompleto && c.cliente.nombreCompleto.toLowerCase().includes(term)) ||
        (c.cliente?.numeroDocumento && c.cliente.numeroDocumento.toLowerCase().includes(term))
      );
    }

    this.dataSource.data = filtradas;
    this.calcularKPIs();
    this.cdr.detectChanges(); 
  }

  // Helper para pintar el estado bonito
  formatearEstado(estado: string): string {
    if (!estado) return 'Desconocido';
    return estado.replace(/_/g, ' ');
  }

  verPdf(cot: CotizacionResponse): void {
    this.cotizacionService.descargarPdf(cot.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url);
      },
      error: (err) => console.error('Error al descargar PDF', err)
    });
  }

  aprobar(cot: CotizacionResponse): void {
    if(confirm(`¿Deseas marcar la cotización ${cot.serie}-${cot.numero} como GANADA?`)) {
      this.cotizacionService.actualizarEstadoPipeline(cot.id, 'GANADA').subscribe({
        next: () => {
          alert('¡Cotización ganada exitosamente!');
          this.cargarDatos(); 
        },
        error: (err) => {
          console.error('Error al actualizar estado:', err);
          alert('Error al actualizar la cotización');
        }
      });
    }
  }

  // Placeholder para futuras acciones
  editar(cot: CotizacionResponse): void {
    this.router.navigate(['/cotizaciones/editar', cot.id]);
  }

  marcarPerdida(cot: CotizacionResponse): void {
    if(confirm(`¿Estás seguro de marcar esta cotización como PERDIDA?`)) {
       this.cotizacionService.actualizarEstadoPipeline(cot.id, 'PERDIDA').subscribe({
        next: () => { this.cargarDatos(); },
        error: () => { alert('Error al actualizar'); }
      });
    }
  }
}