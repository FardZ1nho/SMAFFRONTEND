import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon'; // Asegúrate de importar esto
// 1. IMPORTACIONES PARA EL MODAL
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// SERVICIOS Y MODELOS
import { CompraService } from '../../../services/compra-service'; 
import { ProveedorService } from '../../../services/proveedor-service';
import { ProductoService } from '../../../services/producto-service';
import { AlmacenService } from '../../../services/almacen-service';
import { CompraRequest } from '../../../models/compra';
import { Proveedor } from '../../../models/proveedor'; 
import { Almacen } from '../../../models/almacen';

// IMPORTA TU COMPONENTE MODAL (Ajusta la ruta si es necesario)
import { ProductoModalComponent } from '../../inventario/producto-modal/producto-modal';

@Component({
  selector: 'app-compra-form',
  standalone: true,
  // 2. AGREGAR MatDialogModule EN LOS IMPORTS
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule],
  templateUrl: './compra-form.html',
  styleUrls: ['./compra-form.css']
})
export class CompraFormComponent implements OnInit {

  // Cabecera de la compra
  compra: CompraRequest = {
    tipoComprobante: 'FACTURA ELECTRÓNICA',
    serie: '',
    numero: '',
    fecEmision: new Date().toISOString().split('T')[0],
    proveedorId: 0,
    moneda: 'Soles',
    tipoCambio: 3.361,
    observaciones: '',
    detalles: []
  };

  proveedores: Proveedor[] = [];
  almacenes: Almacen[] = [];
  
  busquedaProducto: string = '';
  productosFiltrados: any[] = [];
  itemsAgregados: any[] = [];

  constructor(
    private compraService: CompraService,
    private proveedorService: ProveedorService,
    private productoService: ProductoService,
    private almacenService: AlmacenService,
    private router: Router,
    // 3. INYECTAR MATDIALOG
    private dialog: MatDialog 
  ) { }

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarAlmacenes();
  }

  cargarProveedores() {
    this.proveedorService.listarActivos().subscribe(data => this.proveedores = data);
  }

  cargarAlmacenes() {
    this.almacenService.listarAlmacenesActivos().subscribe(data => this.almacenes = data);
  }

  // --- LÓGICA DEL BOTÓN "NUEVO PRODUCTO" ---
  // --- LÓGICA DEL BOTÓN "NUEVO PRODUCTO" ---
  nuevoProducto(): void {
    // Abrimos el modal con nuevas dimensiones
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '90%',           // Ocupa el 90% del ancho de la pantalla
      maxWidth: '1200px',     // Tope máximo para pantallas gigantes
      height: '90vh',         // Ocupa el 90% del alto (viewport height)
      maxHeight: '95vh',      // Tope máximo de alto
      panelClass: 'full-screen-modal', // Clase opcional por si queremos estilos extra
      disableClose: true,     // Obliga a usar los botones para cerrar
      data: { modo: 'crear' } 
    });

    // Cuando se cierra el modal...
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Enfocamos el buscador para que busque el producto recién creado
        const inputBuscador = document.querySelector('.search-input-lg') as HTMLInputElement;
        if(inputBuscador) inputBuscador.focus();
      }
    });
  }

  // --- RESTO DE TU LÓGICA (Sin cambios) ---

  buscarProducto() {
    if (this.busquedaProducto.length > 1) {
      this.productoService.buscarProductos(this.busquedaProducto).subscribe(data => {
        this.productosFiltrados = data;
      });
    } else {
      this.productosFiltrados = [];
    }
  }

  agregarProducto(prod: any) {
    const nuevoItem = {
      productoId: prod.id,
      nombre: prod.nombre,
      codigo: prod.codigo,
      cantidad: 1,
      precioUnitario: prod.precioVenta || 0,
      almacenId: this.almacenes.length > 0 ? this.almacenes[0].id : null
    };
    this.itemsAgregados.push(nuevoItem);
    this.busquedaProducto = '';
    this.productosFiltrados = [];
  }

  eliminarItem(index: number) {
    this.itemsAgregados.splice(index, 1);
  }

  calcularTotal(): number {
    return this.itemsAgregados.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
  }

  guardarCompra() {
    // 1. Validaciones básicas
    if (this.compra.proveedorId === 0) {
      alert("⚠️ Por favor, seleccione un proveedor.");
      return;
    }
    if (this.itemsAgregados.length === 0) {
      alert("⚠️ Debe agregar al menos un producto a la lista.");
      return;
    }

    // 2. Mapear items de la UI al formato del Request que espera Java
    this.compra.detalles = this.itemsAgregados.map(item => ({
      productoId: item.productoId,
      almacenId: Number(item.almacenId),
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario
    }));

    // 🕵️‍♂️ EL CHIVATO: Mira esto en la consola antes de que se envíe
    console.log('📤 ENVIANDO COMPRA AL BACKEND:', this.compra);

    // 3. Enviar al servicio
    this.compraService.registrarCompra(this.compra).subscribe({
      next: (respuesta) => {
        console.log('✅ RESPUESTA DEL BACKEND:', respuesta);
        alert("Compra registrada con éxito");
        this.router.navigate(['/compras']);
      },
      error: (err) => {
        console.error('❌ ERROR AL GUARDAR:', err);
        alert("Error al registrar: " + (err.error?.message || err.message));
      }
    });
  }

  cancelar() {
    this.router.navigate(['/compras']);
  }
}