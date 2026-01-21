import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarMovimientos(); 
  }

  cargarMovimientos(): void {
    this.cargando = true;
    this.error = '';
    
    console.log('Cargando movimientos...');
    
    this.movimientoService.listarTodos().subscribe({
      next: (data) => {
        console.log('✅ Movimientos recibidos:', data);
        // Opcional: Si quieres que la tabla NUNCA muestre entradas/salidas aunque vengan del backend:
        // this.movimientos = data.filter(m => m.tipoMovimiento !== TipoMovimiento.ENTRADA && m.tipoMovimiento !== TipoMovimiento.SALIDA);
        this.movimientos = data || [];
        
        this.aplicarFiltros();
        this.actualizarEstadisticas();
        
        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.error = `Error al cargar movimientos: ${err.message}`;
        
        this.cargando = false;
        this.movimientos = [];
        this.movimientosFiltrados = [];
        this.actualizarEstadisticas();
        this.cdr.detectChanges();
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
    const iconos: Record<string, string> = {
      'TRASLADO': '🔄',
      'AJUSTE': '⚙️'
    };
    return iconos[tipo] || '📦';
  }

  obtenerClaseTipo(tipo: TipoMovimiento): string {
    const clases: Record<string, string> = {
      'TRASLADO': 'tipo-traslado',
      'AJUSTE': 'tipo-ajuste'
    };
    return clases[tipo] || '';
  }

  // Estadísticas
  private _totalMovimientos: number = 0;
  private _totalTraslados: number = 0;
  private _totalAjustes: number = 0;

  get totalMovimientos(): number { return this._totalMovimientos; }
  get totalTraslados(): number { return this._totalTraslados; }
  get totalAjustes(): number { return this._totalAjustes; }

  private actualizarEstadisticas(): void {
    // Calculamos totales basados en la data cargada (o filtrada si prefieres)
    this._totalMovimientos = this.movimientos.length;
    this._totalTraslados = this.movimientos.filter(m => m.tipoMovimiento === TipoMovimiento.TRASLADO).length;
    this._totalAjustes = this.movimientos.filter(m => m.tipoMovimiento === TipoMovimiento.AJUSTE).length;
  }
}