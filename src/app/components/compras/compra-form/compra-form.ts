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

// MODALES
import { ProductoModalComponent } from '../../inventario/producto-modal/producto-modal';
import { ProveedorFormComponent } from '../../proveedor/proveedor-form/proveedor-form';

@Component({
  selector: 'app-compra-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, MatTooltipModule],
  templateUrl: './compra-form.html',
  styleUrls: ['./compra-form.css']
})
export class CompraFormComponent implements OnInit {

  // ✅ LISTAS DE COMPROBANTES
  comprobantesBien = [
    { valor: 'FACTURA_ELECTRONICA', texto: 'FACTURA ELECTRÓNICA' },
    { valor: 'FACTURA_COMERCIAL', texto: 'FACTURA COMERCIAL' },
    { valor: 'BOLETA', texto: 'BOLETA DE VENTA' },
    { valor: 'GUIA_REMISION', texto: 'GUIA DE REMISION' },
    { valor: 'NOTA_DE_VENTA', texto: 'NOTA DE VENTA' },
    { valor: 'OTROS', texto: 'OTROS' }
  ];

  comprobantesServicio = [
    { valor: 'FACTURA_ELECTRONICA', texto: 'FACTURA ELECTRÓNICA' },
    { valor: 'BOLETA', texto: 'BOLETA DE VENTA' },
    { valor: 'RECIBO_POR_HONORARIOS', texto: 'RECIBO POR HONORARIOS' },
    { valor: 'RECIBO_SIMPLE', texto: 'RECIBO SIMPLE' },
    { valor: 'OTROS', texto: 'OTROS' }
  ];

  listaComprobantes = this.comprobantesBien;

  // ✅ MODELO INICIAL
  compra: CompraRequest = {
    tipoCompra: 'BIEN',
    tipoComprobante: 'FACTURA_ELECTRONICA',
    serie: 'F001',
    numero: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    proveedorId: 0,
    moneda: 'PEN',
    tipoCambio: 3.75,
    observaciones: '',

    // Totales
    subTotal: 0,
    igv: 0,
    total: 0,

    // Impuestos
    percepcion: 0,
    detraccionPorcentaje: 0,
    detraccionMonto: 0,
    retencion: 0,

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
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
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

  // ✅ CAMBIO DE TIPO (BIEN vs SERVICIO)
  cambiarTipoCompra(tipo: 'BIEN' | 'SERVICIO') {
    this.compra.tipoCompra = tipo;

    if (tipo === 'BIEN') {
      this.listaComprobantes = this.comprobantesBien;
      this.compra.tipoComprobante = 'FACTURA_ELECTRONICA';

      this.compra.detraccionPorcentaje = 0;
      this.compra.detraccionMonto = 0;

      if (this.almacenes.length > 0) {
        this.itemsAgregados.forEach(i => {
          if (!i.almacenId) i.almacenId = this.almacenes[0].id;
        });
      }

    } else {
      this.listaComprobantes = this.comprobantesServicio;
      this.compra.tipoComprobante = 'RECIBO_POR_HONORARIOS';

      this.compra.percepcion = 0;
      this.itemsAgregados.forEach(i => i.almacenId = null);
    }

    this.recalcularTotales();
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
        this.proveedorService.listarActivos().subscribe(data => {
          this.proveedores = data;
          if (this.proveedores.length > 0) {
            const ultimo = this.proveedores[this.proveedores.length - 1];
            this.compra.proveedorId = ultimo.id!;
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

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
        if (inputBuscador) inputBuscador.focus();
      }
    });
  }

  buscarProducto() {
    const termino = this.busquedaProducto.trim();
    if (termino.length >= 3) {
      this.productoService.buscarProductos(termino).subscribe({
        next: (data) => {
          this.productosFiltrados = data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.productosFiltrados = [];
      this.cdr.detectChanges();
    }
  }

  // ✅ AGREGAR PRODUCTO (INICIALIZA EL DOBLE PRECIO)
  agregarProducto(prod: any) {
    const almacenDefault = (this.compra.tipoCompra === 'BIEN' && this.almacenes.length > 0)
      ? this.almacenes[0].id : null;

    const precioBase = prod.precioVenta || 0;

    const nuevoItem = {
      productoId: prod.id,
      nombre: prod.nombre,
      codigo: prod.codigo,
      cantidad: 1,

      // PRECIO COMPRA (Base sin IGV - Va al Backend)
      precioUnitario: precioBase,

      // COSTO UNITARIO (Con IGV - Solo visual/ayuda)
      costoConIgv: precioBase * 1.18,

      almacenId: almacenDefault
    };

    this.itemsAgregados.push(nuevoItem);
    this.busquedaProducto = '';
    this.productosFiltrados = [];
    this.recalcularTotales();
  }

  // ✅ ACTUALIZAR PRECIOS (SINCRONIZA BASE <-> TOTAL)
  actualizarPrecios(item: any, origen: 'BASE' | 'TOTAL') {
    const TASA_IGV = 1.18; // 18%

    if (origen === 'TOTAL') {
      // El usuario escribió el COSTO UNITARIO (Con IGV) -> Calculamos Base
      item.precioUnitario = item.costoConIgv / TASA_IGV;
    } else {
      // El usuario escribió el PRECIO COMPRA (Sin IGV) -> Calculamos Total
      item.costoConIgv = item.precioUnitario * TASA_IGV;
    }

    // Redondeo visual para los inputs
    item.precioUnitario = Number(item.precioUnitario.toFixed(4));
    item.costoConIgv = Number(item.costoConIgv.toFixed(2));

    this.recalcularTotales();
  }

  eliminarItem(index: number) {
    this.itemsAgregados.splice(index, 1);
    this.recalcularTotales();
  }

  recalcularTotales() {
    const sumaItems = this.itemsAgregados.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
    this.compra.subTotal = sumaItems;
    this.compra.igv = sumaItems * 0.18;

    let totalDoc = this.compra.subTotal + this.compra.igv;

    // Percepción
    if (this.compra.tipoCompra === 'BIEN' && this.compra.percepcion) {
      totalDoc += Number(this.compra.percepcion);
    }

    this.compra.total = totalDoc;

    // Detracción
    if (this.compra.tipoCompra === 'SERVICIO' && this.compra.detraccionPorcentaje) {
      this.compra.detraccionMonto = (this.compra.total * this.compra.detraccionPorcentaje) / 100;
    } else {
      this.compra.detraccionMonto = 0;
    }
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

    // Validación Almacén
    if (this.compra.tipoCompra === 'BIEN') {
      const faltaAlmacen = this.itemsAgregados.some(i => !i.almacenId);
      if (faltaAlmacen) {
        alert("⚠️ Para compras de BIENES, todos los productos deben tener un almacén de destino.");
        return;
      }
    }

    // Mapeo final
    this.compra.detalles = this.itemsAgregados.map(item => ({
      productoId: item.productoId,
      almacenId: item.almacenId ? Number(item.almacenId) : null,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario
    }));

    console.log('📤 ENVIANDO:', this.compra);

    this.compraService.registrarCompra(this.compra).subscribe({
      next: (respuesta) => {
        alert("Compra registrada con éxito");
        this.router.navigate(['/compras']);
      },
      error: (err) => {
        console.error('❌ ERROR:', err);
        alert("Error al registrar: " + (err.error || err.message));
      }
    });
  }
  getSimboloMoneda(): string {
    return this.compra.moneda === 'USD' ? '$' : 'S/';
  }

  cancelar() {
    this.router.navigate(['/compras']);
  }
}