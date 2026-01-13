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
import { ActivatedRoute, Router } from '@angular/router'; // ← Agregar Router
import { VentaService } from '../../services/venta-service';
import { ProductoService } from '../../services/producto-service';
import { ClienteService } from '../../services/cliente-service';
import { Producto } from '../../models/producto';
import { Cliente } from '../../models/cliente';
import { VentaRequest, TipoCliente, MetodoPago } from '../../models/venta';
import { forkJoin } from 'rxjs'; // 👈 IMPORTANTE


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
    MatTooltipModule, MatProgressSpinnerModule
  ],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {
  // Búsqueda y Listas
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

  // Formulario de Venta
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

  // ⭐ CONFIGURACIÓN DE MONEDA Y TIPO DE CAMBIO
  moneda: string = 'PEN';
  tipoCambio: number = 3.80;

  // Pago Mixto
  pagoEfectivo: number = 0;
  pagoTransferencia: number = 0;

  // Totales
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

  esEdicion: boolean = false;
  ventaId: number | null = null;
  titulo: string = 'Nueva Venta'; // Para cambiar el título en el HTML dinámicamente

  constructor(
    private ventaService: VentaService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute, // ✅ AGREGAR ESTO para leer la URL
    private cdr: ChangeDetectorRef // 👈 AGREGAR ESTO
  ) { }

  ngOnInit(): void {
  this.isLoadingProductos = true; // Bloqueamos la UI mientras carga todo

  // 1. Preparamos las peticiones base (Productos y Clientes)
  const cargaProductos$ = this.productoService.listarProductosActivos();
  const cargaClientes$ = this.clienteService.listarClientesActivos();

  // 2. Usamos forkJoin para esperar a ambas
  forkJoin([cargaProductos$, cargaClientes$]).subscribe({
    next: ([listaProductos, listaClientes]) => {
      
      // Guardamos los datos en las variables del componente
      this.productos = listaProductos;
      this.productosFiltrados = listaProductos;
      
      this.clientes = listaClientes;
      // No filtramos clientes aún

      console.log('✅ Base de datos (Productos y Clientes) cargada correctamente');

      // 3. AHORA SÍ es seguro verificar si hay una ID en la URL
      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        this.ventaId = +idParam;
        this.esEdicion = true;
        this.titulo = `Editando Venta #${this.ventaId}`;
        
        // Llamamos a cargar la venta, sabiendo que los productos YA existen
        this.cargarDatosVenta(this.ventaId);
      } else {
        this.isLoadingProductos = false; // Si es venta nueva, terminamos de cargar aquí
      }
    },
    error: (err) => {
      console.error('Error cargando datos base:', err);
      this.isLoadingProductos = false;
    }
  });
}

  // --- MÉTODOS DE CARGA DE DATOS ---
  cargarProductos(): void {
    this.isLoadingProductos = true;
    this.productoService.listarProductosActivos().subscribe({
      next: (data) => {
        this.productos = data;
        this.productosFiltrados = data;
        this.isLoadingProductos = false;
      },
      error: (error) => {
        console.error('Error al cargar productos', error);
        this.isLoadingProductos = false;
      }
    });
  }
  cargarDatosVenta(id: number): void {
  // Nota: isLoadingProductos suele venir en true desde el ngOnInit, 
  // pero lo forzamos aquí por si acaso se llama desde otro lado.
  this.isLoadingProductos = true;

  this.ventaService.obtenerVenta(id).subscribe({
    next: (venta: any) => {
      console.log('📦 DATOS VENTA RECIBIDOS:', venta);

      // =========================================================
      // 1. RECUPERACIÓN INTELIGENTE DEL CLIENTE (Plan A, B, C)
      // =========================================================
      let idClienteBusqueda = venta.clienteId;
      
      // Si el ID no viene suelto, búscalo dentro del objeto cliente
      if (!idClienteBusqueda && venta.cliente) {
        idClienteBusqueda = venta.cliente.id;
      }

      console.log(`🔎 Buscando Cliente ID: ${idClienteBusqueda} en lista de ${this.clientes.length} clientes`);

      // PLAN A: Buscar en lista local (Comparando como String para evitar error "5" vs 5)
      const clienteEncontrado = this.clientes.find(c => String(c.id) === String(idClienteBusqueda));

      if (clienteEncontrado) {
        console.log('✅ PLAN A: Cliente encontrado en lista local');
        // Esto rellena busquedaCliente, nombreCliente y clienteSeleccionado automáticamente
        this.seleccionarCliente(clienteEncontrado); 
      } 
      else if (venta.cliente) {
        console.log('⚠️ PLAN B: Usando objeto cliente de la venta (posiblemente inactivo)');
        this.clienteSeleccionado = venta.cliente;
        this.nombreCliente = venta.cliente.nombreCompleto || venta.nombreCliente;
        // IMPORTANTE: Rellenar el input visual manualmente
        this.busquedaCliente = `${this.nombreCliente} (Histórico)`;
      } 
      else if (venta.nombreCliente) {
         console.log('⚠️ PLAN C: Solo nombre disponible');
         this.nombreCliente = venta.nombreCliente;
         this.busquedaCliente = venta.nombreCliente;
         // Crear dummy para evitar errores de validación
         this.clienteSeleccionado = { 
            id: idClienteBusqueda || 0, 
            nombreCompleto: venta.nombreCliente, 
            numeroDocumento: '---' 
         } as any;
      }

      // =========================================================
      // 2. DATOS GENERALES
      // =========================================================
      this.fechaVenta = new Date(venta.fechaVenta);
      this.metodoPago = venta.metodoPago;
      this.notas = venta.notas || '';
      this.moneda = venta.moneda || 'PEN'; // Si tu backend guarda la moneda, úsala aquí
      this.tipoCambio = venta.tipoCambio || 3.80; // Igual con el TC
      
      if (venta.tipoDocumento) {
        this.tipoDocumento = venta.tipoDocumento;
      }

      // =========================================================
      // 3. RECUPERACIÓN DE PRODUCTOS
      // =========================================================
      if (venta.detalles) {
        this.productosEnVenta = venta.detalles.map((detalle: any) => {
          // Buscar en catálogo local (seguro contra string/number)
          const productoCatalogo = this.productos.find(p => String(p.id) === String(detalle.productoId));
          
          // Prioridad: 1. Catálogo Local -> 2. Objeto en Detalle -> 3. Dummy
          const productoReal = productoCatalogo || detalle.producto || {
             id: detalle.productoId, 
             nombre: 'Producto No Disponible', 
             codigo: '???', 
             precioVenta: 0, 
             stockActual: 0,
             moneda: 'PEN'
          };

          return {
            producto: productoReal,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            descuento: detalle.descuento || 0,
            subtotal: 0 // Se recalcula abajo
          };
        });

        // Recalcular montos matemáticos
        this.productosEnVenta.forEach(item => this.calcularSubtotalProducto(item));
        this.calcularTotales();
      }

      // =========================================================
      // 4. FINALIZACIÓN Y REFRESCO DE PANTALLA (CRÍTICO)
      // =========================================================
      this.isLoadingProductos = false;
      
      // 🔥 ESTO SOLUCIONA QUE TENGAS QUE DAR CLIC PARA VER LOS DATOS
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('❌ Error cargando venta:', err);
      this.isLoadingProductos = false;
      this.cdr.detectChanges(); // Refrescar para quitar el spinner
      // Opcional: Mostrar alerta
    }
  });
}
  cargarClientes(): void {
    this.isLoadingClientes = true;
    this.clienteService.listarClientesActivos().subscribe({
      next: (data) => {
        this.clientes = data;
        this.isLoadingClientes = false;
      },
      error: (error) => {
        console.error('Error al cargar clientes', error);
        this.isLoadingClientes = false;
      }
    });
  }

  // --- LÓGICA DE MONEDA Y TIPO DE CAMBIO ---
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
    // Si el producto está en USD y la venta en PEN
    if (producto.moneda === 'USD' && this.moneda === 'PEN') {
      return Number((precioOriginal * this.tipoCambio).toFixed(2));
    }
    // Si el producto está en PEN y la venta en USD
    else if (producto.moneda === 'PEN' && this.moneda === 'USD') {
      return Number((precioOriginal / this.tipoCambio).toFixed(2));
    }
    return precioOriginal;
  }

  // --- GESTIÓN DEL CARRITO ---
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

  // --- BÚSQUEDAS FILTRADAS ---
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

  // --- PAGO MIXTO ---
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

  // --- ACCIONES FINALES ---
  completarVenta(): void {
  if (this.productosEnVenta.length === 0 || !this.clienteSeleccionado) return;
  
  // Confirmación opcional (puedes quitarla si quieres que sea directo)
  if (!confirm('¿Estás seguro de emitir esta venta?')) return;

  this.isSaving = true;
  const request = this.prepararRequest();

  // Lógica para Venta NUEVA o EDICIÓN de borrador
  if (this.esEdicion && this.ventaId) {
      // CASO A: Estamos editando un borrador para completarlo
      this.ventaService.actualizarVenta(this.ventaId, request).subscribe({
          next: () => {
              // Una vez guardados los datos, completamos
              this.ventaService.completarVenta(this.ventaId!).subscribe({
                  next: () => {
                      alert('✅ Venta completada exitosamente');
                      this.isSaving = false;
                      // 👇 REDIRECCIÓN AQUÍ
                      this.router.navigate(['/ventas/lista']); 
                  },
                  error: (err) => {
                      this.isSaving = false; 
                      console.error(err);
                      alert('Error al completar la venta');
                  }
              });
          },
          error: () => {
              this.isSaving = false;
              alert('Error al actualizar datos previos a completar');
          }
      });
  } else {
      // CASO B: Es una venta nueva directa
      this.ventaService.crearVenta(request).subscribe({
        next: () => {
          alert('✅ Venta registrada exitosamente');
          this.isSaving = false;
          // 👇 REDIRECCIÓN AQUÍ
          this.router.navigate(['/ventas/lista']); 
        },
        error: (err) => {
            console.error(err);
            this.isSaving = false;
            alert('Error al registrar la venta. Revisa los datos.');
        }
      });
  }
}

  // 👇 HELPER PARA NO REPETIR CÓDIGO
 private prepararRequest(): any {
      // Validamos si es mixto para enviar los datos, sino enviamos null o 0
      const esMixto = this.metodoPago === 'MIXTO';

      return {
        fechaVenta: this.fechaVenta,
        clienteId: this.clienteSeleccionado?.id,
        nombreCliente: this.nombreCliente,
        tipoCliente: this.tipoCliente, // Asegúrate de tener esta variable o quítala si no la usas
        
        // ✅ AQUÍ ESTÁ EL CAMBIO IMPORTANTE:
        metodoPago: this.metodoPago,
        pagoEfectivo: esMixto ? this.pagoEfectivo : 0,
        pagoTransferencia: esMixto ? this.pagoTransferencia : 0,
        
        moneda: this.moneda,
        tipoCambio: this.tipoCambio,
        notas: this.notas,
        
        detalles: this.productosEnVenta.map(p => ({
            productoId: p.producto.id,
            cantidad: p.cantidad,
            precioUnitario: p.precioUnitario,
            descuento: p.descuento
        }))
      };
  }

  guardarComoBorrador(): void {
    if (this.productosEnVenta.length === 0) return;
    this.isSaving = true;

    // Preparamos el objeto Request (reutilizable)
    const request = this.prepararRequest();

    if (this.esEdicion && this.ventaId) {
      // 🔵 MODO EDICIÓN: ACTUALIZAR (PUT)
      this.ventaService.actualizarVenta(this.ventaId, request).subscribe({
        next: () => {
          alert('✅ Borrador actualizado correctamente');
          this.router.navigate(['/ventas']); // Volver a la lista
        },
        error: () => {
          this.isSaving = false;
          alert('Error al actualizar');
        }
      });
    } else {
      // 🟢 MODO CREACIÓN: NUEVO (POST)
      this.ventaService.guardarBorrador(request).subscribe({
        next: () => {
          alert('✅ Borrador guardado exitosamente');
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