import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// SERVICIOS Y MODELOS
import { CompraService } from '../../../services/compra-service'; 
import { ProveedorService } from '../../../services/proveedor-service';
import { ProductoService } from '../../../services/producto-service';
import { AlmacenService } from '../../../services/almacen-service';
import { CompraRequest } from '../../../models/compra';
import { Proveedor } from '../../../models/proveedor'; 
import { Almacen } from '../../../models/almacen';

// IMPORTAR COMPONENTES MODALES
import { ProductoModalComponent } from '../../inventario/producto-modal/producto-modal';
// ✅ IMPORTAR DIRECTAMENTE EL FORMULARIO DE PROVEEDOR
import { ProveedorFormComponent } from '../../proveedor/proveedor-form/proveedor-form';  

@Component({
  selector: 'app-compra-form',
  standalone: true,
  // ✅ IMPORTANTE: Agregar ProveedorFormComponent aquí para poder abrirlo
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, MatTooltipModule], 
  templateUrl: './compra-form.html',
  styleUrls: ['./compra-form.css']
})
export class CompraFormComponent implements OnInit {

  // Cabecera de la compra
  compra: CompraRequest = {
    tipoComprobante: 'FACTURA ELECTRÓNICA',
    serie: 'F001',
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
    private dialog: MatDialog, // Inyección del servicio de Diálogos
    private cdr: ChangeDetectorRef // 👈 2. INYECTAR AQUÍ
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

nuevoProveedor(): void {
    const dialogRef = this.dialog.open(ProveedorFormComponent, {
      width: '700px',
      maxWidth: '95vw',
      disableClose: true,
      data: { idProveedor: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Recargamos la lista
        this.proveedorService.listarActivos().subscribe(data => {
           this.proveedores = data;
           
           // 👇 Seleccionar automáticamente el último creado (Truco Pro)
           if (this.proveedores.length > 0) {
             // Asumiendo que el último de la lista es el nuevo, o podrías buscar por ID si el backend lo devuelve
             const ultimo = this.proveedores[this.proveedores.length - 1];
             this.compra.proveedorId = ultimo.id!;
           }

           this.cdr.detectChanges(); // 👈 4. ¡DESPIERTA ANGULAR!
        });
      }
    });
  }

  // --- LÓGICA EXISTENTE: NUEVO PRODUCTO ---
  nuevoProducto(): void {
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '90%',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '95vh',
      panelClass: 'full-screen-modal',
      disableClose: true,
      data: { modo: 'crear' } 
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const inputBuscador = document.querySelector('.search-input-lg') as HTMLInputElement;
        if(inputBuscador) inputBuscador.focus();
      }
    });
  }

  // ... resto del código ...

buscarProducto() {
    const termino = this.busquedaProducto.trim();

    if (termino.length >= 3) { 
      this.productoService.buscarProductos(termino).subscribe({
        next: (data) => {
          this.productosFiltrados = data;
          this.cdr.detectChanges(); // 👈 3. ¡DESPIERTA ANGULAR!
        },
        error: (err) => console.error(err)
      });
    } else {
      this.productosFiltrados = [];
      // Opcional: También aquí por si borras rápido
      this.cdr.detectChanges(); 
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
    
    // ✅ ESTO ASEGURA EL "CLIC ÚNICO":
    // Al seleccionar, borramos el texto y vaciamos la lista inmediatamente
    this.busquedaProducto = '';
    this.productosFiltrados = []; 
    
    // Opcional: Devolver el foco al input por si quiere buscar otro rápido
    // document.querySelector('.search-input-lg')?.focus();
  }
  // ... resto del código ...

  eliminarItem(index: number) {
    this.itemsAgregados.splice(index, 1);
  }

  calcularTotal(): number {
    return this.itemsAgregados.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
  }

  guardarCompra() {
    if (this.compra.proveedorId === 0) {
      alert("⚠️ Por favor, seleccione un proveedor.");
      return;
    }
    if (this.itemsAgregados.length === 0) {
      alert("⚠️ Debe agregar al menos un producto a la lista.");
      return;
    }

    this.compra.detalles = this.itemsAgregados.map(item => ({
      productoId: item.productoId,
      almacenId: Number(item.almacenId),
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario
    }));

    console.log('📤 ENVIANDO COMPRA AL BACKEND:', this.compra);

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