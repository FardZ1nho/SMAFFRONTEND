import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select'; 
import { MatOptionModule } from '@angular/material/core';

import { ProductoService } from '../../services/producto-service';
import { Producto } from '../../models/producto';
import { ProductoModalComponent } from './producto-modal/producto-modal';
import { ConfirmDialogComponent } from './confirm-dialog';
import { ProductoDetalleModalComponent } from './producto-detalle-modal/producto-detalle-modal';
import { StockModalComponent } from './stock-modal/stock-modal'; 

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatTooltipModule, MatProgressSpinnerModule,
    MatDialogModule, MatSnackBarModule, MatDividerModule, MatMenuModule,
    MatSelectModule, MatOptionModule
  ],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css'
})
export class InventarioComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados = new MatTableDataSource<Producto>([]);
  terminoBusqueda: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // VARIABLES PARA FILTROS
  mostrarFiltros: boolean = false;
  categoriasDisponibles: string[] = [];
  
  // Estado de los filtros
  filtroCategoria: string = 'TODAS';
  filtroTipo: string = 'TODOS';
  filtroEstadoStock: string = 'TODOS';
  filtroPrecioMin: number | null = null;
  filtroPrecioMax: number | null = null;
  
  displayedColumns: string[] = ['codigo', 'nombre', 'categoria', 'stock', 'precio', 'acciones'];

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.isLoading = true;
    this.productoService.listarProductosActivos().subscribe({
      next: (data) => {
        this.productos = data;
        
        // ✅ CORRECCIÓN 1: Filtrado estricto para categorías (evita error TS2322)
        const categoriasUnicas = data
            .map(p => p.nombreCategoria)
            .filter((c): c is string => !!c); // "Type Guard" que elimina undefined
            
        this.categoriasDisponibles = [...new Set(categoriasUnicas)];
        
        this.aplicarFiltros(); 
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = this.productos;

    // 1. Filtro de Texto
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(p => 
        p.nombre.toLowerCase().includes(termino) ||
        (p.codigo && p.codigo.toLowerCase().includes(termino))
      );
    }

    // 2. Filtro por Categoría
    if (this.filtroCategoria !== 'TODAS') {
      resultado = resultado.filter(p => p.nombreCategoria === this.filtroCategoria);
    }

    // 3. Filtro por Tipo
    if (this.filtroTipo !== 'TODOS') {
      resultado = resultado.filter(p => (p.tipo || 'PRODUCTO') === this.filtroTipo);
    }

    // 4. Filtro por Estado de Stock
    if (this.filtroEstadoStock !== 'TODOS') {
      resultado = resultado.filter(p => {
        if (p.tipo === 'SERVICIO') return false; 
        
        const stock = p.stockActual || 0; // Protección contra undefined
        const min = p.stockMinimo || 0;   // Protección contra undefined
        
        switch (this.filtroEstadoStock) {
          case 'AGOTADO': return stock <= 0;
          case 'BAJO': return stock > 0 && stock < min;
          case 'NORMAL': return stock >= min && stock < min * 2;
          case 'ALTO': return stock >= min * 2;
          default: return true;
        }
      });
    }

    // 5. Filtro por Precio
    // ✅ CORRECCIÓN 2: Protección con (p.precioVenta || 0) para evitar error TS18048
    if (this.filtroPrecioMin !== null) {
      resultado = resultado.filter(p => (p.precioVenta || 0) >= (this.filtroPrecioMin as number));
    }
    if (this.filtroPrecioMax !== null) {
      resultado = resultado.filter(p => (p.precioVenta || 0) <= (this.filtroPrecioMax as number));
    }

    this.productosFiltrados.data = resultado;
  }

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  resetearFiltros(): void {
    this.filtroCategoria = 'TODAS';
    this.filtroTipo = 'TODOS';
    this.filtroEstadoStock = 'TODOS';
    this.filtroPrecioMin = null;
    this.filtroPrecioMax = null;
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  abrirModalNuevoProducto(): void {
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '1000px', maxWidth: '95vw', disableClose: false, panelClass: 'producto-modal',
      data: { modo: 'crear' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.cargarProductos(); });
  }

  abrirModalStock(producto: Producto): void {
    const dialogRef = this.dialog.open(StockModalComponent, {
      width: '450px', disableClose: false, data: { producto: producto }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.cargarProductos(); });
  }

  editarProducto(producto: Producto): void {
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '1000px', maxWidth: '95vw', disableClose: false, panelClass: 'producto-modal',
      data: { producto: producto, modo: 'editar' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.cargarProductos(); });
  }

  verDetalle(producto: Producto): void {
    const dialogRef = this.dialog.open(ProductoDetalleModalComponent, {
      width: '1400px', maxWidth: '98vw', height: '85vh', panelClass: 'detalle-modal-panel',
      data: { productoId: producto.id }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.cargarProductos(); });
  }

  eliminarProducto(producto: Producto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Eliminar', message: `¿Eliminar ${producto.nombre}?`, confirmText: 'Eliminar', cancelText: 'Cancelar', confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.ejecutarEliminacion(producto); });
  }

  private ejecutarEliminacion(producto: Producto): void {
    this.productoService.eliminarProducto(producto.id).subscribe({
      next: () => {
        this.mostrarMensaje('✅ Eliminado', 'success');
        this.productos = this.productos.filter(p => p.id !== producto.id);
        this.aplicarFiltros(); 
      },
      error: () => this.mostrarMensaje('❌ Error', 'error')
    });
  }

  getStockClass(producto: Producto): string {
    const stock = producto.stockActual || 0;
    const min = producto.stockMinimo || 0;

    if (stock <= 0) return 'stock-agotado';
    if (stock < min) return 'stock-bajo';
    if (stock < min * 2) return 'stock-normal';
    return 'stock-alto';
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 3000, panelClass: tipo === 'success' ? 'snackbar-success' : 'snackbar-error', horizontalPosition: 'right', verticalPosition: 'top' });
  }
  
  exportarDatos(): void { console.log('Exportar datos'); }
}