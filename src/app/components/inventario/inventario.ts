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

import { ProductoService } from '../../services/producto-service';
import { Producto } from '../../models/producto';
import { ProductoModalComponent } from './producto-modal/producto-modal';
import { ConfirmDialogComponent } from './confirm-dialog';
import { ProductoDetalleModalComponent } from './producto-detalle-modal/producto-detalle-modal';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule
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
  
  displayedColumns: string[] = [
    'codigo',
    'nombre', 
    'categoria',
    'stock',
    'precio',
    'acciones'
  ];

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
    this.errorMessage = '';
    
    this.productoService.listarProductosActivos().subscribe({
      next: (data) => {
        this.productos = data;
        this.productosFiltrados.data = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.errorMessage = 'Error al cargar los productos';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalNuevoProducto(): void {
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '1000px',
      maxWidth: '95vw',
      disableClose: false,
      panelClass: 'producto-modal',
      data: { modo: 'crear' } // Indicamos que es creación
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarProductos();
        this.mostrarMensaje('✅ Producto creado exitosamente', 'success');
      }
    });
  }

  // ⭐⭐⭐ AQUÍ ESTABA EL PROBLEMA: AHORA SÍ ABRE EL MODAL ⭐⭐⭐
  editarProducto(producto: Producto): void {
    console.log('✏️ Editando producto:', producto);
    
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '1000px',
      maxWidth: '95vw',
      disableClose: false,
      panelClass: 'producto-modal',
      data: { 
        producto: producto, // Pasamos el objeto producto completo
        modo: 'editar' 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Si el modal retorna true (éxito), recargamos la tabla
      if (result) {
        this.cargarProductos();
        this.mostrarMensaje('✅ Producto actualizado correctamente', 'success');
      }
    });
  }

  verDetalle(producto: Producto): void {
    const dialogRef = this.dialog.open(ProductoDetalleModalComponent, {
      width: '1400px',
      maxWidth: '98vw',
      height: '85vh',
      panelClass: 'detalle-modal-panel',
      data: { productoId: producto.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Si se editó o eliminó desde el detalle, recargamos
      if (result && (result.accion === 'editado' || result.accion === 'eliminado')) {
        this.cargarProductos();
        const mensaje = result.accion === 'editado' 
          ? '✅ Producto actualizado exitosamente' 
          : '✅ Producto eliminado exitosamente';
        this.mostrarMensaje(mensaje, 'success');
      }
    });
  }

  eliminarProducto(producto: Producto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Producto',
        message: `¿Estás seguro de que deseas eliminar el producto "${producto.nombre}" (${producto.codigo})?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ejecutarEliminacion(producto);
      }
    });
  }

  private ejecutarEliminacion(producto: Producto): void {
    this.productoService.eliminarProducto(producto.id).subscribe({
      next: () => {
        this.mostrarMensaje('✅ Producto eliminado exitosamente', 'success');
        // Eliminamos localmente para que se sienta más rápido
        this.productos = this.productos.filter(p => p.id !== producto.id);
        this.productosFiltrados.data = this.productos;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        this.mostrarMensaje('❌ Error al eliminar el producto', 'error');
      }
    });
  }

  buscarProductos(): void {
    if (!this.terminoBusqueda.trim()) {
      this.productosFiltrados.data = this.productos;
      return;
    }
    const termino = this.terminoBusqueda.toLowerCase();
    this.productosFiltrados.data = this.productos.filter(p => 
      p.nombre.toLowerCase().includes(termino) ||
      (p.codigo && p.codigo.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.productosFiltrados.data = this.productos;
  }

  getStockClass(producto: Producto): string {
    switch(producto.estadoStock) {
      case 'AGOTADO': return 'stock-agotado';
      case 'BAJO': return 'stock-bajo';
      case 'NORMAL': return 'stock-normal';
      case 'ALTO': return 'stock-alto';
      default: return '';
    }
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  exportarDatos(): void { console.log('Exportar datos'); }
  abrirFiltros(): void { console.log('Abrir filtros'); }
}