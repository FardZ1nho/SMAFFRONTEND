// src/app/components/movimientos/traslado-form/traslado-form.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MovimientoService } from '../../../services/movimiento-service'; 
import { ProductoService } from '../../../services/producto-service'; 
import { AlmacenService } from '../../../services/almacen-service'; 
import { TrasladoRequest } from '../../../models/movimiento';
import { Producto } from '../../../models/producto';
import { Almacen } from '../../../models/almacen';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-traslado-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIcon, MatProgressSpinner],
  templateUrl: './traslado-form.html',
  styleUrls: ['./traslado-form.css']
})
export class TrasladoFormComponent implements OnInit {

  // Listas para selects
  productos: Producto[] = [];
  almacenes: Almacen[] = [];

  // Campos del formulario
  productoId: number | null = null;
  almacenOrigenId: number | null = null;
  almacenDestinoId: number | null = null;
  cantidad: number = 1;
  motivo: string = '';

  // Estados
  cargando: boolean = false;
  guardando: boolean = false;
  errorMensaje: string = '';
  stockDisponible: number = 0;
  productoSeleccionado: Producto | null = null;

  constructor(
    private movimientoService: MovimientoService,
    private productoService: ProductoService,
    private almacenService: AlmacenService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.cargarDatos();
    }, 0);
  }

  cargarDatos(): void {
    this.cargando = true;
    this.errorMensaje = '';
    let productosLoaded = false;
    let almacenesLoaded = false;

    // Cargar productos activos
    this.productoService.listarProductosActivos().subscribe({
      next: (productos) => {
        this.productos = productos;
        console.log('Productos cargados:', productos);
        productosLoaded = true;
        if (productosLoaded && almacenesLoaded) {
          this.cargando = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.errorMensaje = 'Error al cargar productos';
        this.cargando = false;
      }
    });

    // Cargar almacenes activos
    this.almacenService.listarAlmacenesActivos().subscribe({
      next: (almacenes) => {
        this.almacenes = almacenes;
        console.log('Almacenes cargados:', almacenes);
        almacenesLoaded = true;
        if (productosLoaded && almacenesLoaded) {
          this.cargando = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar almacenes:', err);
        this.errorMensaje = 'Error al cargar almacenes';
        this.cargando = false;
      }
    });
  }

  onProductoChange(): void {
    if (this.productoId) {
      this.productoSeleccionado = this.productos.find(p => p.id === this.productoId) || null;
      console.log('Producto seleccionado:', this.productoSeleccionado);
      this.onAlmacenOrigenChange();
    } else {
      this.productoSeleccionado = null;
      this.stockDisponible = 0;
    }
  }

  obtenerNombreAlmacen(almacenId: number | null): string {
    if (!almacenId) return '';
    const almacen = this.almacenes.find(a => a.id === almacenId);
    return almacen ? almacen.nombre : '';
  }

  onAlmacenOrigenChange(): void {
    if (this.productoSeleccionado) {
      this.stockDisponible = this.productoSeleccionado.stockActual || 0;
    }
  }

  validarFormulario(): boolean {
    this.errorMensaje = '';

    if (!this.productoId) {
      this.errorMensaje = 'Debes seleccionar un producto';
      return false;
    }

    if (!this.almacenOrigenId) {
      this.errorMensaje = 'Debes seleccionar un almacén de origen';
      return false;
    }

    if (!this.almacenDestinoId) {
      this.errorMensaje = 'Debes seleccionar un almacén de destino';
      return false;
    }

    if (this.almacenOrigenId === this.almacenDestinoId) {
      this.errorMensaje = 'El almacén de origen y destino no pueden ser el mismo';
      return false;
    }

    if (this.cantidad <= 0) {
      this.errorMensaje = 'La cantidad debe ser mayor a 0';
      return false;
    }

    return true;
  }

  registrarTraslado(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.guardando = true;
    this.errorMensaje = '';

    const request: TrasladoRequest = {
      productoId: this.productoId!,
      almacenOrigenId: this.almacenOrigenId!,
      almacenDestinoId: this.almacenDestinoId!,
      cantidad: this.cantidad,
      motivo: this.motivo.trim() || undefined
    };

    console.log('Enviando traslado:', request);

    this.movimientoService.registrarTraslado(request).subscribe({
      next: (response) => {
        console.log('Traslado registrado:', response);
        this.guardando = false;
        alert('✅ Traslado registrado exitosamente');
        this.router.navigate(['/movimientos']);
      },
      error: (error) => {
        console.error('Error al registrar traslado:', error);
        this.guardando = false;

        if (error.error?.error) {
          this.errorMensaje = error.error.error;
        } else if (error.status === 400) {
          this.errorMensaje = 'Datos inválidos. Verifica la información';
        } else if (error.status === 0) {
          this.errorMensaje = 'No se puede conectar con el servidor';
        } else {
          this.errorMensaje = 'Error al registrar el traslado';
        }
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/movimientos']);
  }

  limpiarError(): void {
    this.errorMensaje = '';
  }

  get almacenesDestino(): Almacen[] {
    if (this.almacenOrigenId) {
      return this.almacenes.filter(a => a.id !== this.almacenOrigenId);
    }
    return this.almacenes;
  }
}