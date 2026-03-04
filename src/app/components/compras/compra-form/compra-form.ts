import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs'; 

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
import { 
  CompraRequest, 
  TipoPago, 
  MetodoPago, 
  PagoCompraRequest 
} from '../../../models/compra';
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

  public eTipoPago = TipoPago;
  public eMetodoPago = MetodoPago;
  
  public modoEdicion: boolean = false;
  public idCompraEditar: number | null = null;

  comprobantesBien = [
    { valor: 'FACTURA_ELECTRONICA', texto: 'FACTURA ELECTRÓNICA' },
    { valor: 'FACTURA_COMERCIAL', texto: 'FACTURA COMERCIAL (IMPORTACIÓN)' }, 
    { valor: 'BOLETA', texto: 'BOLETA DE VENTA' },
    { valor: 'GUIA_REMISION', texto: 'GUIA DE REMISION' },
    { valor: 'NOTA_VENTA', texto: 'NOTA DE VENTA' },
    { valor: 'OTROS', texto: 'OTROS' }
  ];

  comprobantesServicio = [
    { valor: 'FACTURA_ELECTRONICA', texto: 'FACTURA ELECTRÓNICA' },
    { valor: 'BOLETA', texto: 'BOLETA DE VENTA' },
    { valor: 'RECIBO_HONORARIOS', texto: 'RECIBO POR HONORARIOS' },
    { valor: 'RECIBO_SIMPLE', texto: 'RECIBO SIMPLE' },
    { valor: 'OTROS', texto: 'OTROS' }
  ];

  listaComprobantes = this.comprobantesBien;
  tipoComprobanteAnterior: string = 'FACTURA_ELECTRONICA';

  tipoPago: TipoPago = TipoPago.CONTADO;
  porcentajeIgv: number = 18;

  pagoActual: PagoCompraRequest = {
    metodoPago: MetodoPago.TRANSFERENCIA,
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

  compra: CompraRequest = {
    tipoCompra: 'BIEN',
    tipoComprobante: 'FACTURA_ELECTRONICA' as any, 
    tipoPago: TipoPago.CONTADO,
    serie: '',
    numero: '',
    codImportacion: '', 
    pesoNetoKg: 0,
    cbm: 0,
    fechaEmision: new Date().toISOString().split('T')[0] as any, 
    proveedorId: 0,
    moneda: 'PEN', 
    tipoCambio: 3.75,
    observaciones: '',
    subTotal: 0,
    fob: 0,
    igv: 0,
    total: 0,
    percepcion: 0,
    detraccionPorcentaje: 0,
    detraccionMonto: 0,
    retencion: 0,
    detalles: [],
    pagos: []
  };

  busquedaProveedor: string = '';
  rucProveedorLibre: string = ''; 
  proveedoresFiltrados: Proveedor[] = [];
  proveedorSeleccionado: Proveedor | null = null;
  mostrarListaProveedores: boolean = false;
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
    private route: ActivatedRoute, 
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.pagoActual.moneda = this.compra.moneda;
    const id = this.route.snapshot.paramMap.get('id');

    forkJoin({
      proveedores: this.proveedorService.listarActivos(),
      almacenes: this.almacenService.listarAlmacenesActivos(),
      cuentas: this.cuentaService.listarActivas()
    }).subscribe({
      next: (res) => {
        this.proveedores = res.proveedores;
        this.almacenes = res.almacenes;
        this.cuentasBancarias = res.cuentas;

        if (id) {
          this.modoEdicion = true;
          this.idCompraEditar = Number(id);
          this.cargarDatosEdicion(this.idCompraEditar);
        } else {
          this.compra.tipoComprobante = 'FACTURA_ELECTRONICA' as any;
          this.tipoComprobanteAnterior = 'FACTURA_ELECTRONICA';
        }
      },
      error: (err) => console.error("Error cargando catálogos", err)
    });
  }

  cargarDatosEdicion(id: number) {
    this.compraService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.cambiarTipoCompra(data.tipoCompra as any);

        this.compra = {
          ...this.compra, 
          tipoCompra: data.tipoCompra as any,
          tipoComprobante: data.tipoComprobante as any,
          tipoPago: data.tipoPago as any,
          serie: data.serie,
          numero: data.numero,
          fechaEmision: data.fechaEmision.split('T')[0] as any,
          moneda: data.moneda as 'PEN' | 'USD', 
          tipoCambio: data.tipoCambio,
          observaciones: data.observaciones || '',
          subTotal: data.subTotal,
          fob: data.fob,
          igv: data.igv,
          total: data.total,
          percepcion: data.percepcion,
          detraccionPorcentaje: data.detraccionPorcentaje || 0,
          detraccionMonto: data.detraccionMonto || 0,
          retencion: data.retencion,
          codImportacion: data.codImportacion || '',
          pesoNetoKg: data.pesoNetoKg || 0,
          cbm: data.cbm || 0
        };

        this.tipoComprobanteAnterior = this.compra.tipoComprobante;

        if (data.tipoComprobante !== 'FACTURA_COMERCIAL' && data.igv > 0 && data.subTotal > 0) {
            this.porcentajeIgv = Math.round((data.igv / data.subTotal) * 100);
        } else {
            this.porcentajeIgv = 18;
        }

        if ((data as any).proveedorId && (data as any).proveedorId !== 0) {
             const provEncontrado = this.proveedores.find(p => p.id === (data as any).proveedorId);
             if (provEncontrado) this.seleccionarProveedor(provEncontrado);
        } else if (data.nombreProveedor) {
             this.busquedaProveedor = data.nombreProveedor;
             this.rucProveedorLibre = (data as any).rucProveedor && (data as any).rucProveedor !== 'S/D' ? (data as any).rucProveedor : '';
             this.usarProveedorLibre();
        }

        this.tipoPago = this.compra.tipoPago;

        // ✅ CARGA DE PAGOS CORREGIDA (Evitando errores estrictos de TypeScript)
        if (data.pagos && data.pagos.length > 0) {
            const pagoBd = data.pagos[0] as any; // Convertimos a 'any' para saltar el error de TS
            
            this.pagoActual = {
                metodoPago: pagoBd.metodoPago,
                monto: pagoBd.monto,
                moneda: pagoBd.moneda,
                cuentaOrigenId: pagoBd.cuentaOrigenId, 
                referencia: pagoBd.referencia || ''
            };
            
            // Le inyectamos el ID por debajo de la mesa para que actualice correctamente
            (this.pagoActual as any).id = pagoBd.id; 
        }

        if (data.detalles) {
          this.itemsAgregados = data.detalles.map(d => {
            const almacenEncontrado = this.almacenes.find(a => a.nombre === d.nombreAlmacen);
            return {
              productoId: d.productoId || 0, 
              nombre: d.nombreProducto,
              codigo: d.codigoProducto || 'LIBRE',
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              almacenId: almacenEncontrado ? almacenEncontrado.id : undefined
            };
          });
        }

        this.recalcularTotales();
        this.cdr.detectChanges();
      },
      error: (e) => {
        alert("Error al cargar la compra: " + e.message);
        this.router.navigate(['/compras']);
      }
    });
  }

  cambiarTipoCompra(tipo: 'BIEN' | 'SERVICIO') {
    this.compra.tipoCompra = tipo;

    if (tipo === 'BIEN') {
      this.listaComprobantes = this.comprobantesBien;
      if (!this.modoEdicion) {
        this.compra.tipoComprobante = 'FACTURA_ELECTRONICA' as any; 
        this.tipoComprobanteAnterior = 'FACTURA_ELECTRONICA';
      }
      this.compra.detraccionPorcentaje = 0;
      this.compra.detraccionMonto = 0;
    } else {
      this.listaComprobantes = this.comprobantesServicio;
      if (!this.modoEdicion) {
        this.compra.tipoComprobante = 'RECIBO_HONORARIOS' as any;
        this.tipoComprobanteAnterior = 'RECIBO_HONORARIOS';
      }
      this.compra.percepcion = 0;
      this.itemsAgregados.forEach(i => i.almacenId = null);
    }
    this.recalcularTotales();
  }

  onTipoComprobanteChange(nuevoTipo: string) {
    if (nuevoTipo === 'FACTURA_COMERCIAL') {
      const tieneItemLibre = this.itemsAgregados.some(i => i.productoId === 0);
      const tieneProvLibre = this.proveedorSeleccionado && this.proveedorSeleccionado.id === 0;

      if (tieneItemLibre || tieneProvLibre) {
        alert('❌ La Factura Comercial NO permite Proveedores ni Productos de texto libre.');
        setTimeout(() => this.compra.tipoComprobante = this.tipoComprobanteAnterior as any, 0);
        return;
      }
      this.compra.moneda = 'USD';
    } else {
      this.compra.moneda = 'PEN';
    }

    this.tipoComprobanteAnterior = nuevoTipo;
    this.onMonedaChange();

    if (this.compra.tipoComprobante !== 'FACTURA_COMERCIAL') {
      this.compra.codImportacion = '';
      this.compra.pesoNetoKg = 0;
      this.compra.cbm = 0;
      this.compra.fob = 0; 
    }
    this.recalcularTotales();
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

  buscarProveedores() {
    if (!this.busquedaProveedor.trim()) {
      this.proveedoresFiltrados = [];
      this.mostrarListaProveedores = false;
      return;
    }
    const termino = this.busquedaProveedor.toLowerCase();
    this.proveedoresFiltrados = this.proveedores.filter(p =>
      p.nombre.toLowerCase().includes(termino) || (p.ruc && p.ruc.includes(termino))
    );
    this.mostrarListaProveedores = true;
  }

  seleccionarProveedor(proveedor: Proveedor) {
    this.proveedorSeleccionado = proveedor;
    this.busquedaProveedor = proveedor.nombre;
    this.compra.proveedorId = proveedor.id!;
    this.mostrarListaProveedores = false;
    this.rucProveedorLibre = ''; 
  }

  usarProveedorLibre() {
    this.proveedorSeleccionado = {
      id: 0,
      nombre: this.busquedaProveedor,
      ruc: this.rucProveedorLibre || 'S/D' 
    } as Proveedor;
    this.compra.proveedorId = 0; 
    this.mostrarListaProveedores = false;
  }

  limpiarProveedor() {
    this.proveedorSeleccionado = null;
    this.busquedaProveedor = '';
    this.compra.proveedorId = 0;
    this.rucProveedorLibre = '';
  }

  nuevoProveedor(): void {
    const dialogRef = this.dialog.open(ProveedorFormComponent, {
      width: '700px', disableClose: true, data: { idProveedor: null }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.proveedorService.listarActivos().subscribe(data => {
          this.proveedores = data;
          if (this.proveedores.length > 0) {
            this.seleccionarProveedor(this.proveedores[this.proveedores.length - 1]);
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

  agregarProducto(prod: any) {
    const almacenDefault = (this.compra.tipoCompra === 'BIEN' && this.almacenes.length > 0)
      ? this.almacenes[0].id : undefined;

    const nuevoItem = {
      productoId: prod.id,
      nombre: prod.nombre,
      codigo: prod.codigo,
      cantidad: 1,
      precioUnitario: prod.precioVenta || 0,
      almacenId: almacenDefault
    };

    this.itemsAgregados.push(nuevoItem);
    this.busquedaProducto = '';
    this.productosFiltrados = [];
    this.recalcularTotales();
  }

  agregarProductoLibre() {
    const nuevoItem = {
      productoId: 0, 
      nombre: this.busquedaProducto,
      codigo: 'LIBRE',
      cantidad: 1,
      precioUnitario: 0,
      almacenId: undefined 
    };

    this.itemsAgregados.push(nuevoItem);
    this.busquedaProducto = '';
    this.productosFiltrados = [];
    this.recalcularTotales();
  }

  eliminarItem(index: number) {
    this.itemsAgregados.splice(index, 1);
    this.recalcularTotales();
  }

  requiereAlmacen(): boolean {
    if (this.compra.tipoCompra !== 'BIEN') return false;
    return this.itemsAgregados.some(item => item.productoId !== 0);
  }

  recalcularTotales() {
    const sumaTotalItemsConIgv = this.itemsAgregados.reduce((acc, item) => acc + (item.cantidad * (Number(item.precioUnitario) || 0)), 0);
    const fobAdicional = Number(this.compra.fob) || 0;
    const valorIgv = Number(this.porcentajeIgv) || 0;

    if (this.compra.tipoComprobante !== 'FACTURA_COMERCIAL') {
        const totalConIgv = sumaTotalItemsConIgv + fobAdicional;
        this.compra.subTotal = totalConIgv / (1 + (valorIgv / 100));
        this.compra.igv = totalConIgv - this.compra.subTotal;
        
        let totalDoc = totalConIgv;
        if (this.compra.tipoCompra === 'BIEN' && this.compra.percepcion) {
          totalDoc += Number(this.compra.percepcion);
        }
        this.compra.total = totalDoc;

    } else {
        this.compra.subTotal = sumaTotalItemsConIgv;
        this.compra.igv = 0;
        
        let totalDoc = this.compra.subTotal + fobAdicional;
        if (this.compra.tipoCompra === 'BIEN' && this.compra.percepcion) {
          totalDoc += Number(this.compra.percepcion);
        }
        this.compra.total = totalDoc;
    }

    if (this.compra.tipoCompra === 'SERVICIO' && this.compra.detraccionPorcentaje) {
      this.compra.detraccionMonto = (this.compra.total * this.compra.detraccionPorcentaje) / 100;
    } else {
      this.compra.detraccionMonto = 0;
    }

    if (this.tipoPago === TipoPago.CONTADO) {
      this.pagoActual.monto = Number(this.compra.total.toFixed(2));
    } else {
      if (!this.modoEdicion && this.pagoActual.monto > this.compra.total) {
        this.pagoActual.monto = 0; 
      }
    }
  }

  guardarCompra() {
    if (!this.proveedorSeleccionado) return alert("⚠️ Seleccione un proveedor válido o de texto libre.");
    
    if (this.proveedorSeleccionado.id === 0 && (!this.rucProveedorLibre || this.rucProveedorLibre.trim() === '')) {
       return alert("⚠️ Si usa un proveedor libre, debe ingresar su RUC para temas contables.");
    }

    if (!this.compra.serie || !this.compra.numero) return alert("⚠️ Ingrese Serie y Número del comprobante.");
    if (this.itemsAgregados.length === 0) return alert("⚠️ Agregue productos.");

    if (this.tipoPago === TipoPago.CREDITO && this.pagoActual.monto >= this.compra.total) {
      if(!confirm("⚠️ El monto inicial cubre todo el total. ¿Desea cambiar a CONTADO?")) return;
      this.compra.tipoPago = TipoPago.CONTADO;
    }

    this.compra.proveedorId = this.proveedorSeleccionado.id === 0 ? null as any : this.proveedorSeleccionado.id;
    (this.compra as any).nombreProveedor = this.proveedorSeleccionado.id === 0 ? this.busquedaProveedor : null;
    (this.compra as any).rucProveedor = this.proveedorSeleccionado.id === 0 ? this.rucProveedorLibre : null;

    this.compra.pagos = [];
    if (this.pagoActual.monto > 0) {
       this.compra.pagos.push({ ...this.pagoActual });
    } else if (this.tipoPago === TipoPago.CONTADO) {
       return alert("⚠️ Una compra al CONTADO debe tener un monto de pago.");
    }

    this.compra.detalles = this.itemsAgregados.map(item => ({
      productoId: item.productoId === 0 ? null as any : item.productoId,
      nombreProducto: item.nombre,
      almacenId: item.almacenId ? Number(item.almacenId) : undefined,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario
    }));
    
    if (this.modoEdicion && this.idCompraEditar) {
      this.compraService.actualizarCompra(this.idCompraEditar, this.compra).subscribe({
        next: () => {
          alert("✅ Compra actualizada correctamente.");
          this.router.navigate(['/compras']);
        },
        error: (err) => {
          console.error(err);
          const msg = err.error?.message || err.message || 'Error desconocido';
          alert("❌ Error al actualizar: " + msg);
        }
      });
    } else {
      this.compraService.registrarCompra(this.compra).subscribe({
        next: () => {
          alert("✅ Compra registrada correctamente.");
          this.router.navigate(['/compras']);
        },
        error: (err) => {
          console.error(err);
          const msg = err.error?.message || err.message || 'Error desconocido';
          alert("❌ Error: " + msg);
        }
      });
    }
  }

  getSimboloMoneda(): string { 
    return this.compra.moneda === 'USD' ? '$' : 'S/'; 
  }

  cancelar() { 
    this.router.navigate(['/compras']); 
  }
  
  getSaldoPendiente(): number {
    return Math.max(0, this.compra.total - this.pagoActual.monto);
  }
}