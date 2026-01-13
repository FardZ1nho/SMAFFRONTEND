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
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { VentaService } from '../../services/venta-service';
import { ProductoService } from '../../services/producto-service';
import { ClienteService } from '../../services/cliente-service';
import { Producto } from '../../models/producto';
import { Cliente } from '../../models/cliente';
import { VentaRequest, TipoCliente, MetodoPago } from '../../models/venta';
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
    MatTooltipModule, MatProgressSpinnerModule, MatDialogModule
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

  // --- Formulario de Venta ---
  nombreCliente: string = '';
  tipoCliente: TipoCliente = TipoCliente.COMUN;
  fechaVenta: Date = new Date();
  metodoPago: MetodoPago = MetodoPago.EFECTIVO;
  notas: string = '';

  tipoDocumento: string = 'NOTA';
  tiposDocumento = [
    { value: 'NOTA', label: 'Nota de Venta' },
    { value: 'BOLETA', label: 'Boleta' },
    { value: 'FACTURA', label: 'Factura' }
  ];

  // --- Configuración de Moneda ---
  moneda: string = 'PEN';
  tipoCambio: number = 3.80;

  // --- Pago Mixto ---
  pagoEfectivo: number = 0;
  pagoTransferencia: number = 0;

  // --- Totales ---
  subtotal: number = 0;
  igv: number = 0;
  total: number = 0;
  isSaving: boolean = false;

  metodosPago = [
    { value: MetodoPago.EFECTIVO, label: 'Efectivo' },
    { value: MetodoPago.TARJETA, label: 'Tarjeta' },
    { value: MetodoPago.TRANSFERENCIA, label: 'Transferencia' },
    { value: MetodoPago.YAPE, label: 'Yape' },
    { value: MetodoPago.PLIN, label: 'Plin' },
    { value: MetodoPago.MIXTO, label: 'Mixto (Efectivo + Transferencia)' }
  ];

  // --- Edición de Borrador ---
  esEdicion: boolean = false;
  ventaId: number | null = null;

  constructor(
    private ventaService: VentaService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.isLoadingProductos = true;

    // 1. Carga optimizada: Productos y Clientes en paralelo
    const cargaProductos$ = this.productoService.listarProductosActivos();
    const cargaClientes$ = this.clienteService.listarClientesActivos();

    forkJoin([cargaProductos$, cargaClientes$]).subscribe({
      next: ([listaProductos, listaClientes]) => {
        this.productos = listaProductos;
        this.productosFiltrados = listaProductos;
        this.clientes = listaClientes;

        // 2. Verificar si estamos editando un borrador (ID en URL)
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
          this.ventaId = +idParam;
          this.esEdicion = true;
          this.cargarDatosVenta(this.ventaId);
        } else {
          this.isLoadingProductos = false;
        }
      },
      error: (err) => {
        console.error('Error cargando datos base:', err);
        this.isLoadingProductos = false;
      }
    });
  }

  // --- MÉTODOS DE CARGA ---
  cargarDatosVenta(id: number): void {
    this.isLoadingProductos = true;
    this.ventaService.obtenerVenta(id).subscribe({
      next: (venta: any) => {
        // Recuperar Cliente
        let idCliente = venta.clienteId || (venta.cliente ? venta.cliente.id : null);
        const clienteEncontrado = this.clientes.find(c => String(c.id) === String(idCliente));
        
        if (clienteEncontrado) {
          this.seleccionarCliente(clienteEncontrado);
        } else if (venta.nombreCliente) {
          this.nombreCliente = venta.nombreCliente;
          this.busquedaCliente = venta.nombreCliente;
          this.clienteSeleccionado = { id: idCliente || 0, nombreCompleto: venta.nombreCliente, numeroDocumento: '---' } as any;
        }

        // Datos Generales
        this.fechaVenta = new Date(venta.fechaVenta);
        this.metodoPago = venta.metodoPago;
        this.notas = venta.notas || '';
        this.moneda = venta.moneda || 'PEN';
        this.tipoCambio = venta.tipoCambio || 3.80;
        if (venta.tipoDocumento) this.tipoDocumento = venta.tipoDocumento;

        // Recuperar Productos
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
      error: () => this.isLoadingProductos = false
    });
  }

  // --- MODAL NUEVO CLIENTE (Tu nueva función) ---
  abrirNuevoCliente(): void {
    const dialogRef = this.dialog.open(ClienteModalComponent, {
      width: '700px',
      disableClose: true,
      data: { cliente: null } // null para modo creación
    });

    dialogRef.afterClosed().subscribe(nuevoCliente => {
      if (nuevoCliente) {
        // 1. Agregamos a la lista
        this.clientes.push(nuevoCliente);
        // 2. Lo seleccionamos automáticamente
        this.seleccionarCliente(nuevoCliente);
        this.cdr.detectChanges();
      }
    });
  }

  // --- LÓGICA MONEDA ---
  onTipoCambioChange() {
    if (this.tipoCambio <= 0) this.tipoCambio = 1;
    this.recalcularTodoElCarrito();
  }

  cambiarMoneda(nuevaMoneda: string) {
    this.moneda = nuevaMoneda;
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

  // --- GESTIÓN CARRITO ---
  agregarProducto(producto: Producto): void {
    const existe = this.productosEnVenta.find(p => p.producto.id === producto.id);
    if (existe) {
      existe.cantidad++;
      this.calcularSubtotalProducto(existe);
    } else {
      const precioFinal = this.convertirPrecio(producto);
      this.productosEnVenta.push({
        producto: producto,
        cantidad: 1,
        precioUnitario: precioFinal,
        descuento: 0,
        subtotal: precioFinal
      });
    }
    this.calcularTotales();
    this.terminoBusqueda = '';
  }

  eliminarProducto(index: number): void {
    this.productosEnVenta.splice(index, 1);
    this.calcularTotales();
  }

  // --- BÚSQUEDAS ---
  buscarProductos(): void {
    if (!this.terminoBusqueda.trim()) {
      this.productosFiltrados = this.productos;
      return;
    }
    const termino = this.terminoBusqueda.toLowerCase();
    this.productosFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(termino) || p.codigo.toLowerCase().includes(termino)
    );
  }

  buscarClientes(): void {
    if (!this.busquedaCliente.trim()) {
      this.clientesFiltrados = [];
      this.mostrarListaClientes = false;
      return;
    }
    const termino = this.busquedaCliente.toLowerCase();
    this.clientesFiltrados = this.clientes.filter(c =>
      c.nombreCompleto.toLowerCase().includes(termino) || c.numeroDocumento?.toLowerCase().includes(termino)
    );
    this.mostrarListaClientes = this.clientesFiltrados.length > 0;
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.busquedaCliente = `${cliente.nombreCompleto} - ${cliente.numeroDocumento}`;
    this.nombreCliente = cliente.nombreCompleto;
    this.mostrarListaClientes = false;
  }

  limpiarCliente(): void {
    this.clienteSeleccionado = null;
    this.busquedaCliente = '';
    this.nombreCliente = '';
  }

  // --- CÁLCULOS ---
  onCantidadChange(item: ProductoEnVenta): void {
    if (item.cantidad < 1) item.cantidad = 1;
    if (item.cantidad > item.producto.stockActual) item.cantidad = item.producto.stockActual;
    this.calcularSubtotalProducto(item);
    this.calcularTotales();
  }

  onPrecioChange(item: ProductoEnVenta): void {
    this.calcularSubtotalProducto(item);
    this.calcularTotales();
  }

  onDescuentoChange(item: ProductoEnVenta): void {
    this.calcularSubtotalProducto(item);
    this.calcularTotales();
  }

  calcularSubtotalProducto(item: ProductoEnVenta): void {
    let subtotal = item.cantidad * item.precioUnitario;
    if (item.descuento > 0) subtotal -= (subtotal * (item.descuento / 100));
    item.subtotal = Number(subtotal.toFixed(2));
  }

  calcularTotales(): void {
    this.total = Number(this.productosEnVenta.reduce((sum, p) => sum + p.subtotal, 0).toFixed(2));
    this.subtotal = Number((this.total / 1.18).toFixed(2));
    this.igv = Number((this.total - this.subtotal).toFixed(2));
    if (this.esPagoMixto()) this.validarMontoMixto('T');
  }

  validarMontoMixto(campo: 'E' | 'T') {
    if (campo === 'T') {
      if (this.pagoTransferencia > this.total) this.pagoTransferencia = this.total;
      this.pagoEfectivo = Number((this.total - this.pagoTransferencia).toFixed(2));
    } else {
      if (this.pagoEfectivo > this.total) this.pagoEfectivo = this.total;
      this.pagoTransferencia = Number((this.total - this.pagoEfectivo).toFixed(2));
    }
  }

  esPagoMixto(): boolean { return this.metodoPago === MetodoPago.MIXTO; }

  // --- PREPARAR DATOS (DRY) ---
  private prepararRequest(): any {
    const esMixto = this.metodoPago === 'MIXTO';
    return {
      fechaVenta: this.fechaVenta,
      clienteId: this.clienteSeleccionado?.id,
      nombreCliente: this.nombreCliente,
      tipoCliente: this.tipoCliente,
      metodoPago: this.metodoPago,
      pagoEfectivo: esMixto ? this.pagoEfectivo : 0,
      pagoTransferencia: esMixto ? this.pagoTransferencia : 0,
      moneda: this.moneda,
      tipoCambio: this.tipoCambio,
      notas: this.notas,
      tipoDocumento: this.tipoDocumento,
      detalles: this.productosEnVenta.map(p => ({
        productoId: p.producto.id,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
        descuento: p.descuento
      }))
    };
  }

  // --- ACCIONES FINALES ---
  completarVenta(): void {
    if (this.productosEnVenta.length === 0 || !this.clienteSeleccionado) return;
    if (!confirm('¿Estás seguro de emitir esta venta?')) return;

    this.isSaving = true;
    const request = this.prepararRequest();

    if (this.esEdicion && this.ventaId) {
      // Editar Borrador -> Completar
      this.ventaService.actualizarVenta(this.ventaId, request).subscribe({
        next: () => {
          this.ventaService.completarVenta(this.ventaId!).subscribe({
            next: () => {
              alert('✅ Venta completada exitosamente');
              this.isSaving = false;
              this.router.navigate(['/ventas/lista']);
            },
            error: () => { this.isSaving = false; alert('Error al completar'); }
          });
        },
        error: () => { this.isSaving = false; alert('Error al actualizar'); }
      });
    } else {
      // Venta Nueva
      this.ventaService.crearVenta(request).subscribe({
        next: () => {
          alert('✅ Venta registrada exitosamente');
          this.isSaving = false;
          this.router.navigate(['/ventas/lista']);
        },
        error: () => { this.isSaving = false; alert('Error al registrar venta'); }
      });
    }
  }

  guardarComoBorrador(): void {
    if (this.productosEnVenta.length === 0) return;
    this.isSaving = true;
    const request = this.prepararRequest();

    if (this.esEdicion && this.ventaId) {
      // Actualizar Borrador
      this.ventaService.actualizarVenta(this.ventaId, request).subscribe({
        next: () => {
          alert('✅ Borrador actualizado');
          this.router.navigate(['/ventas/lista']);
        },
        error: () => { this.isSaving = false; alert('Error al actualizar'); }
      });
    } else {
      // Crear Borrador
      this.ventaService.guardarBorrador(request).subscribe({
        next: () => {
          alert('✅ Borrador guardado');
          this.limpiarFormulario();
          this.isSaving = false;
        },
        error: () => this.isSaving = false
      });
    }
  }

  limpiarFormulario(): void {
    this.productosEnVenta = [];
    this.clienteSeleccionado = null;
    this.busquedaCliente = '';
    this.total = 0;
    this.subtotal = 0;
    this.igv = 0;
    this.pagoEfectivo = 0;
    this.pagoTransferencia = 0;
    this.notas = '';
    this.terminoBusqueda = '';
  }
}