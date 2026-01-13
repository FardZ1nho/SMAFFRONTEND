// src/app/components/movimientos/movimientos-list/movimientos-list.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Import ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MovimientoService } from '../../../services/movimiento-service'; 
import { Movimiento, TipoMovimiento } from '../../../models/movimiento';
import { MatIcon } from '@angular/material/icon';
import { MatSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-movimientos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIcon, MatSpinner],
  templateUrl: './movimientos-list.html',
  styleUrls: ['./movimientos-list.css']
})
export class MovimientosListComponent implements OnInit {

  movimientos: Movimiento[] = [];
  movimientosFiltrados: Movimiento[] = [];
  cargando: boolean = true;
  error: string = '';
  
  // Filtros
  filtroTexto: string = '';
  filtroTipo: TipoMovimiento | 'TODOS' = 'TODOS';
  
  // Enum para el template
  TipoMovimiento = TipoMovimiento;

  constructor(
    private movimientoService: MovimientoService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Remove setTimeout if possible, or keep it short. 
    // Direct call is usually fine unless there are specific rendering conflicts.
    this.cargarMovimientos(); 
  }

  cargarMovimientos(): void {
    this.cargando = true;
    this.error = '';
    
    console.log('Cargando movimientos...');
    
    this.movimientoService.listarTodos().subscribe({
      next: (data) => {
        console.log('✅ Movimientos recibidos:', data);
        this.movimientos = data || [];
        
        // Ensure filters are applied immediately
        this.aplicarFiltros();
        this.actualizarEstadisticas();
        
        this.cargando = false;
        
        // Force view update to ensure loading spinner disappears and data shows
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('❌ Error:', err);
        // ... error handling ...
        this.error = `Error al cargar movimientos: ${err.message}`;
        
        this.cargando = false;
        this.movimientos = [];
        this.movimientosFiltrados = [];
        this.actualizarEstadisticas();
        this.cdr.detectChanges(); // Force view update on error too
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.movimientos];

    // Filtro por texto
    if (this.filtroTexto) {
      const textoLower = this.filtroTexto.toLowerCase();
      resultado = resultado.filter(m => 
        m.codigo.toLowerCase().includes(textoLower) ||
        m.productoNombre.toLowerCase().includes(textoLower) ||
        m.productoCodigo.toLowerCase().includes(textoLower) ||
        (m.motivo && m.motivo.toLowerCase().includes(textoLower))
      );
    }

    // Filtro por tipo
    if (this.filtroTipo !== 'TODOS') {
      resultado = resultado.filter(m => m.tipoMovimiento === this.filtroTipo);
    }

    this.movimientosFiltrados = resultado;
    // No need for cdr.detectChanges() here usually as this is triggered by user events
    // but safe to add if UI lags
  }

  onFiltroTextoChange(texto: string): void {
    this.filtroTexto = texto;
    this.aplicarFiltros();
  }

  onFiltroTipoChange(tipo: TipoMovimiento | 'TODOS'): void {
    this.filtroTipo = tipo;
    this.aplicarFiltros();
  }

  obtenerIconoTipo(tipo: TipoMovimiento): string {
    const iconos: Record<string, string> = { // Typed for safety
      'ENTRADA': '📥',
      'SALIDA': '📤',
      'TRASLADO': '🔄',
      'AJUSTE': '⚙️'
    };
    return iconos[tipo] || '📦';
  }

  obtenerClaseTipo(tipo: TipoMovimiento): string {
    const clases: Record<string, string> = { // Typed for safety
      'ENTRADA': 'tipo-entrada',
      'SALIDA': 'tipo-salida',
      'TRASLADO': 'tipo-traslado',
      'AJUSTE': 'tipo-ajuste'
    };
    return clases[tipo] || '';
  }

  // Estadísticas
  private _totalMovimientos: number = 0;
  private _totalEntradas: number = 0;
  private _totalSalidas: number = 0;
  private _totalTraslados: number = 0;

  get totalMovimientos(): number { return this._totalMovimientos; }
  get totalEntradas(): number { return this._totalEntradas; }
  get totalSalidas(): number { return this._totalSalidas; }
  get totalTraslados(): number { return this._totalTraslados; }

  private actualizarEstadisticas(): void {
    this._totalMovimientos = this.movimientos.length;
    this._totalEntradas = this.movimientos.filter(m => m.tipoMovimiento === TipoMovimiento.ENTRADA).length;
    this._totalSalidas = this.movimientos.filter(m => m.tipoMovimiento === TipoMovimiento.SALIDA).length;
    this._totalTraslados = this.movimientos.filter(m => m.tipoMovimiento === TipoMovimiento.TRASLADO).length;
  }
}