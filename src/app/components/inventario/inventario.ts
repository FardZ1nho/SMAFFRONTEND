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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // ⭐ AGREGADO

import { ProductoService } from '../../services/producto-service';
import { Producto } from '../../models/producto';
import { ProductoModalComponent } from './producto-modal/producto-modal';
import { ConfirmDialogComponent } from './confirm-dialog';  // ⭐ AGREGADO
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
    MatSnackBarModule // ⭐ AGREGADO
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
    'ubicacion',
    'acciones'
  ];

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar // ⭐ AGREGADO
  ) {
    console.log('🏗️ Constructor del componente ejecutado');
  }

  ngOnInit(): void {
    console.log('🟢 ngOnInit ejecutado - Componente inventario INICIADO');
    this.cargarProductos();
  }

  cargarProductos(): void {
    console.log('📡 [INICIO] Llamando a cargarProductos()...');
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.productoService.listarProductosActivos().subscribe({
      next: (data) => {
        console.log('✅ [SUCCESS] Respuesta recibida del backend');
        console.log('✅ [DATA]:', data);
        console.log('✅ [CANTIDAD]:', data.length, 'productos');
        
        this.productos = data;
        this.productosFiltrados.data = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        
        console.log('🔍 isLoading después:', this.isLoading);
        console.log('🔍 Datos en tabla:', this.productosFiltrados.data);
      },
      error: (error) => {
        console.error('❌ [ERROR] Error al cargar productos');
        console.error('❌ [ERROR COMPLETO]:', error);
        this.errorMessage = 'Error al cargar los productos';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        console.log('🏁 [COMPLETE] Observable completado');
      }
    });
  }

  abrirModalNuevoProducto(): void {
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '1000px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '95vh',
      disableClose: false,
      autoFocus: true,
      panelClass: 'producto-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Producto creado:', result);
        this.cargarProductos();
        this.mostrarMensaje('✅ Producto creado exitosamente', 'success');
      }
    });
  }

  buscarProductos(): void {
    if (!this.terminoBusqueda.trim()) {
      this.productosFiltrados.data = this.productos;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase();
    this.productosFiltrados.data = this.productos.filter(producto => 
      producto.nombre.toLowerCase().includes(termino) ||
      (producto.codigo && producto.codigo.toLowerCase().includes(termino))
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

verDetalle(producto: Producto): void {
  const dialogRef = this.dialog.open(ProductoDetalleModalComponent, {
    width: '1400px',           // ⭐ Más ancho
    maxWidth: '98vw',          // ⭐ Casi toda la pantalla
    height: '85vh',            // ⭐ Altura fija
    maxHeight: '95vh',
    panelClass: 'detalle-modal-panel',  // ⭐ Clase personalizada
    data: { productoId: producto.id }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      if (result.accion === 'editado' || result.accion === 'eliminado') {
        this.cargarProductos();
        const mensaje = result.accion === 'editado' 
          ? '✅ Producto actualizado exitosamente' 
          : '✅ Producto eliminado exitosamente';
        this.mostrarMensaje(mensaje, 'success');
      }
    }
  });
}

  editarProducto(producto: Producto): void {
    console.log('Editar producto:', producto);
    // Aquí puedes abrir el mismo modal pero pasando el producto para editar
  }

  eliminarProducto(producto: Producto): void {
    // ⭐ CONFIRMAR ANTES DE ELIMINAR
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

  // ⭐ MÉTODO PARA EJECUTAR LA ELIMINACIÓN
  private ejecutarEliminacion(producto: Producto): void {
  console.log('🗑️ Eliminando producto:', producto);
  
  this.productoService.eliminarProducto(producto.id).subscribe({
    next: (response) => {
      console.log('✅ Respuesta del servidor:', response);
      console.log('✅ Status:', response?.status); // Debería ser 204
      
      this.mostrarMensaje('✅ Producto eliminado exitosamente', 'success');
      
      // Actualizar la lista de productos SOLO después de confirmar eliminación
      this.productos = this.productos.filter(p => p.id !== producto.id);
      this.productosFiltrados.data = this.productos;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('❌ Error al eliminar producto:', error);
      console.error('❌ Status:', error.status);
      console.error('❌ URL:', error.url);
      console.error('❌ Error completo:', error);
      
      let mensaje = 'Error al eliminar el producto';
      
      if (error.status === 404) {
        mensaje = 'Producto no encontrado';
      } else if (error.status === 400) {
        mensaje = error.error?.message || 'No se puede eliminar el producto';
      } else if (error.status === 500) {
        mensaje = 'Error interno del servidor';
      } else if (error.status === 0) {
        mensaje = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
      }
      
      this.mostrarMensaje(`❌ ${mensaje}`, 'error');
    },
    complete: () => {
      console.log('🏁 Operación de eliminación completada');
    }
  });
}
  // ⭐ MÉTODO PARA MOSTRAR MENSAJES
  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  exportarDatos(): void {
    console.log('Exportar datos');
  }

  abrirFiltros(): void {
    console.log('Abrir filtros');
  }
}