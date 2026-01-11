// src/app/components/movimientos/movimientos-list/movimientos-list.component.ts

import { Component, OnInit } from '@angular/core';
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

  constructor(private movimientoService: MovimientoService) { }

  ngOnInit(): void {
    // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.cargarMovimientos();
    }, 0);
  }

  cargarMovimientos(): void {
    this.cargando = true;
    this.error = '';
    
    console.log('Cargando movimientos desde:', `${this.movimientoService['baseUrl'] || 'http://localhost:8080/movimientos'}`);
    
    this.movimientoService.listarTodos().subscribe({
      next: (data) => {
        console.log('✅ Movimientos recibidos exitosamente:', data);
        this.movimientos = data || [];
        this.aplicarFiltros();
        this.actualizarEstadisticas(); // ⭐ ACTUALIZAR ESTADÍSTICAS
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar movimientos:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        
        if (err.status === 0) {
          this.error = 'No se puede conectar con el servidor. Verifica que esté corriendo en http://localhost:8080';
        } else if (err.status === 401) {
          this.error = 'No autorizado. Verifica tu sesión';
        } else if (err.status === 404) {
          this.error = 'Endpoint no encontrado. Verifica la URL del servicio';
        } else {
          this.error = `Error al cargar movimientos: ${err.error?.message || err.message || 'Error desconocido'}`;
        }
        
        this.cargando = false;
        this.movimientos = [];
        this.movimientosFiltrados = [];
        this.actualizarEstadisticas(); // ⭐ ACTUALIZAR ESTADÍSTICAS VACÍAS
      },
      complete: () => {
        console.log('🔵 Petición completada');
        // Asegurarse de que cargando sea false
        this.cargando = false;
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
    const iconos = {
      'ENTRADA': '📥',
      'SALIDA': '📤',
      'TRASLADO': '🔄',
      'AJUSTE': '⚙️'
    };
    return iconos[tipo] || '📦';
  }

  obtenerClaseTipo(tipo: TipoMovimiento): string {
    const clases = {
      'ENTRADA': 'tipo-entrada',
      'SALIDA': 'tipo-salida',
      'TRASLADO': 'tipo-traslado',
      'AJUSTE': 'tipo-ajuste'
    };
    return clases[tipo] || '';
  }

  // Estadísticas (cachear valores para evitar recalcular en cada detección de cambios)
  private _totalMovimientos: number = 0;
  private _totalEntradas: number = 0;
  private _totalSalidas: number = 0;
  private _totalTraslados: number = 0;

  get totalMovimientos(): number {
    return this._totalMovimientos;
  }

  get totalEntradas(): number {
    return this._totalEntradas;
  }

  get totalSalidas(): number {
    return this._totalSalidas;
  }

  get totalTraslados(): number {
    return this._totalTraslados;
  }

  private actualizarEstadisticas(): void {
    this._totalMovimientos = this.movimientos.length;
    this._totalEntradas = this.movimientos.filter(m => m.tipoMovimiento === TipoMovimiento.ENTRADA).length;
    this._totalSalidas = this.movimientos.filter(m => m.tipoMovimiento === TipoMovimiento.SALIDA).length;
    this._totalTraslados = this.movimientos.filter(m => m.tipoMovimiento === TipoMovimiento.TRASLADO).length;
  }
}