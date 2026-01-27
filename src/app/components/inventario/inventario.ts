import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core'; // ✅ Agregado OnDestroy
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, Event } from '@angular/router'; // ✅ Importar NavigationEnd y Event
import { filter } from 'rxjs/operators'; // ✅ Importar filter
import { Subscription } from 'rxjs'; // ✅ Importar Subscription

// ... (MANTÉN TUS IMPORTS DE MATERIAL Y MODELOS IGUAL QUE ANTES) ...
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
export class InventarioComponent implements OnInit, OnDestroy {
  
  vistaActual: 'PRODUCTO' | 'SERVICIO' = 'PRODUCTO';
  routerSubscription: Subscription | undefined; // ✅ Para evitar fugas de memoria

  productos: Producto[] = [];
  productosFiltrados = new MatTableDataSource<Producto>([]);
  terminoBusqueda: string = '';
  isLoading: boolean = false;
  
  // Filtros
  mostrarFiltros: boolean = false;
  categoriasDisponibles: string[] = [];
  filtroCategoria: string = 'TODAS';
  filtroEstadoStock: string = 'TODOS';
  filtroPrecioMin: number | null = null;
  filtroPrecioMax: number | null = null;
  
  displayedColumns: string[] = [];

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { 
    // Configuración inicial
    this.configurarVista();
  }

  ngOnInit(): void {
    this.cargarDatos();

    // ✅ DETECCIÓN DINÁMICA DE CAMBIO DE RUTA
    // Esto hace que si pasas de "Productos" a "Servicios", la tabla se recargue
    this.routerSubscription = this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.configurarVista();
      this.cargarDatos();
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // ✅ LÓGICA EXTRAÍDA PARA REUTILIZARSE
  configurarVista(): void {
    if (this.router.url.includes('servicios')) {
      this.vistaActual = 'SERVICIO';
      this.displayedColumns = ['codigo', 'nombre', 'categoria', 'precio', 'acciones'];
    } else {
      this.vistaActual = 'PRODUCTO';
      this.displayedColumns = ['codigo', 'nombre', 'categoria', 'stock', 'precio', 'acciones'];
    }
    // Reiniciar filtros al cambiar de vista para evitar confusiones
    this.filtroCategoria = 'TODAS';
    this.filtroEstadoStock = 'TODOS';
    this.terminoBusqueda = '';
  }

  cargarDatos(): void {
    this.isLoading = true;
    this.productoService.listarProductosActivos().subscribe({
      next: (data) => {
        // Filtrado estricto
        this.productos = data.filter(p => {
          const tipoItem = p.tipo || 'PRODUCTO';
          return tipoItem === this.vistaActual;
        });
        
        const categoriasUnicas = this.productos
            .map(p => p.nombreCategoria)
            .filter((c): c is string => !!c);
            
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

  // ... (EL RESTO DE TUS MÉTODOS SIGUEN IGUAL: aplicarFiltros, abrirModal, etc.) ...
  
  aplicarFiltros(): void {
    let resultado = this.productos;

    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(p => 
        p.nombre.toLowerCase().includes(termino) ||
        (p.codigo && p.codigo.toLowerCase().includes(termino))
      );
    }

    if (this.filtroCategoria !== 'TODAS') {
      resultado = resultado.filter(p => p.nombreCategoria === this.filtroCategoria);
    }

    if (this.vistaActual === 'PRODUCTO' && this.filtroEstadoStock !== 'TODOS') {
      resultado = resultado.filter(p => {
        const stock = p.stockActual || 0;
        const min = p.stockMinimo || 0;
        
        switch (this.filtroEstadoStock) {
          case 'AGOTADO': return stock <= 0;
          case 'BAJO': return stock > 0 && stock < min;
          case 'NORMAL': return stock >= min && stock < min * 2;
          case 'ALTO': return stock >= min * 2;
          default: return true;
        }
      });
    }

    if (this.filtroPrecioMin !== null) {
      resultado = resultado.filter(p => (p.precioVenta || 0) >= (this.filtroPrecioMin as number));
    }
    if (this.filtroPrecioMax !== null) {
      resultado = resultado.filter(p => (p.precioVenta || 0) <= (this.filtroPrecioMax as number));
    }

    this.productosFiltrados.data = resultado;
  }

  toggleFiltros(): void { this.mostrarFiltros = !this.mostrarFiltros; }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  resetearFiltros(): void {
    this.filtroCategoria = 'TODAS';
    this.filtroEstadoStock = 'TODOS';
    this.filtroPrecioMin = null;
    this.filtroPrecioMax = null;
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  abrirModalNuevo(): void {
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '1000px', maxWidth: '95vw', disableClose: false, panelClass: 'producto-modal',
      data: { modo: 'crear', tipoFijo: this.vistaActual } 
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.cargarDatos(); });
  }

  abrirModalStock(producto: Producto): void {
    const dialogRef = this.dialog.open(StockModalComponent, {
      width: '450px', disableClose: false, data: { producto: producto }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.cargarDatos(); });
  }

  editarProducto(producto: Producto): void {
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '1000px', maxWidth: '95vw', disableClose: false, panelClass: 'producto-modal',
      data: { producto: producto, modo: 'editar', tipoFijo: this.vistaActual }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.cargarDatos(); });
  }

  verDetalle(producto: Producto): void {
    const dialogRef = this.dialog.open(ProductoDetalleModalComponent, {
      width: '1400px', maxWidth: '98vw', height: '85vh', panelClass: 'detalle-modal-panel',
      data: { productoId: producto.id }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.cargarDatos(); });
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
        this.mostrarMensaje('✅ Eliminado correctamente', 'success');
        this.cargarDatos();
      },
      error: () => this.mostrarMensaje('❌ Error al eliminar', 'error')
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
  
  exportarDatos(): void { console.log(`Exportando ${this.vistaActual}...`); }
}