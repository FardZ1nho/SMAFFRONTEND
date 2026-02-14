import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MovimientoService } from '../../../services/movimiento-service'; 
import { Movimiento, TipoMovimiento } from '../../../models/movimiento';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // ✅ Importar Dialog

import { AjusteModalComponent } from '../ajuste-modal/ajuste-modal'; 

@Component({
  selector: 'app-movimientos-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, 
    MatIconModule, MatProgressSpinnerModule, MatDialogModule // ✅ Agregar MatDialogModule
  ],
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
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog // ✅ Inyectar Dialog
  ) { }

  ngOnInit(): void {
    this.cargarMovimientos(); 
  }

  cargarMovimientos(): void {
    this.cargando = true;
    this.error = '';
    
    this.movimientoService.listarTodos().subscribe({
      next: (data) => {
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
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ MÉTODO PARA ABRIR MODAL DE AJUSTE
  abrirModalAjuste(): void {
    const dialogRef = this.dialog.open(AjusteModalComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'custom-dialog-container' // Opcional para CSS global
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si se guardó correctamente, recargamos la lista
        this.cargarMovimientos();
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.movimientos];

    if (this.filtroTexto) {
      const textoLower = this.filtroTexto.toLowerCase();
      resultado = resultado.filter(m => 
        m.codigo.toLowerCase().includes(textoLower) ||
        m.productoNombre.toLowerCase().includes(textoLower) ||
        m.productoCodigo.toLowerCase().includes(textoLower) ||
        (m.motivo && m.motivo.toLowerCase().includes(textoLower))
      );
    }

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

  obtenerClaseTipo(tipo: TipoMovimiento): string {
    const clases: Record<string, string> = {
      'TRASLADO': 'tipo-traslado',
      'AJUSTE': 'tipo-ajuste',
      'ENTRADA': 'tipo-entrada',
      'SALIDA': 'tipo-salida'
    };
    return clases[tipo] || '';
  }

  // Estadísticas
  _totalMovimientos = 0;
  _totalTraslados = 0;
  _totalAjustes = 0;

  get totalMovimientos(): number { return this._totalMovimientos; }
  get totalTraslados(): number { return this._totalTraslados; }
  get totalAjustes(): number { return this._totalAjustes; }

  private actualizarEstadisticas(): void {
    this._totalMovimientos = this.movimientos.length;
    this._totalTraslados = this.movimientos.filter(m => m.tipoMovimiento === TipoMovimiento.TRASLADO).length;
    this._totalAjustes = this.movimientos.filter(m => m.tipoMovimiento === TipoMovimiento.AJUSTE).length;
  }
}