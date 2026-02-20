import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs'; // ✅ IMPORTANTE PARA SINCRONIZAR

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

  tipoPago: TipoPago = TipoPago.CONTADO;
  porcentajeIgv: number = 18;

  pagoActual: PagoCompraRequest = {
    metodoPago: MetodoPago.TRANSFERENCIA,
    monto: 0,
    moneda: 'USD', 
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
    tipoComprobante: 'FACTURA_COMERCIAL' as any, 
    tipoPago: TipoPago.CONTADO,
    serie: '',
    numero: '',
    codImportacion: '', 
    pesoNetoKg: 0,
    cbm: 0,
    fechaEmision: new Date().toISOString().split('T')[0] as any, 
    proveedorId: 0,
    moneda: 'USD', 
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

    // ✅ LÓGICA CORREGIDA: Descargar todos los catálogos en paralelo ANTES de cargar los datos de edición
    forkJoin({
      proveedores: this.proveedorService.listarActivos(),
      almacenes: this.almacenService.listarAlmacenesActivos(),
      cuentas: this.cuentaService.listarActivas()
    }).subscribe({
      next: (res) => {
        this.proveedores = res.proveedores;
        this.almacenes = res.almacenes;
        this.cuentasBancarias = res.cuentas;

        // Una vez que tenemos las listas llenas, recién mapeamos la compra a editar
        if (id) {
          this.modoEdicion = true;
          this.idCompraEditar = Number(id);
          this.cargarDatosEdicion(this.idCompraEditar);
        }
      },
      error: (err) => console.error("Error cargando catálogos", err)
    });
  }

  cargarDatosEdicion(id: number) {
    this.compraService.obtenerPorId(id).subscribe({
      next: (data) => {
        
        // 1. Configuramos el tipo de compra PRIMERO para cargar la lista de comprobantes correcta
        this.cambiarTipoCompra(data.tipoCompra as any);

        // 2. Asignamos los datos a la cabecera
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

        // 3. Calculamos IGV si aplica
        if (data.tipoComprobante !== 'FACTURA_COMERCIAL' && data.igv > 0 && data.subTotal > 0) {
            this.porcentajeIgv = Math.round((data.igv / data.subTotal) * 100);
        } else {
            this.porcentajeIgv = 18;
        }

        // 4. Asignamos Proveedor
        if ((data as any).proveedorId) {
             this.compra.proveedorId = (data as any).proveedorId;
        } else {
            const provEncontrado = this.proveedores.find(p => p.ruc === data.rucProveedor);
            if(provEncontrado) this.compra.proveedorId = provEncontrado.id!;
        }

        this.tipoPago = this.compra.tipoPago;

        // ✅ 5. Asignamos Detalles y Almacén (Ahora funcionará siempre)
        if (data.detalles) {
          this.itemsAgregados = data.detalles.map(d => {
            const almacenEncontrado = this.almacenes.find(a => a.nombre === d.nombreAlmacen);
            return {
              productoId: d.productoId,
              nombre: d.nombreProducto,
              codigo: d.codigoProducto,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              almacenId: almacenEncontrado ? almacenEncontrado.id : undefined
            };
          });
        }

        this.recalcularTotales();
        this.cdr.detectChanges(); // Forzamos actualización de vista
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
      if (!this.modoEdicion) this.compra.tipoComprobante = 'FACTURA_COMERCIAL' as any; 
      
      this.compra.detraccionPorcentaje = 0;
      this.compra.detraccionMonto = 0;
      if (this.almacenes.length > 0) {
        this.itemsAgregados.forEach(i => {
          if (!i.almacenId) i.almacenId = this.almacenes[0].id;
        });
      }
    } else {
      this.listaComprobantes = this.comprobantesServicio;
      if (!this.modoEdicion) this.compra.tipoComprobante = 'RECIBO_HONORARIOS' as any;
      this.compra.percepcion = 0;
      this.itemsAgregados.forEach(i => i.almacenId = null);
    }
    this.recalcularTotales();
  }

  onTipoComprobanteChange() {
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

    const precioBase = prod.precioVenta || 0;

    const nuevoItem = {
      productoId: prod.id,
      nombre: prod.nombre,
      codigo: prod.codigo,
      cantidad: 1,
      precioUnitario: precioBase,
      almacenId: almacenDefault
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

  recalcularTotales() {
    const sumaItems = this.itemsAgregados.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
    this.compra.subTotal = sumaItems;
    
    const fobAdicional = Number(this.compra.fob) || 0;
    const baseImponible = this.compra.subTotal + fobAdicional;

    if (this.compra.tipoComprobante !== 'FACTURA_COMERCIAL') {
        this.compra.igv = baseImponible * (this.porcentajeIgv / 100);
    } else {
        this.compra.igv = 0;
    }

    let totalDoc = baseImponible + this.compra.igv;

    if (this.compra.tipoCompra === 'BIEN' && this.compra.percepcion) {
      totalDoc += Number(this.compra.percepcion);
    }

    this.compra.total = totalDoc;

    if (this.compra.tipoCompra === 'SERVICIO' && this.compra.detraccionPorcentaje) {
      this.compra.detraccionMonto = (this.compra.total * this.compra.detraccionPorcentaje) / 100;
    } else {
      this.compra.detraccionMonto = 0;
    }

    if (!this.modoEdicion) {
      if (this.tipoPago === TipoPago.CONTADO) {
        this.pagoActual.monto = Number(this.compra.total.toFixed(2));
      } else {
        if (this.pagoActual.monto > this.compra.total) {
          this.pagoActual.monto = 0; 
        }
      }
    }
  }

  guardarCompra() {
    if (this.compra.proveedorId === 0) return alert("⚠️ Seleccione un proveedor.");
    if (!this.compra.serie || !this.compra.numero) return alert("⚠️ Ingrese Serie y Número del comprobante.");
    if (this.itemsAgregados.length === 0) return alert("⚠️ Agregue productos.");

    if (this.compra.tipoCompra === 'BIEN' && this.itemsAgregados.some(i => !i.almacenId)) {
      return alert("⚠️ Todos los bienes deben tener almacén destino.");
    }

    if (!this.modoEdicion && this.esPagoBancarizado() && !this.pagoActual.cuentaOrigenId) {
      return alert("⚠️ Para transferencias o Yape, debe seleccionar la Cuenta de Origen.");
    }

    if (this.tipoPago === TipoPago.CREDITO && this.pagoActual.monto >= this.compra.total) {
      if(!confirm("⚠️ El monto inicial cubre todo el total. ¿Desea cambiar a CONTADO?")) return;
      this.compra.tipoPago = TipoPago.CONTADO;
    }

    if (this.compra.tipoComprobante === 'FACTURA_COMERCIAL') {
      if (!this.compra.codImportacion) {
        if (!confirm("⚠️ Estás registrando una Factura de Importación SIN Código (ID).\n\nSe guardará como 'SIN_AGRUPAR'. ¿Estás seguro?")) {
          return;
        }
      }
    }

    this.compra.pagos = [];
    if (!this.modoEdicion) {
        if (this.pagoActual.monto > 0) {
           this.compra.pagos.push({ ...this.pagoActual });
        } else if (this.tipoPago === TipoPago.CONTADO) {
           return alert("⚠️ Una compra al CONTADO debe tener un monto de pago.");
        }
    }

    this.compra.detalles = this.itemsAgregados.map(item => ({
      productoId: item.productoId,
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