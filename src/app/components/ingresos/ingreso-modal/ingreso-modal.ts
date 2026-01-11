import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { ProductoService } from '../../../services/producto-service';
import { IngresoService } from '../../../services/ingreso-service';
import { ProveedorService } from '../../../services/proveedor-service';
import { AlmacenService } from '../../../services/almacen-service'; // ✅ NUEVO
import { ProductoParaIngreso, IngresoRequest } from '../../../models/ingreso';
import { Proveedor } from '../../../models/proveedor';
import { Almacen } from '../../../models/almacen'; // ✅ NUEVO

@Component({
  selector: 'app-ingreso-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ingreso-modal.html',
  styleUrls: ['./ingreso-modal.css']
})
export class IngresoModalComponent implements OnInit {
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() registroExitoso = new EventEmitter<void>();

  busqueda: string = '';
  productosFiltrados: any[] = [];
  productosAgregados: ProductoParaIngreso[] = [];
  proveedores: Proveedor[] = [];
  almacenes: Almacen[] = []; // ✅ NUEVO
  guardando: boolean = false;

  constructor(
    private productoService: ProductoService,
    private ingresoService: IngresoService,
    private proveedorService: ProveedorService,
    private almacenService: AlmacenService // ✅ NUEVO
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarAlmacenes(); // ✅ NUEVO
  }

  cargarProveedores(): void {
    this.proveedorService.listarProveedoresActivos().subscribe({
      next: (proveedores) => {
        console.log('✅ Proveedores cargados:', proveedores);
        this.proveedores = proveedores;
      },
      error: (error) => {
        console.error('❌ Error al cargar proveedores:', error);
        this.proveedores = [];
      }
    });
  }

  // ✅ NUEVO: Cargar almacenes activos
  cargarAlmacenes(): void {
    this.almacenService.listarAlmacenesActivos().subscribe({
      next: (almacenes) => {
        console.log('✅ Almacenes cargados:', almacenes);
        this.almacenes = almacenes;
      },
      error: (error) => {
        console.error('❌ Error al cargar almacenes:', error);
        this.almacenes = [];
      }
    });
  }

  buscarProducto(): void {
    console.log('🔍 Buscando:', this.busqueda);
    
    if (this.busqueda.length > 1) {
      this.productoService.buscarProductos(this.busqueda).subscribe({
        next: (productos) => {
          console.log('✅ Productos encontrados:', productos);
          this.productosFiltrados = productos;
        },
        error: (error) => {
          console.error('❌ Error buscando productos:', error);
          this.productosFiltrados = [];
        }
      });
    } else {
      this.productosFiltrados = [];
    }
  }

  agregarProducto(producto: any): void {
    console.log('➕ Agregando producto:', producto);
    
    // ✅ MODIFICADO: Ahora permite agregar el mismo producto múltiples veces
    // (para diferentes almacenes)
    this.productosAgregados.push({
      producto: producto,
      almacenId: null, // ✅ NUEVO
      almacenNombre: '', // ✅ NUEVO
      cantidad: 1,
      proveedorNombre: ''
    });
    
    console.log('✅ Producto agregado. Total:', this.productosAgregados.length);

    this.busqueda = '';
    this.productosFiltrados = [];
  }

  eliminarProducto(index: number): void {
    this.productosAgregados.splice(index, 1);
  }

  incrementarCantidad(index: number): void {
    this.productosAgregados[index].cantidad++;
  }

  decrementarCantidad(index: number): void {
    if (this.productosAgregados[index].cantidad > 1) {
      this.productosAgregados[index].cantidad--;
    }
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.productosFiltrados = [];
  }

  calcularTotalUnidades(): number {
    return this.productosAgregados.reduce((total, item) => total + item.cantidad, 0);
  }

  onProveedorChange(index: number, proveedorId: number | null): void {
    if (proveedorId) {
      const proveedor = this.proveedores.find(p => p.id === proveedorId);
      this.productosAgregados[index].proveedorNombre = proveedor?.nombre || '';
    } else {
      this.productosAgregados[index].proveedorNombre = '';
    }
  }

  // Método para contar almacenes únicos
getAlmacenesUnicos(): number {
  const almacenesUnicos = new Set(
    this.productosAgregados
      .filter(item => item.almacenId)
      .map(item => item.almacenId)
  );
  return almacenesUnicos.size;
}

  // ✅ NUEVO: Manejar cambio de almacén
  onAlmacenChange(index: number, almacenId: number | null): void {
    if (almacenId) {
      const almacen = this.almacenes.find(a => a.id === almacenId);
      this.productosAgregados[index].almacenId = almacenId;
      this.productosAgregados[index].almacenNombre = almacen?.nombre || '';
    } else {
      this.productosAgregados[index].almacenId = null;
      this.productosAgregados[index].almacenNombre = '';
    }
  }

  getProveedorIdByNombre(nombre: string): number | null {
    const proveedor = this.proveedores.find(p => p.nombre === nombre);
    return proveedor ? proveedor.id : null;
  }

  guardarTodos(): void {
    if (this.productosAgregados.length === 0) {
      alert('No hay productos agregados');
      return;
    }

    // ✅ VALIDAR: Todos deben tener almacén seleccionado
    const sinAlmacen = this.productosAgregados.filter(item => !item.almacenId);
    if (sinAlmacen.length > 0) {
      alert('Todos los productos deben tener un almacén asignado');
      return;
    }

    console.log('💾 Guardando ingresos:', this.productosAgregados);
    this.guardando = true;

    // Crear array de requests
    const requests = this.productosAgregados.map(item => {
      const ingreso: IngresoRequest = {
        productoId: item.producto.id,
        almacenId: item.almacenId!, // ✅ NUEVO
        cantidad: item.cantidad,
        proveedor: item.proveedorNombre || '',
        observacion: '',
        fecha: undefined
      };
      return this.ingresoService.registrarIngreso(ingreso);
    });

    // Ejecutar todas las peticiones en paralelo
    forkJoin(requests).subscribe({
      next: (responses) => {
        console.log('✅ Todos los ingresos registrados:', responses);
        this.guardando = false;
        this.registroExitoso.emit();
      },
      error: (error) => {
        console.error('❌ Error al registrar ingresos:', error);
        this.guardando = false;
        alert('Error al registrar algunos ingresos. Revisa la consola.');
      }
    });
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }
}