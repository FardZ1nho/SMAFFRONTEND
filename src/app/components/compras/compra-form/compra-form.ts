import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// MATERIAL
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// SERVICIOS
import { CompraService } from '../../../services/compra-service';
import { ProveedorService } from '../../../services/proveedor-service';
import { ProductoService } from '../../../services/producto-service';
import { AlmacenService } from '../../../services/almacen-service';
import { CuentaBancariaService } from '../../../services/cuenta-bancaria-service';

// MODELOS
import { CompraRequest, TipoPago, MetodoPago, PagoCompraRequest } from '../../../models/compra';
import { Proveedor } from '../../../models/proveedor';
import { Almacen } from '../../../models/almacen';
import { CuentaBancaria } from '../../../models/cuenta-bancaria';

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

  // ✅ EXPOSICIÓN DE ENUMS PARA EL HTML
  public eTipoPago = TipoPago;
  public eMetodoPago = MetodoPago;

  // LISTAS DE COMPROBANTES
  comprobantesBien = [
    { valor: 'FACTURA_ELECTRONICA', texto: 'FACTURA ELECTRÓNICA' },
    { valor: 'FACTURA_COMERCIAL', texto: 'FACTURA COMERCIAL (IMPORTACIÓN)' }, // ⚠️ Valor clave
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

  // GESTIÓN DE PAGO
  tipoPago: TipoPago = TipoPago.CONTADO;
  
  pagoActual: PagoCompraRequest = {
    metodoPago: MetodoPago.EFECTIVO,
    monto: 0,
    moneda: 'PEN',
    cuentaOrigenId: undefined,
    referencia: ''
  };

  metodosPago = [
    { valor: MetodoPago.EFECTIVO, texto: 'Efectivo / Caja Chica' },
    { valor: MetodoPago.TRANSFERENCIA, texto: 'Transferencia Bancaria' },
    { valor: MetodoPago.YAPE, texto: 'Yape / Plin' },
    { valor: MetodoPago.TARJETA, texto: 'Tarjeta de Crédito/Débito' }
  ];

  // MODELO INICIAL
  compra: CompraRequest = {
    tipoCompra: 'BIEN',
    tipoComprobante: 'FACTURA_ELECTRONICA',
    tipoPago: TipoPago.CONTADO,
    serie: '',
    numero: '',
    codImportacion: '', // ✅ Inicializar vacío
    fechaEmision: new Date().toISOString().split('T')[0],
    proveedorId: 0,
    moneda: 'PEN',
    tipoCambio: 3.75,
    observaciones: '',
    subTotal: 0,
    igv: 0,
    total: 0,
    percepcion: 0,
    detraccionPorcentaje: 0,
    detraccionMonto: 0,
    retencion: 0,
    detalles: [],
    pagos: []
  };

  proveedores: Proveedor[] = [];
  almacenes: Almacen[] = [];
  cuentasBancarias: CuentaBancaria[] = [];

  busquedaProducto: string = '';
  productosFiltrados: any[] = [];
  itemsAgregados: any[] = [];

  constructor(
    private compraService: CompraService,
    private proveedorService: ProveedorService,
    private productoService: ProductoService,
    private almacenService: AlmacenService,
    private cuentaService: CuentaBancariaService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarAlmacenes();
    this.cargarCuentas();
    this.pagoActual.moneda = this.compra.moneda;
  }

  cargarProveedores() {
    this.proveedorService.listarActivos().subscribe(data => this.proveedores = data);
  }

  cargarAlmacenes() {
    this.almacenService.listarAlmacenesActivos().subscribe(data => this.almacenes = data);
  }

  cargarCuentas() {
    this.cuentaService.listarActivas().subscribe(data => this.cuentasBancarias = data);
  }

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

  // ✅ LOGICA DE LIMPIEZA CORREGIDA
  onTipoComprobanteChange() {
    console.log('🔄 Cambio de Comprobante:', this.compra.tipoComprobante);
    
    // Solo borramos el código si NO es Factura Comercial
    if (this.compra.tipoComprobante !== 'FACTURA_COMERCIAL') {
      if(this.compra.codImportacion) {
        console.warn('🗑️ Limpiando código de importación porque cambió el tipo');
      }
      this.compra.codImportacion = '';
    }
  }

  cambiarTipoPago(tipo: TipoPago) {
    this.tipoPago = tipo;
    this.compra.tipoPago = tipo;
    this.recalcularTotales();
  }

  esPagoBancarizado(): boolean {
    return [MetodoPago.TRANSFERENCIA, MetodoPago.YAPE, MetodoPago.PLIN, MetodoPago.TARJETA]
      .includes(this.pagoActual.metodoPago);
  }

  onMonedaChange() {
    this.pagoActual.moneda = this.compra.moneda;
    this.recalcularTotales();
  }

  // --- MODALES Y BÚSQUEDA ---
  nuevoProveedor(): void {
    const dialogRef = this.dialog.open(ProveedorFormComponent, {
      width: '700px', disableClose: true, data: { idProveedor: null }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.proveedorService.listarActivos().subscribe(data => {
          this.proveedores = data;
          if (this.proveedores.length > 0) {
            this.compra.proveedorId = this.proveedores[this.proveedores.length - 1].id!;
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

  nuevoProducto(): void {
    const dialogRef = this.dialog.open(ProductoModalComponent, {
      width: '90%', height: '90vh', disableClose: true, data: { modo: 'crear' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) { }
    });
  }

  buscarProducto() {
    const termino = this.busquedaProducto.trim();
    if (termino.length >= 3) {
      this.productoService.buscarProductos(termino).subscribe(data => {
        this.productosFiltrados = data;
        this.cdr.detectChanges();
      });
    } else {
      this.productosFiltrados = [];
    }
  }

  // --- GESTIÓN DE ITEMS ---
  agregarProducto(prod: any) {
    const almacenDefault = (this.compra.tipoCompra === 'BIEN' && this.almacenes.length > 0)
      ? this.almacenes[0].id : null;

    const precioBase = prod.precioVenta || 0;

    const nuevoItem = {
      productoId: prod.id,
      nombre: prod.nombre,
      codigo: prod.codigo,
      cantidad: 1,
      precioUnitario: precioBase,
      costoConIgv: precioBase * 1.18,
      almacenId: almacenDefault
    };

    this.itemsAgregados.push(nuevoItem);
    this.busquedaProducto = '';
    this.productosFiltrados = [];
    this.recalcularTotales();
  }

  actualizarPrecios(item: any, origen: 'BASE' | 'TOTAL') {
    const TASA_IGV = 1.18;
    if (origen === 'TOTAL') {
      item.precioUnitario = item.costoConIgv / TASA_IGV;
    } else {
      item.costoConIgv = item.precioUnitario * TASA_IGV;
    }
    item.precioUnitario = Number(item.precioUnitario.toFixed(4));
    item.costoConIgv = Number(item.costoConIgv.toFixed(2));
    this.recalcularTotales();
  }

  eliminarItem(index: number) {
    this.itemsAgregados.splice(index, 1);
    this.recalcularTotales();
  }

  // --- CÁLCULOS ---
  recalcularTotales() {
    const sumaItems = this.itemsAgregados.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
    this.compra.subTotal = sumaItems;
    this.compra.igv = sumaItems * 0.18;

    let totalDoc = this.compra.subTotal + this.compra.igv;

    if (this.compra.tipoCompra === 'BIEN' && this.compra.percepcion) {
      totalDoc += Number(this.compra.percepcion);
    }

    this.compra.total = totalDoc;

    if (this.compra.tipoCompra === 'SERVICIO' && this.compra.detraccionPorcentaje) {
      this.compra.detraccionMonto = (this.compra.total * this.compra.detraccionPorcentaje) / 100;
    } else {
      this.compra.detraccionMonto = 0;
    }

    if (this.tipoPago === TipoPago.CONTADO) {
      this.pagoActual.monto = Number(this.compra.total.toFixed(2));
    } else {
      if (this.pagoActual.monto > this.compra.total) {
        this.pagoActual.monto = 0; 
      }
    }
  }

  // --- GUARDAR ---
  guardarCompra() {
    // 1. Validaciones Básicas
    if (this.compra.proveedorId === 0) return alert("⚠️ Seleccione un proveedor.");
    if (!this.compra.serie || !this.compra.numero) return alert("⚠️ Ingrese Serie y Número del comprobante.");
    if (this.itemsAgregados.length === 0) return alert("⚠️ Agregue productos.");

    // 2. Validación de Almacén
    if (this.compra.tipoCompra === 'BIEN' && this.itemsAgregados.some(i => !i.almacenId)) {
      return alert("⚠️ Todos los bienes deben tener almacén destino.");
    }

    // 3. Validación de Bancos
    if (this.esPagoBancarizado() && !this.pagoActual.cuentaOrigenId) {
      return alert("⚠️ Para transferencias o Yape, debe seleccionar la Cuenta de Origen.");
    }

    // 4. Validación de Crédito/Contado
    if (this.tipoPago === TipoPago.CREDITO && this.pagoActual.monto >= this.compra.total) {
      if(!confirm("⚠️ El monto inicial cubre todo el total. ¿Desea cambiar a CONTADO?")) return;
      this.compra.tipoPago = TipoPago.CONTADO;
    }

    // ✅ 5. VALIDACIÓN CRÍTICA DE IMPORTACIÓN
    if (this.compra.tipoComprobante === 'FACTURA_COMERCIAL' && !this.compra.codImportacion) {
      // Advertencia si el usuario olvidó poner el código
      if (!confirm("⚠️ Estás registrando una Factura de Importación SIN Código (ID). \n\nSe guardará como 'SIN_AGRUPAR'. ¿Estás seguro?")) {
        return; // Cancela el guardado para que el usuario ponga el código
      }
    }

    // 6. Preparar Payload
    this.compra.pagos = [];
    if (this.pagoActual.monto > 0) {
      this.compra.pagos.push({ ...this.pagoActual });
    } else if (this.tipoPago === TipoPago.CONTADO) {
      return alert("⚠️ Una compra al CONTADO debe tener un monto de pago.");
    }

    this.compra.detalles = this.itemsAgregados.map(item => ({
      productoId: item.productoId,
      almacenId: item.almacenId ? Number(item.almacenId) : null,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario
    }));

    // 🕵️‍♂️ DEBUG FINAL: Verificar qué se envía
    console.log('🚀 ENVIANDO AL BACKEND:', this.compra); 
    console.log('📌 COD IMPORTACION:', this.compra.codImportacion);

    this.compraService.registrarCompra(this.compra).subscribe({
      next: () => {
        alert("✅ Compra registrada correctamente.");
        this.router.navigate(['/compras']);
      },
      error: (err) => {
        console.error(err);
        alert("❌ Error: " + (err.error?.message || err.message));
      }
    });
  }

  getSimboloMoneda(): string { return this.compra.moneda === 'USD' ? '$' : 'S/'; }
  cancelar() { this.router.navigate(['/compras']); }
  
  getSaldoPendiente(): number {
    return Math.max(0, this.compra.total - this.pagoActual.monto);
  }
}