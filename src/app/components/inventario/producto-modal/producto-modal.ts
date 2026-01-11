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
import { AlmacenService } from '../../../services/almacen-service'; // ✅ NUEVO
import { ProductoAlmacenService } from '../../../services/producto-almacen-service'; 
import { ProductoRequest } from '../../../models/producto';
import { Categoria } from '../../../models/categoria';
import { Almacen } from '../../../models/almacen'; // ✅ NUEVO

// ✅ NUEVO: Interface para manejar la asignación de stock temporal
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
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './producto-modal.html',
  styleUrls: ['./producto-modal.css']
})
export class ProductoModalComponent implements OnInit {
  productoForm!: FormGroup;
  categorias: Categoria[] = [];
  almacenes: Almacen[] = []; // ✅ NUEVO: Lista de almacenes disponibles
  stockPorAlmacenes: StockPorAlmacen[] = []; // ✅ NUEVO: Stock asignado por almacén
  
  isLoading = false;
  isSaving = false;
  mostrarNuevaCategoria = false;
  imagenPreview: string | null = null;
  
  // ✅ NUEVO: Para agregar stock a almacenes
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
    private almacenService: AlmacenService, // ✅ NUEVO
    private productoAlmacenService: ProductoAlmacenService, // ✅ NUEVO
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();

    setTimeout(() => {
      this.cargarCategorias();
      this.cargarAlmacenes(); // ✅ NUEVO
    }, 0);
  }

  inicializarFormulario(): void {
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      codigo: [''],
      idCategoria: ['', Validators.required],
      descripcion: [''],
      
      // ❌ ELIMINADOS: stockActual y ubicacionAlmacen
      // stockActual: [0, [Validators.required, Validators.min(0)]],
      // ubicacionAlmacen: [''],
      
      stockMinimo: [5, [Validators.required, Validators.min(0)]],

      // Precios
      moneda: ['USD', Validators.required],
      precioChina: [null, [Validators.min(0)]],
      costoTotal: [null, [Validators.min(0)]],
      precioVenta: [null, [Validators.min(0)]],

      unidadMedida: ['unidad']
    });
  }

  cargarCategorias(): void {
    this.isLoading = true;

    this.categoriaService.listarCategoriasActivas().subscribe({
      next: (data) => {
        console.log('✅ Categorías cargadas:', data);
        this.categorias = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
        this.categorias = [];
        this.isLoading = false;
        alert('No se pudieron cargar las categorías.');
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ NUEVO: Cargar almacenes activos
  cargarAlmacenes(): void {
    this.almacenService.listarAlmacenesActivos().subscribe({
      next: (data) => {
        console.log('✅ Almacenes cargados:', data);
        this.almacenes = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar almacenes:', error);
        this.almacenes = [];
        alert('No se pudieron cargar los almacenes.');
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ NUEVO: Agregar stock a un almacén
  agregarStockAlmacen(): void {
    if (!this.almacenSeleccionado) {
      alert('Selecciona un almacén');
      return;
    }

    if (this.stockAAgregar <= 0) {
      alert('El stock debe ser mayor a 0');
      return;
    }

    // Verificar si ya existe
    const yaExiste = this.stockPorAlmacenes.find(s => s.almacenId === this.almacenSeleccionado);
    if (yaExiste) {
      alert('Este almacén ya fue agregado. Elimínalo primero si quieres modificarlo.');
      return;
    }

    const almacen = this.almacenes.find(a => a.id === this.almacenSeleccionado);
    if (!almacen) return;

    this.stockPorAlmacenes.push({
      almacenId: almacen.id!,
      almacenNombre: almacen.nombre,
      almacenCodigo: almacen.codigo,
      stock: this.stockAAgregar,
      ubicacionFisica: this.ubicacionFisicaAAgregar || undefined
    });

    // Limpiar formulario temporal
    this.almacenSeleccionado = null;
    this.stockAAgregar = 0;
    this.ubicacionFisicaAAgregar = '';
    
    console.log('✅ Stock agregado:', this.stockPorAlmacenes);
  }

  // ✅ NUEVO: Eliminar stock de un almacén
  eliminarStockAlmacen(index: number): void {
    this.stockPorAlmacenes.splice(index, 1);
  }

  // ✅ NUEVO: Calcular stock total
  get stockTotal(): number {
    return this.stockPorAlmacenes.reduce((sum, s) => sum + s.stock, 0);
  }

  toggleNuevaCategoria(): void {
    this.mostrarNuevaCategoria = !this.mostrarNuevaCategoria;
  }

  crearNuevaCategoria(): void {
    console.log('Crear nueva categoría');
  }

  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  guardarProducto(): void {
    if (this.productoForm.invalid) {
      Object.keys(this.productoForm.controls).forEach(key => {
        this.productoForm.get(key)?.markAsTouched();
      });
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // ✅ VALIDAR: Debe tener al menos un almacén con stock
    if (this.stockPorAlmacenes.length === 0) {
      alert('Debes asignar el producto a al menos un almacén');
      return;
    }

    this.isSaving = true;
    const formValue = this.productoForm.value;

    console.log('📝 Formulario válido, enviando datos...');

    // ✅ Construir ProductoRequest SIN stockActual y ubicacionAlmacen
    const producto: ProductoRequest = {
      nombre: formValue.nombre.trim(),
      codigo: formValue.codigo?.trim() || undefined,
      descripcion: formValue.descripcion?.trim() || undefined,
      idCategoria: Number(formValue.idCategoria),
      stockMinimo: Number(formValue.stockMinimo) || 5,
      
      // Precios
      moneda: formValue.moneda || 'USD',
      precioChina: formValue.precioChina ? Number(formValue.precioChina) : undefined,
      costoTotal: formValue.costoTotal ? Number(formValue.costoTotal) : undefined,
      precioVenta: formValue.precioVenta ? Number(formValue.precioVenta) : undefined,
      
      unidadMedida: formValue.unidadMedida || 'unidad'
    };

    console.log('🚀 Producto a enviar:', producto);

    // ✅ PASO 1: Crear el producto
    this.productoService.crearProducto(producto).subscribe({
      next: (productoCreado) => {
        console.log('✅ Producto creado exitosamente:', productoCreado);
        
        // ✅ PASO 2: Asignar stock a cada almacén
        this.asignarStockAAlmacenes(productoCreado.id);
      },
      error: (error) => {
        console.error('❌ Error al crear producto:', error);
        this.isSaving = false;

        let mensajeError = 'Error al crear el producto. ';
        if (error.status === 400) {
          mensajeError += error.error?.message || 'Datos inválidos';
        } else {
          mensajeError += error.message || 'Error desconocido';
        }
        alert(mensajeError);
      }
    });
  }

  // ✅ NUEVO: Asignar stock a múltiples almacenes
  asignarStockAAlmacenes(productoId: number): void {
    let asignacionesCompletadas = 0;
    const totalAsignaciones = this.stockPorAlmacenes.length;

    this.stockPorAlmacenes.forEach(stockAlmacen => {
      this.productoAlmacenService.asignarProductoAAlmacen({
        productoId: productoId,
        almacenId: stockAlmacen.almacenId,
        stock: stockAlmacen.stock,
        ubicacionFisica: stockAlmacen.ubicacionFisica,
        stockMinimo: stockAlmacen.stockMinimo,
        activo: true
      }).subscribe({
        next: () => {
          asignacionesCompletadas++;
          console.log(`✅ Stock asignado a almacén ${stockAlmacen.almacenNombre}`);
          
          // Si todas las asignaciones fueron exitosas
          if (asignacionesCompletadas === totalAsignaciones) {
            this.isSaving = false;
            alert(`✅ Producto creado exitosamente con stock en ${totalAsignaciones} almacén(es)`);
            this.dialogRef.close(true);
          }
        },
        error: (error) => {
          console.error(`❌ Error al asignar stock a almacén ${stockAlmacen.almacenNombre}:`, error);
          asignacionesCompletadas++;
          
          // Continuar aunque falle uno
          if (asignacionesCompletadas === totalAsignaciones) {
            this.isSaving = false;
            alert('⚠️ Producto creado pero hubo errores al asignar stock a algunos almacenes');
            this.dialogRef.close(true);
          }
        }
      });
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  // Getters
  get nombre() { return this.productoForm.get('nombre'); }
  get codigo() { return this.productoForm.get('codigo'); }
  get idCategoria() { return this.productoForm.get('idCategoria'); }
  get stockMinimo() { return this.productoForm.get('stockMinimo'); }
  get moneda() { return this.productoForm.get('moneda'); }
  get precioChina() { return this.productoForm.get('precioChina'); }
  get costoTotal() { return this.productoForm.get('costoTotal'); }
  get precioVenta() { return this.productoForm.get('precioVenta'); }
}