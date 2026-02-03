import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

// Servicios
import { MovimientoService } from '../../../services/movimiento-service'; 
import { ProductoService } from '../../../services/producto-service'; 
import { AlmacenService } from '../../../services/almacen-service'; 
import { ProductoAlmacenService } from '../../../services/producto-almacen-service';

// Modelos
import { TrasladoRequest } from '../../../models/movimiento';
import { Producto } from '../../../models/producto';
import { Almacen } from '../../../models/almacen';

@Component({
  selector: 'app-traslado-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIcon, MatProgressSpinner],
  templateUrl: './traslado-form.html',
  styleUrls: ['./traslado-form.css']
})
export class TrasladoFormComponent implements OnInit {

  // Datos Maestros
  productos: Producto[] = [];
  almacenes: Almacen[] = [];

  // Búsqueda
  busquedaProducto: string = '';
  productosSugeridos: Producto[] = [];
  mostrarResultados: boolean = false;

  // Formulario
  almacenOrigenId: number | null = null;
  almacenDestinoId: number | null = null;
  productoId: number | null = null;
  cantidad: number = 1;
  motivo: string = '';

  // Estados
  cargando: boolean = false;
  guardando: boolean = false;
  verificandoStock: boolean = false;
  errorMensaje: string = '';
  
  // Datos calculados
  productoSeleccionado: Producto | null = null;
  stockEnOrigen: number = 0;
  existeEnOrigen: boolean = true;

  constructor(
    private movimientoService: MovimientoService,
    private productoService: ProductoService,
    private almacenService: AlmacenService,
    private productoAlmacenService: ProductoAlmacenService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.cargarDatos();
    }, 0);
  }

  cargarDatos(): void {
    this.cargando = true;
    
    const promesaAlmacenes = this.almacenService.listarAlmacenesActivos().toPromise();
    const promesaProductos = this.productoService.listarProductosActivos().toPromise();

    Promise.all([promesaAlmacenes, promesaProductos]).then(([almacenesData, productosData]) => {
      this.almacenes = almacenesData || [];
      this.productos = productosData || [];
      this.cargando = false;
      this.cdr.detectChanges(); 
    }).catch(err => {
      console.error('Error cargando datos:', err);
      this.errorMensaje = 'Error al cargar los datos iniciales.';
      this.cargando = false;
      this.cdr.detectChanges();
    });
  }

  // --- LÓGICA DE BÚSQUEDA INTELIGENTE ---
  buscarProducto(): void {
    const termino = this.busquedaProducto.toLowerCase().trim();
    if (termino.length > 0) {
      this.productosSugeridos = this.productos.filter(p => 
        p.nombre.toLowerCase().includes(termino) || 
        p.codigo.toLowerCase().includes(termino)
      ).slice(0, 6); // Limitamos a 6 resultados para no saturar
      this.mostrarResultados = true;
    } else {
      this.productosSugeridos = [];
      this.mostrarResultados = false;
    }
  }

  seleccionarProducto(producto: Producto): void {
    this.productoId = producto.id;
    this.productoSeleccionado = producto;
    
    // Reseteamos buscador
    this.busquedaProducto = '';
    this.mostrarResultados = false;
    
    // Verificamos stock
    this.verificarStockReal();
  }

  borrarSeleccionProducto(): void {
    this.productoId = null;
    this.productoSeleccionado = null;
    this.stockEnOrigen = 0;
    this.existeEnOrigen = true;
    this.cantidad = 1;
  }

  // --- LOGICA GENERAL ---

  onAlmacenOrigenChange(): void {
    this.verificarStockReal();
  }

  verificarStockReal(): void {
    if (!this.productoId || !this.almacenOrigenId) {
      this.stockEnOrigen = 0;
      return;
    }

    this.verificandoStock = true;
    this.errorMensaje = '';
    this.existeEnOrigen = true;

    this.productoAlmacenService.listarUbicacionesPorProducto(this.productoId).subscribe({
      next: (ubicaciones) => {
        const ubicacionOrigen = ubicaciones.find(u => u.almacenId === this.almacenOrigenId);
        
        if (ubicacionOrigen) {
          this.stockEnOrigen = ubicacionOrigen.stock;
          this.existeEnOrigen = true;
        } else {
          this.stockEnOrigen = 0;
          this.existeEnOrigen = false;
        }
        
        this.verificandoStock = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error verificando stock:', err);
        this.stockEnOrigen = 0;
        this.verificandoStock = false;
        this.cdr.detectChanges();
      }
    });
  }

  registrarTraslado(): void {
    if (!this.validarFormulario()) return;

    this.guardando = true;
    this.errorMensaje = '';

    const request: TrasladoRequest = {
      productoId: this.productoId!,
      almacenOrigenId: this.almacenOrigenId!,
      almacenDestinoId: this.almacenDestinoId!,
      cantidad: this.cantidad,
      motivo: this.motivo.trim() || undefined
    };

    this.movimientoService.registrarTraslado(request).subscribe({
      next: () => {
        this.guardando = false;
        alert('✅ Traslado realizado con éxito');
        this.router.navigate(['/movimientos']);
      },
      error: (error) => {
        this.guardando = false;
        console.error(error);
        this.errorMensaje = error.error?.message || 'Error al procesar el traslado.';
        this.cdr.detectChanges();
      }
    });
  }

  validarFormulario(): boolean {
    if (!this.almacenOrigenId || !this.almacenDestinoId || !this.productoId) {
      this.errorMensaje = 'Todos los campos de selección son obligatorios.';
      return false;
    }

    if (this.almacenOrigenId === this.almacenDestinoId) {
      this.errorMensaje = 'El origen y el destino no pueden ser el mismo almacén.';
      return false;
    }

    if (!this.existeEnOrigen) {
      this.errorMensaje = 'El producto seleccionado NO existe en el almacén de origen.';
      return false;
    }

    if (this.cantidad > this.stockEnOrigen) {
      this.errorMensaje = `Stock insuficiente en origen. Disponible: ${this.stockEnOrigen}`;
      return false;
    }

    if (this.cantidad <= 0) {
      this.errorMensaje = 'La cantidad debe ser mayor a 0.';
      return false;
    }

    return true;
  }

  cancelar(): void {
    this.router.navigate(['/movimientos']);
  }

  limpiarError(): void {
    this.errorMensaje = '';
  }

  obtenerNombreAlmacen(id: number): string {
    return this.almacenes.find(a => a.id === id)?.nombre || '';
  }

  get almacenesDestino(): Almacen[] {
    if (this.almacenOrigenId) {
      return this.almacenes.filter(a => a.id !== this.almacenOrigenId);
    }
    return this.almacenes;
  }
}