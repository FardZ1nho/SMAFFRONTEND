// src/app/components/ventas/ventas.component.ts

import { Component, OnInit } from '@angular/core';
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

import { VentaService } from '../../services/venta-service'; 
import { ProductoService } from '../../services/producto-service';
import { ClienteService } from '../../services/cliente-service';
import { Producto } from '../../models/producto';
import { Cliente } from '../../models/cliente';
import { 
  VentaRequest, 
  TipoCliente, 
  MetodoPago 
} from '../../models/venta';

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
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {
  // Búsqueda de productos
  terminoBusqueda: string = '';
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  isLoadingProductos: boolean = false;

  // Productos en la venta
  productosEnVenta: ProductoEnVenta[] = [];

  // CLIENTES
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  clienteSeleccionado: Cliente | null = null;
  busquedaCliente: string = '';
  mostrarListaClientes: boolean = false;
  isLoadingClientes: boolean = false;

  // Información del cliente
  nombreCliente: string = '';
  tipoCliente: TipoCliente = TipoCliente.COMUN;
  fechaVenta: Date = new Date();
  metodoPago: MetodoPago = MetodoPago.EFECTIVO;
  notas: string = '';

  // ⭐ PAGO MIXTO
  pagoEfectivo: number = 0;
  pagoTransferencia: number = 0;

  // Totales
  subtotal: number = 0;
  igv: number = 0;
  total: number = 0;

  // Estados
  isSaving: boolean = false;

  // Opciones (⭐ ELIMINADOS tiposCliente)
  metodosPago = [
    { value: MetodoPago.EFECTIVO, label: 'Efectivo' },
    { value: MetodoPago.TARJETA, label: 'Tarjeta' },
    { value: MetodoPago.TRANSFERENCIA, label: 'Transferencia' },
    { value: MetodoPago.YAPE, label: 'Yape' },
    { value: MetodoPago.PLIN, label: 'Plin' },
    { value: MetodoPago.MIXTO, label: 'Mixto (Efectivo + Transferencia)' } // ⭐ AGREGAR
  ];

  constructor(
    private ventaService: VentaService,
    private productoService: ProductoService,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarClientes();
  }

  // ⭐ MÉTODO PARA DETECTAR SI ES PAGO MIXTO
  esPagoMixto(): boolean {
    return this.metodoPago === MetodoPago.MIXTO;
  }

  // ⭐ VALIDAR PAGO MIXTO
  validarPagoMixto(): boolean {
    if (!this.esPagoMixto()) return true;
    
    const totalPagado = this.pagoEfectivo + this.pagoTransferencia;
    return totalPagado === this.total;
  }

  // MÉTODOS DE CLIENTES
  cargarClientes(): void {
    this.isLoadingClientes = true;
    this.clienteService.listarClientesActivos().subscribe({
      next: (data) => {
        console.log('✅ Clientes cargados:', data);
        this.clientes = data;
        this.clientesFiltrados = data;
        this.isLoadingClientes = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar clientes:', error);
        this.isLoadingClientes = false;
      }
    });
  }

  buscarClientes(): void {
    if (!this.busquedaCliente.trim()) {
      this.clientesFiltrados = [];
      this.mostrarListaClientes = false;
      return;
    }

    const termino = this.busquedaCliente.toLowerCase();
    this.clientesFiltrados = this.clientes.filter(cliente =>
      cliente.nombreCompleto.toLowerCase().includes(termino) ||
      (cliente.numeroDocumento && cliente.numeroDocumento.toLowerCase().includes(termino)) ||
      (cliente.email && cliente.email.toLowerCase().includes(termino))
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
    this.mostrarListaClientes = false;
  }

  cargarProductos(): void {
    this.isLoadingProductos = true;
    this.productoService.listarProductosActivos().subscribe({
      next: (data) => {
        this.productos = data;
        this.productosFiltrados = data;
        this.isLoadingProductos = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.isLoadingProductos = false;
        alert('Error al cargar los productos');
      }
    });
  }

  buscarProductos(): void {
    if (!this.terminoBusqueda.trim()) {
      this.productosFiltrados = this.productos;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase();
    this.productosFiltrados = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(termino) ||
      producto.codigo.toLowerCase().includes(termino)
    );
  }

  agregarProducto(producto: Producto): void {
    const existe = this.productosEnVenta.find(p => p.producto.id === producto.id);
    
    if (existe) {
      existe.cantidad++;
      this.calcularSubtotalProducto(existe);
    } else {
      const precioBase = producto.precioVenta ?? 0;
      
      const nuevoProducto: ProductoEnVenta = {
        producto: producto,
        cantidad: 1,
        precioUnitario: precioBase,
        descuento: 0,
        subtotal: precioBase
      };
      this.productosEnVenta.push(nuevoProducto);
    }

    this.calcularTotales();
    this.terminoBusqueda = '';
    this.productosFiltrados = this.productos;
  }

  eliminarProducto(index: number): void {
    this.productosEnVenta.splice(index, 1);
    this.calcularTotales();
  }

  onCantidadChange(productoEnVenta: ProductoEnVenta): void {
    if (productoEnVenta.cantidad < 1) {
      productoEnVenta.cantidad = 1;
    }
    if (productoEnVenta.cantidad > productoEnVenta.producto.stockActual) {
      alert(`Stock insuficiente. Disponible: ${productoEnVenta.producto.stockActual}`);
      productoEnVenta.cantidad = productoEnVenta.producto.stockActual;
    }
    this.calcularSubtotalProducto(productoEnVenta);
    this.calcularTotales();
  }

  onPrecioChange(productoEnVenta: ProductoEnVenta): void {
    if (productoEnVenta.precioUnitario < 0) {
      productoEnVenta.precioUnitario = 0;
    }
    this.calcularSubtotalProducto(productoEnVenta);
    this.calcularTotales();
  }

  onDescuentoChange(productoEnVenta: ProductoEnVenta): void {
    if (productoEnVenta.descuento < 0) {
      productoEnVenta.descuento = 0;
    }
    if (productoEnVenta.descuento > 100) {
      productoEnVenta.descuento = 100;
    }
    this.calcularSubtotalProducto(productoEnVenta);
    this.calcularTotales();
  }

  calcularSubtotalProducto(productoEnVenta: ProductoEnVenta): void {
    let subtotal = productoEnVenta.cantidad * productoEnVenta.precioUnitario;
    
    if (productoEnVenta.descuento > 0) {
      const descuentoMonto = subtotal * (productoEnVenta.descuento / 100);
      subtotal -= descuentoMonto;
    }
    
    productoEnVenta.subtotal = Number(subtotal.toFixed(2));
  }

  calcularTotales(): void {
    this.total = this.productosEnVenta.reduce((sum, p) => sum + p.subtotal, 0);
    this.subtotal = this.total / 1.18;
    this.igv = this.total - this.subtotal;

    this.total = Number(this.total.toFixed(2));
    this.subtotal = Number(this.subtotal.toFixed(2));
    this.igv = Number(this.igv.toFixed(2));
  }

  completarVenta(): void {
    // ⭐ VALIDAR QUE HAYA PRODUCTOS
    if (this.productosEnVenta.length === 0) {
      alert('❌ Debe agregar al menos un producto');
      return;
    }

    // ⭐ VALIDAR QUE HAYA CLIENTE SELECCIONADO
    if (!this.clienteSeleccionado) {
      alert('❌ Debe seleccionar un cliente para completar la venta');
      return;
    }

    // ⭐ VALIDAR PAGO MIXTO
    if (this.esPagoMixto() && !this.validarPagoMixto()) {
      const totalPagado = this.pagoEfectivo + this.pagoTransferencia;
      alert(`❌ El pago mixto no cuadra\nTotal a pagar: S/ ${this.total.toFixed(2)}\nTotal pagado: S/ ${totalPagado.toFixed(2)}\nDiferencia: S/ ${(this.total - totalPagado).toFixed(2)}`);
      return;
    }

    this.isSaving = true;

    const ventaRequest: VentaRequest = {
      fechaVenta: this.fechaVenta,
      clienteId: this.clienteSeleccionado.id,
      nombreCliente: this.nombreCliente,
      tipoCliente: this.tipoCliente,
      metodoPago: this.metodoPago,
      notas: this.notas || undefined,
      detalles: this.productosEnVenta.map(p => ({
        productoId: p.producto.id,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
        descuento: p.descuento
      }))
    };

    // ⭐ AGREGAR INFO DE PAGO MIXTO EN LAS NOTAS
    if (this.esPagoMixto()) {
      const notasPagoMixto = `\nPago Mixto:\n- Efectivo: S/ ${this.pagoEfectivo.toFixed(2)}\n- Transferencia: S/ ${this.pagoTransferencia.toFixed(2)}`;
      ventaRequest.notas = (ventaRequest.notas || '') + notasPagoMixto;
    }

    console.log('📤 Enviando venta:', ventaRequest);

    this.ventaService.crearVenta(ventaRequest).subscribe({
      next: (response) => {
        console.log('✅ Venta creada:', response);
        alert(`✅ Venta completada exitosamente\nCódigo: ${response.codigo}\nTotal: S/ ${response.total.toFixed(2)}`);
        this.limpiarFormulario();
        this.isSaving = false;
      },
      error: (error) => {
        console.error('❌ Error al crear venta:', error);
        this.isSaving = false;
        
        let mensaje = 'Error al completar la venta';
        if (error.error?.message) {
          mensaje += ': ' + error.error.message;
        }
        alert(mensaje);
      }
    });
  }

  guardarComoBorrador(): void {
    if (this.productosEnVenta.length === 0) {
      alert('❌ Debe agregar al menos un producto');
      return;
    }

    // ⭐ NO SE REQUIERE CLIENTE PARA BORRADOR
    this.isSaving = true;

    const ventaRequest: VentaRequest = {
      fechaVenta: this.fechaVenta,
      clienteId: this.clienteSeleccionado?.id,
      nombreCliente: this.nombreCliente || undefined,
      tipoCliente: this.tipoCliente,
      metodoPago: this.metodoPago,
      notas: this.notas || undefined,
      detalles: this.productosEnVenta.map(p => ({
        productoId: p.producto.id,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
        descuento: p.descuento
      }))
    };

    this.ventaService.guardarBorrador(ventaRequest).subscribe({
      next: (response) => {
        console.log('✅ Borrador guardado:', response);
        alert(`✅ Borrador guardado exitosamente\nCódigo: ${response.codigo}`);
        this.limpiarFormulario();
        this.isSaving = false;
      },
      error: (error) => {
        console.error('❌ Error al guardar borrador:', error);
        this.isSaving = false;
        alert('Error al guardar el borrador');
      }
    });
  }

  limpiarFormulario(): void {
    this.productosEnVenta = [];
    this.clienteSeleccionado = null;
    this.busquedaCliente = '';
    this.nombreCliente = '';
    this.tipoCliente = TipoCliente.COMUN;
    this.fechaVenta = new Date();
    this.metodoPago = MetodoPago.EFECTIVO;
    this.notas = '';
    this.pagoEfectivo = 0; // ⭐ AGREGAR
    this.pagoTransferencia = 0; // ⭐ AGREGAR
    this.subtotal = 0;
    this.igv = 0;
    this.total = 0;
    this.terminoBusqueda = '';
    this.productosFiltrados = this.productos;
  }
}