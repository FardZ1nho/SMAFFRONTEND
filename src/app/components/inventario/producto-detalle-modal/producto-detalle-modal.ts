import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Producto } from '../../../models/producto';
import { ProductoAlmacen } from '../../../models/producto-almacen';
import { ProductoService } from '../../../services/producto-service';
import { ProductoAlmacenService } from '../../../services/producto-almacen-service';
import { ProductoModalComponent } from '../producto-modal/producto-modal';
import { ConfirmDialogComponent } from '../confirm-dialog';

@Component({
  selector: 'app-producto-detalle-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './producto-detalle-modal.html',
  styleUrls: ['./producto-detalle-modal.css']
})
export class ProductoDetalleModalComponent implements OnInit {
  producto: Producto;
  productosAlmacen: ProductoAlmacen[] = [];
  
  // VARIABLES PARA VALORIZACIÓN
  valorInventarioCosto: number = 0; 
  valorInventarioVenta: number = 0; 
  
  mostrarStockBajo: boolean = false;
  cargandoAlmacenes: boolean = false;
  cargandoGeneral: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { productoId: number },
    private dialogRef: MatDialogRef<ProductoDetalleModalComponent>,
    private productoService: ProductoService,
    private productoAlmacenService: ProductoAlmacenService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.producto = {} as Producto;
  }

  ngOnInit(): void {
    this.refrescarDatos();
  }

  refrescarDatos(): void {
    this.cargandoGeneral = true;
    this.cdr.detectChanges(); 
    this.cargarProducto();
    this.cargarDistribucionAlmacenes();
  }

  cargarProducto(): void {
    this.productoService.obtenerProducto(this.data.productoId).subscribe({
      next: (producto) => {
        this.producto = producto;
        this.calcularValores(); 
        this.verificarStockBajo();
        this.cargandoGeneral = false;
        this.cdr.detectChanges(); 
      },
      error: (error) => {
        console.error('Error al cargar producto:', error);
        alert('Error al cargar el producto');
        this.cargandoGeneral = false;
        this.dialogRef.close();
      }
    });
  }

  cargarDistribucionAlmacenes(): void {
    this.cargandoAlmacenes = true;
    this.productoAlmacenService.listarUbicacionesPorProducto(this.data.productoId).subscribe({
      next: (data) => {
        this.productosAlmacen = data;
        this.cargandoAlmacenes = false;
        this.cdr.detectChanges(); 
      },
      error: (error) => {
        console.error('Error al cargar distribución:', error);
        this.productosAlmacen = [];
        this.cargandoAlmacenes = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularValores(): void {
    const stock = this.producto.stockActual || 0;
    this.valorInventarioCosto = stock * (this.producto.costoTotal || 0);
    this.valorInventarioVenta = stock * (this.producto.precioVenta || 0);
  }

  calcularMargen(): string {
    const venta = this.producto.precioVenta || 0;
    const costo = this.producto.costoTotal || 0;
    
    if (venta === 0 || costo === 0) return '0%';
    
    const margen = ((venta - costo) / venta) * 100;
    return `${margen.toFixed(1)}%`;
  }

  getSimboloMoneda(): string {
    const simbolos: { [key: string]: string } = { 'USD': '$', 'PEN': 'S/', 'EUR': '€' };
    return simbolos[this.producto.moneda || 'USD'] || '$';
  }

  formatearPrecio(precio: number | undefined): string {
    if (precio === undefined || precio === null) return `${this.getSimboloMoneda()} 0.00`;
    return `${this.getSimboloMoneda()} ${precio.toFixed(2)}`;
  }

  verificarStockBajo(): void {
    this.mostrarStockBajo = (this.producto.stockActual || 0) < (this.producto.stockMinimo || 0);
  }

  editarProducto(): void {
    this.dialogRef.close(); 
    
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '1000px',
      maxWidth: '95vw',
      disableClose: false,
      data: { producto: this.producto, modo: 'editar' }
    });
  }

  eliminarProducto(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Producto',
        message: `¿Estás seguro de eliminar "${this.producto.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) this.ejecutarEliminacion();
    });
  }

  private ejecutarEliminacion(): void {
    this.productoService.eliminarProducto(this.producto.id).subscribe({
      next: () => this.dialogRef.close({ accion: 'eliminado', producto: this.producto }),
      error: () => alert('Error al eliminar')
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  getEstadoStockClass(): string {
    switch(this.producto.estadoStock) {
      case 'AGOTADO': return 'estado-agotado';
      case 'BAJO': return 'estado-bajo';
      case 'NORMAL': return 'estado-normal';
      case 'ALTO': return 'estado-alto';
      default: return '';
    }
  }
}