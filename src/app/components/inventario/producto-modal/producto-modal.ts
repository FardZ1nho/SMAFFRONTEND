import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductoService } from '../../../services/producto-service';
import { CategoriaService } from '../../../services/categoria-service';
import { AlmacenService } from '../../../services/almacen-service';
import { ProductoAlmacenService } from '../../../services/producto-almacen-service';
import { ProductoRequest } from '../../../models/producto';
import { Categoria } from '../../../models/categoria';
import { Almacen } from '../../../models/almacen';

interface StockPorAlmacen {
  almacenId: number;
  almacenNombre: string;
  almacenCodigo: string;
  stock: number;
  ubicacionFisica?: string;
  stockMinimo?: number;
}

@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    FormsModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './producto-modal.html',
  styleUrls: ['./producto-modal.css']
})
export class ProductoModalComponent implements OnInit {
  productoForm!: FormGroup;
  categorias: Categoria[] = [];
  almacenes: Almacen[] = [];
  stockPorAlmacenes: StockPorAlmacen[] = [];
  
  isLoading = false;
  isSaving = false;
  esEdicion = false;
  productoId: number | null = null;
  
  imagenPreview: string | null = null;
  almacenSeleccionado: number | null = null;
  stockAAgregar: number = 0;
  ubicacionFisicaAAgregar: string = '';
  
  monedas = [
    { codigo: 'USD', nombre: 'Dólar ($)', simbolo: '$' },
    { codigo: 'PEN', nombre: 'Sol (S/)', simbolo: 'S/' },
    { codigo: 'EUR', nombre: 'Euro (€)', simbolo: '€' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private almacenService: AlmacenService,
    private productoAlmacenService: ProductoAlmacenService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // 1. Inicializar formulario vacío
    this.inicializarFormulario();

    // 2. Determinar modo SÍNCRONAMENTE para evitar NG0100
    if (this.data && (this.data.modo === 'editar' || this.data.producto)) {
      this.esEdicion = true;
      this.productoId = this.data.producto?.id;
      console.log('✏️ Modo Edición detectado. ID:', this.productoId);
      
      // 3. Cargar datos del producto INMEDIATAMENTE
      if (this.data.producto) {
        this.cargarDatosProducto(this.data.producto);
      }
    }

    // 4. Cargar catálogos y stock (Asíncrono)
    this.cargarDatosAsincronos();
  }

  inicializarFormulario(): void {
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      codigo: [''],
      idCategoria: [null, Validators.required],
      descripcion: [''],
      stockMinimo: [5, [Validators.required, Validators.min(0)]],
      moneda: ['USD', Validators.required],
      precioChina: [null, [Validators.min(0)]],
      costoTotal: [null, [Validators.min(0)]],
      precioVenta: [null, [Validators.min(0)]],
      unidadMedida: ['unidad']
    });
  }

  cargarDatosProducto(producto: any): void {
    // Mapeo seguro de la categoría
    const categoriaId = producto.categoria?.id || producto.idCategoria;

    this.productoForm.patchValue({
      nombre: producto.nombre,
      codigo: producto.codigo,
      idCategoria: categoriaId,
      descripcion: producto.descripcion,
      stockMinimo: producto.stockMinimo,
      moneda: producto.moneda || 'USD',
      precioChina: producto.precioChina,
      costoTotal: producto.costoTotal,
      precioVenta: producto.precioVenta,
      unidadMedida: producto.unidadMedida || 'unidad'
    });
  }

  cargarDatosAsincronos(): void {
    // No bloqueamos con isLoading = true globalmente para evitar parpadeos
    // o bloqueos si solo fallan los catálogos.
    
    // Cargar Categorías
    this.categoriaService.listarCategoriasActivas().subscribe({
      next: (data) => {
        this.categorias = data;
        // Si ya tenemos un valor en el form, verificar que exista en la lista (opcional)
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error categorías', err)
    });

    // Cargar Almacenes
    this.almacenService.listarAlmacenesActivos().subscribe({
      next: (data) => {
        this.almacenes = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error almacenes', err)
    });

    // Si es edición, cargar stock
    if (this.esEdicion && this.productoId) {
      this.productoAlmacenService.listarUbicacionesPorProducto(this.productoId).subscribe({
        next: (ubicaciones) => {
          this.stockPorAlmacenes = ubicaciones.map(u => ({
            almacenId: u.almacenId,
            almacenNombre: u.almacenNombre,
            almacenCodigo: u.almacenCodigo,
            stock: u.stock,
            ubicacionFisica: u.ubicacionFisica,
            stockMinimo: u.stockMinimo
          }));
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error stock', err)
      });
    }
  }

  // --- MÉTODOS DE STOCK Y GUARDADO (Mismos que antes) ---
  
  agregarStockAlmacen(): void {
    if (!this.almacenSeleccionado) {
      alert('Selecciona un almacén'); return;
    }
    if (this.stockAAgregar < 0) {
      alert('Stock inválido'); return;
    }

    const indice = this.stockPorAlmacenes.findIndex(s => s.almacenId === this.almacenSeleccionado);
    const info = this.almacenes.find(a => a.id === this.almacenSeleccionado);

    if (!info) return;

    if (indice >= 0) {
      if (confirm('El almacén ya existe. ¿Actualizar cantidad?')) {
        this.stockPorAlmacenes[indice].stock = this.stockAAgregar;
        if (this.ubicacionFisicaAAgregar) this.stockPorAlmacenes[indice].ubicacionFisica = this.ubicacionFisicaAAgregar;
      }
    } else {
      this.stockPorAlmacenes.push({
        almacenId: info.id!,
        almacenNombre: info.nombre,
        almacenCodigo: info.codigo,
        stock: this.stockAAgregar,
        ubicacionFisica: this.ubicacionFisicaAAgregar
      });
    }
    
    this.almacenSeleccionado = null;
    this.stockAAgregar = 0;
    this.ubicacionFisicaAAgregar = '';
  }

  eliminarStockAlmacen(i: number) {
    this.stockPorAlmacenes.splice(i, 1);
  }

  get stockTotal() {
    return this.stockPorAlmacenes.reduce((acc, curr) => acc + curr.stock, 0);
  }

  guardarProducto(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    // Validación de stock: En creación es obligatorio, en edición opcional (si no se toca)
    if (!this.esEdicion && this.stockPorAlmacenes.length === 0) {
      alert('Asigna al menos un almacén');
      return;
    }

    this.isSaving = true;
    const val = this.productoForm.value;
    
    const request: ProductoRequest = {
      nombre: val.nombre,
      codigo: val.codigo,
      idCategoria: val.idCategoria,
      descripcion: val.descripcion,
      stockMinimo: val.stockMinimo,
      moneda: val.moneda,
      precioChina: val.precioChina,
      costoTotal: val.costoTotal,
      precioVenta: val.precioVenta,
      unidadMedida: val.unidadMedida
    };

    if (this.esEdicion && this.productoId) {
      // ACTUALIZAR
      this.productoService.actualizarProducto(this.productoId, request).subscribe({
        next: () => this.procesarStocks(this.productoId!),
        error: (e) => {
          this.isSaving = false;
          alert('Error al actualizar: ' + (e.error?.message || e.message));
        }
      });
    } else {
      // CREAR
      this.productoService.crearProducto(request).subscribe({
        next: (p) => this.procesarStocks(p.id),
        error: (e) => {
          this.isSaving = false;
          alert('Error al crear: ' + (e.error?.message || e.message));
        }
      });
    }
  }

  procesarStocks(idProd: number) {
    if (this.stockPorAlmacenes.length === 0) {
      this.isSaving = false;
      this.dialogRef.close(true);
      return;
    }

    const promesas = this.stockPorAlmacenes.map(s => 
      this.productoAlmacenService.asignarProductoAAlmacen({
        productoId: idProd,
        almacenId: s.almacenId,
        stock: s.stock,
        ubicacionFisica: s.ubicacionFisica,
        stockMinimo: s.stockMinimo || 0,
        activo: true
      }).toPromise()
    );

    Promise.all(promesas)
      .then(() => {
        this.isSaving = false;
        this.dialogRef.close(true);
        alert(this.esEdicion ? 'Producto actualizado' : 'Producto creado');
      })
      .catch(() => {
        this.isSaving = false;
        this.dialogRef.close(true);
        alert('Producto guardado pero hubo error en stocks');
      });
  }

  cancelar() { this.dialogRef.close(); }

  // Getters
  get nombre() { return this.productoForm.get('nombre'); }
  get idCategoria() { return this.productoForm.get('idCategoria'); }
  get stockMinimo() { return this.productoForm.get('stockMinimo'); }
  get moneda() { return this.productoForm.get('moneda'); }
}