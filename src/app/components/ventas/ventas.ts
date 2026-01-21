import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

// Servicios
import { VentaService } from '../../services/venta-service';
import { ProductoService } from '../../services/producto-service';
import { ClienteService } from '../../services/cliente-service';
import { CuentaBancariaService } from '../../services/cuenta-bancaria-service';

// Modelos
import { Producto } from '../../models/producto';
import { Cliente } from '../../models/cliente';
import { CuentaBancaria } from '../../models/cuenta-bancaria';
import { VentaRequest, TipoCliente, MetodoPago, TipoPago, PagoRequest } from '../../models/venta';
import { ClienteModalComponent } from '../cliente/cliente-modal/cliente-modal';

interface ProductoEnVenta {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatTooltipModule, MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule
  ],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {
  // --- Búsqueda y Listas ---
  terminoBusqueda: string = '';
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  isLoadingProductos: boolean = false;
  productosEnVenta: ProductoEnVenta[] = [];

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  clienteSeleccionado: Cliente | null = null;
  busquedaCliente: string = '';
  mostrarListaClientes: boolean = false;
  isLoadingClientes: boolean = false;

  // Cuentas Bancarias
  cuentas: CuentaBancaria[] = [];

  // --- Formulario de Venta ---
  nombreCliente: string = '';
  tipoCliente: TipoCliente = TipoCliente.COMUN;
  fechaVenta: Date = new Date();
  
  // VARIABLES DE PAGO
  tipoPago: TipoPago = TipoPago.CONTADO;
  
  // LISTA DE PAGOS Y OBJETO TEMPORAL
  listaPagos: PagoRequest[] = [];
  
  pagoActual: PagoRequest = {
    metodoPago: MetodoPago.EFECTIVO,
    monto: 0,
    moneda: 'PEN',
    cuentaBancariaId: undefined,
    referencia: ''
  };

  // Crédito
  numeroCuotas: number = 1;
  montoCuota: number = 0;     
  saldoPendiente: number = 0; 
  totalPagadoAcumulado: number = 0;

  notas: string = '';

  // --- Datos de Emisión ---
  tipoDocumento: string = 'FACTURA';
  numeroDocumento: string = '';

  tiposDocumento = [
    { value: 'FACTURA', label: 'Factura' },
    { value: 'BOLETA', label: 'Boleta' },
    { value: 'NOTA', label: 'Nota de Venta' }
  ];

  // --- Configuración de Moneda VENTA ---
  moneda: string = 'PEN';
  tipoCambio: number = 3.80;
  
  // --- Totales ---
  subtotal: number = 0;
  igv: number = 0;
  total: number = 0;
  isSaving: boolean = false;

  metodosPagoDisponibles = [
    { value: MetodoPago.EFECTIVO, label: 'Efectivo' },
    { value: MetodoPago.TARJETA, label: 'Tarjeta' },
    { value: MetodoPago.TRANSFERENCIA, label: 'Transferencia' },
    { value: MetodoPago.YAPE, label: 'Yape' },
    { value: MetodoPago.PLIN, label: 'Plin' }
  ];
  
  public eTipoPago = TipoPago;

  // --- Edición ---
  esEdicion: boolean = false;
  ventaId: number | null = null;

  constructor(
    private ventaService: VentaService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private cuentaService: CuentaBancariaService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.isLoadingProductos = true;
    this.cuentaService.listarActivas().subscribe(data => this.cuentas = data);

    const cargaProductos$ = this.productoService.listarProductosActivos();
    const cargaClientes$ = this.clienteService.listarClientesActivos();

    forkJoin([cargaProductos$, cargaClientes$]).subscribe({
      next: ([listaProductos, listaClientes]) => {
        this.productos = listaProductos;
        this.productosFiltrados = listaProductos;
        this.clientes = listaClientes;

        // Verificar si estamos editando
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
          this.ventaId = +idParam;
          this.esEdicion = true;
          this.cargarDatosVenta(this.ventaId);
        } else {
          this.isLoadingProductos = false;
          this.pagoActual.moneda = this.moneda;
        }
      },
      error: (err) => {
        console.error('Error cargando datos base:', err);
        this.isLoadingProductos = false;
        this.mostrarNotificacion('Error cargando datos iniciales', 'error');
      }
    });
  }

  // --- MÉTODOS DE CARGA ---
  cargarDatosVenta(id: number): void {
    this.isLoadingProductos = true;
    this.ventaService.obtenerVenta(id).subscribe({
      next: (venta: any) => {
        let idCliente = venta.clienteId || (venta.cliente ? venta.cliente.id : null);
        const clienteEncontrado = this.clientes.find(c => String(c.id) === String(idCliente));
        if (clienteEncontrado) this.seleccionarCliente(clienteEncontrado);
        else if (venta.nombreCliente) {
          this.nombreCliente = venta.nombreCliente;
          this.clienteSeleccionado = { id: idCliente || 0, nombreCompleto: venta.nombreCliente } as any;
        }

        this.fechaVenta = new Date(venta.fechaVenta);
        this.notas = venta.notas || '';
        this.moneda = venta.moneda || 'PEN';
        this.tipoCambio = venta.tipoCambio || 3.80;
        this.tipoDocumento = venta.tipoDocumento || 'FACTURA';
        this.numeroDocumento = venta.numeroDocumento || '';
        
        this.tipoPago = venta.tipoPago || TipoPago.CONTADO;
        this.numeroCuotas = venta.numeroCuotas || 1;

        if (venta.pagos && venta.pagos.length > 0) {
            this.listaPagos = venta.pagos.map((p: any) => ({
                metodoPago: p.metodoPago,
                monto: p.monto,
                moneda: p.moneda,
                cuentaBancariaId: p.cuentaDestinoId || (p.cuentaDestino ? p.cuentaDestino.id : undefined),
                referencia: p.referencia
            }));
        }

        if (venta.detalles) {
          this.productosEnVenta = venta.detalles.map((detalle: any) => {
            const productoCatalogo = this.productos.find(p => String(p.id) === String(detalle.productoId));
            const productoReal = productoCatalogo || detalle.producto || {
              id: detalle.productoId, nombre: 'No Disponible', codigo: '???', precioVenta: 0, stockActual: 0, moneda: 'PEN'
            };
            return {
              producto: productoReal,
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario,
              descuento: detalle.descuento || 0,
              subtotal: 0
            };
          });
          this.productosEnVenta.forEach(item => this.calcularSubtotalProducto(item));
          this.calcularTotales(); 
        }
        this.isLoadingProductos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingProductos = false;
        this.mostrarNotificacion('Error cargando la venta', 'error');
      }
    });
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'warning' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: [`snackbar-${tipo}`],
      verticalPosition: 'bottom'
    });
  }

  // --- CLIENTE Y MODALES ---
  abrirNuevoCliente(): void {
    const dialogRef = this.dialog.open(ClienteModalComponent, { width: '700px', disableClose: true, data: { cliente: null } });
    dialogRef.afterClosed().subscribe(nuevoCliente => {
      if (nuevoCliente) {
        this.clientes.push(nuevoCliente);
        this.seleccionarCliente(nuevoCliente);
      }
    });
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.busquedaCliente = `${cliente.nombreCompleto} - ${cliente.numeroDocumento}`;
    this.nombreCliente = cliente.nombreCompleto;
    this.mostrarListaClientes = false;
  }
  
  limpiarCliente(): void { this.clienteSeleccionado = null; this.busquedaCliente = ''; this.nombreCliente = ''; }
  buscarClientes(): void { 
    if (!this.busquedaCliente.trim()) { this.clientesFiltrados = []; this.mostrarListaClientes = false; return; }
    const termino = this.busquedaCliente.toLowerCase();
    this.clientesFiltrados = this.clientes.filter(c =>
      c.nombreCompleto.toLowerCase().includes(termino) || c.numeroDocumento?.toLowerCase().includes(termino)
    );
    this.mostrarListaClientes = this.clientesFiltrados.length > 0;
  } 

  // --- LÓGICA MONEDA ---
  cambiarMoneda(nuevaMoneda: string) {
    this.moneda = nuevaMoneda;
    this.pagoActual.moneda = nuevaMoneda;
    this.recalcularTodoElCarrito();
  }

  onTipoCambioChange() {
    if (this.tipoCambio <= 0) this.tipoCambio = 1;
    this.recalcularTodoElCarrito();
  }

  private recalcularTodoElCarrito() {
    this.productosEnVenta.forEach(item => {
      item.precioUnitario = this.convertirPrecio(item.producto);
      this.calcularSubtotalProducto(item);
    });
    this.calcularTotales();
  }

  private convertirPrecio(producto: Producto): number {
    let precioOriginal = producto.precioVenta ?? 0;
    if (producto.moneda === 'USD' && this.moneda === 'PEN') {
      return Number((precioOriginal * this.tipoCambio).toFixed(2));
    } else if (producto.moneda === 'PEN' && this.moneda === 'USD') {
      return Number((precioOriginal / this.tipoCambio).toFixed(2));
    }
    return precioOriginal;
  }

  // --- GESTIÓN PRODUCTOS ---
  agregarProducto(producto: Producto): void {
     if (producto.stockActual <= 0) { this.mostrarNotificacion('Stock Agotado', 'error'); return; }
     
     const existe = this.productosEnVenta.find(p => p.producto.id === producto.id);
     if (existe) {
       if (existe.cantidad >= producto.stockActual) {
          this.mostrarNotificacion('Stock máximo alcanzado', 'warning'); return;
       }
       existe.cantidad++;
       this.calcularSubtotalProducto(existe);
     } else {
       const precioFinal = this.convertirPrecio(producto);
       this.productosEnVenta.push({
         producto: producto, cantidad: 1, precioUnitario: precioFinal, descuento: 0, subtotal: precioFinal
       });
     }
     this.calcularTotales();
     this.terminoBusqueda = '';
  }

  eliminarProducto(index: number): void {
    this.productosEnVenta.splice(index, 1);
    this.calcularTotales();
  }

  calcularSubtotalProducto(item: ProductoEnVenta): void {
    let subtotal = item.cantidad * item.precioUnitario;
    if (item.descuento > 0) subtotal -= (subtotal * (item.descuento / 100));
    item.subtotal = Number(subtotal.toFixed(2));
  }
  
  onCantidadChange(item: ProductoEnVenta) { 
      if(item.cantidad > item.producto.stockActual) item.cantidad = item.producto.stockActual;
      this.calcularSubtotalProducto(item); this.calcularTotales(); 
  }
  onPrecioChange(item: ProductoEnVenta) { this.calcularSubtotalProducto(item); this.calcularTotales(); }
  onDescuentoChange(item: ProductoEnVenta) { this.calcularSubtotalProducto(item); this.calcularTotales(); }
  buscarProductos() { 
    if (!this.terminoBusqueda.trim()) { this.productosFiltrados = this.productos; return; }
    const termino = this.terminoBusqueda.toLowerCase();
    this.productosFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(termino) || p.codigo.toLowerCase().includes(termino)
    );
  }

  // ============================================
  // ✅ GESTIÓN DE PAGOS MÚLTIPLES
  // ============================================

  esPagoDigital(metodo: MetodoPago): boolean {
    return [MetodoPago.YAPE, MetodoPago.PLIN, MetodoPago.TRANSFERENCIA, MetodoPago.TARJETA].includes(metodo);
  }

  agregarPagoALista(): void {
    if (this.pagoActual.monto <= 0) {
      this.mostrarNotificacion('El monto debe ser mayor a 0', 'warning');
      return;
    }
    if (this.esPagoDigital(this.pagoActual.metodoPago) && !this.pagoActual.cuentaBancariaId) {
      this.mostrarNotificacion('Seleccione la cuenta de destino', 'warning');
      return;
    }

    this.listaPagos.push({ ...this.pagoActual });

    this.pagoActual.monto = 0;
    this.pagoActual.referencia = '';
    this.calcularTotales();
  }

  eliminarPagoDeLista(index: number): void {
    this.listaPagos.splice(index, 1);
    this.calcularTotales();
  }

  calcularTotalPagadoAcumulado(): number {
    let total = 0;
    for (const p of this.listaPagos) {
      if (p.moneda === this.moneda) {
        total += p.monto;
      } else {
        if (this.moneda === 'PEN' && p.moneda === 'USD') {
          total += (p.monto * this.tipoCambio);
        } else if (this.moneda === 'USD' && p.moneda === 'PEN') {
          total += (p.monto / this.tipoCambio);
        }
      }
    }
    return Number(total.toFixed(2));
  }

  // ============================================
  // CÁLCULO DE TOTALES Y CRÉDITO
  // ============================================

  calcularTotales(): void {
    this.total = Number(this.productosEnVenta.reduce((sum, p) => sum + p.subtotal, 0).toFixed(2));
    this.subtotal = Number((this.total / 1.18).toFixed(2));
    this.igv = Number((this.total - this.subtotal).toFixed(2));
    
    this.totalPagadoAcumulado = this.calcularTotalPagadoAcumulado();

    if (this.tipoPago === TipoPago.CREDITO) {
        this.saldoPendiente = Number((this.total - this.totalPagadoAcumulado).toFixed(2));
        if (this.saldoPendiente < 0) this.saldoPendiente = 0;

        if (this.numeroCuotas > 0 && this.saldoPendiente > 0) {
            this.montoCuota = Number((this.saldoPendiente / this.numeroCuotas).toFixed(2));
        } else {
            this.montoCuota = 0;
        }
    } else {
        this.saldoPendiente = 0;
        this.montoCuota = 0;
    }
  }

  // ✅ AQUÍ ESTÁ EL MÉTODO QUE FALTABA
  calcularCredito(): void {
    this.calcularTotales();
  }

  onTipoPagoChange() {
    this.numeroCuotas = 1;
    this.calcularTotales();
  }

  // --- ACCIONES FINALES ---

  prepararRequest(): VentaRequest {
    return {
      fechaVenta: this.fechaVenta,
      clienteId: this.clienteSeleccionado?.id,
      nombreCliente: this.nombreCliente,
      tipoCliente: this.tipoCliente,
      tipoPago: this.tipoPago,
      pagos: this.listaPagos,
      numeroCuotas: this.tipoPago === TipoPago.CREDITO ? this.numeroCuotas : 0,
      moneda: this.moneda,
      tipoCambio: this.tipoCambio,
      tipoDocumento: this.tipoDocumento,
      numeroDocumento: this.numeroDocumento,
      notas: this.notas,
      detalles: this.productosEnVenta.map(p => ({
        productoId: p.producto.id,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
        descuento: p.descuento
      }))
    };
  }

  completarVenta(): void {
    if (this.productosEnVenta.length === 0 || !this.clienteSeleccionado) return;
    
    if (this.listaPagos.length === 0) {
         this.mostrarNotificacion('Debe agregar al menos un pago', 'warning');
         return;
    }

    if (this.tipoPago === TipoPago.CONTADO) {
        if (this.totalPagadoAcumulado < (this.total - 0.10)) {
            const falta = (this.total - this.totalPagadoAcumulado).toFixed(2);
            this.mostrarNotificacion(`Pago incompleto. Faltan ${falta} ${this.moneda}`, 'error');
            return;
        }
    }

    if (!confirm('¿Estás seguro de emitir esta venta?')) return;

    this.isSaving = true;
    const request = this.prepararRequest();

    const observer = {
        next: () => {
            this.mostrarNotificacion('✅ Venta registrada exitosamente', 'success');
            this.isSaving = false;
            this.router.navigate(['/ventas/lista']);
        },
        error: (err: any) => {
            this.isSaving = false;
            const msg = err.error?.message || 'Error al procesar venta';
            this.mostrarNotificacion(msg, 'error');
        }
    };

    if (this.esEdicion && this.ventaId) {
      this.ventaService.actualizarVenta(this.ventaId, request).subscribe(observer);
    } else {
      this.ventaService.crearVenta(request).subscribe(observer);
    }
  }

  guardarComoBorrador(): void {
    if (this.productosEnVenta.length === 0) return;
    this.isSaving = true;
    const request = this.prepararRequest();

    const observer = {
        next: () => {
            this.mostrarNotificacion('✅ Borrador guardado', 'success');
            this.isSaving = false;
            if(!this.esEdicion) this.limpiarFormulario();
        },
        error: () => { this.isSaving = false; this.mostrarNotificacion('Error al guardar borrador', 'error'); }
    };

    if (this.esEdicion && this.ventaId) {
       this.ventaService.actualizarVenta(this.ventaId, request).subscribe(observer);
    } else {
       this.ventaService.guardarBorrador(request).subscribe(observer);
    }
  }

  limpiarFormulario(): void {
    this.productosEnVenta = [];
    this.listaPagos = [];
    this.clienteSeleccionado = null;
    this.busquedaCliente = '';
    this.total = 0;
    this.subtotal = 0;
    this.igv = 0;
    this.totalPagadoAcumulado = 0;
    this.tipoPago = TipoPago.CONTADO;
    this.notas = '';
    this.numeroDocumento = '';
  }
}