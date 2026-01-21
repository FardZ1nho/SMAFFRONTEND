import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ✅ IMPORTS NECESARIOS PARA RXJS (Solución a errores de lógica reactiva)
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { ProductoService } from '../../../services/producto-service';
import { CategoriaService } from '../../../services/categoria-service';
import { ProductoRequest } from '../../../models/producto';
import { Categoria } from '../../../models/categoria';

@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './producto-modal.html',
  styleUrls: ['./producto-modal.css']
})
export class ProductoModalComponent implements OnInit {
  productoForm!: FormGroup;
  categorias: Categoria[] = [];
  
  isLoading = false;
  isSaving = false;
  esEdicion = false;
  productoId: number | null = null;
  
  // Variable para controlar la vista (PRODUCTO por defecto)
  tipoSeleccionado: 'PRODUCTO' | 'SERVICIO' = 'PRODUCTO';

  // ✅ VARIABLES PARA DUPLICADOS
  coincidencias: any[] = [];
  buscandoCoincidencias = false;

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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // 1. Inicializar el formulario base
    this.inicializarFormulario();

    // 2. Cargar Categorías
    this.categoriaService.listarCategoriasActivas().subscribe({
      next: (data) => {
        this.categorias = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando categorías', err)
    });

    // 3. Verificar si es Edición
    if (this.data && (this.data.modo === 'editar' || this.data.producto)) {
      this.esEdicion = true;
      this.productoId = this.data.producto?.id;
      if (this.data.producto) {
        this.cargarDatosProducto(this.data.producto);
      }
    }

    // ✅ 4. ACTIVAR DETECCIÓN DE DUPLICADOS
    this.detectarDuplicados();
  }

  inicializarFormulario(): void {
    this.productoForm = this.fb.group({
      tipo: ['PRODUCTO'], 
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      codigo: [''],
      idCategoria: [null, Validators.required],
      descripcion: [''],
      stockMinimo: [5, [Validators.required, Validators.min(0)]],
      
      // Precios
      moneda: ['USD', Validators.required],
      precioChina: [null],
      costoTotal: [null],
      precioVenta: [null, [Validators.required, Validators.min(0)]],
      unidadMedida: ['unidad']
    });
  }

  // ✅ FUNCIÓN DE BÚSQUEDA REACTIVA
  detectarDuplicados(): void {
    const nombreControl = this.productoForm.get('nombre');
    
    if(!nombreControl) return;

    nombreControl.valueChanges.pipe(
      debounceTime(400), 
      distinctUntilChanged(), 
      switchMap(nombre => {
        if (!nombre || nombre.length < 3) {
          return of([]); 
        }
        this.buscandoCoincidencias = true;
        // Ahora sí existe el método en el servicio
        return this.productoService.buscarProductosPorNombre(nombre);
      })
    ).subscribe({
      next: (resultados) => {
        // ✅ SOLUCIÓN AL ERROR TS7006: Tipar explícitamente 'p' como 'any'
        if (this.esEdicion && this.productoId) {
          this.coincidencias = resultados.filter((p: any) => p.id !== this.productoId);
        } else {
          this.coincidencias = resultados;
        }
        this.buscandoCoincidencias = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscandoCoincidencias = false;
        this.coincidencias = [];
      }
    });
  }

  usarCoincidencia(prod: any): void {
    if(confirm(`¿Ya existe "${prod.nombre}". ¿Deseas editar este registro en su lugar?`)) {
      this.esEdicion = true;
      this.productoId = prod.id;
      this.cargarDatosProducto(prod);
      this.coincidencias = []; 
    }
  }

  cargarDatosProducto(producto: any): void {
    const tipo = producto.tipo || 'PRODUCTO';
    this.tipoSeleccionado = tipo;

    const categoriaId = producto.categoria?.id || producto.idCategoria;

    this.productoForm.patchValue({
      tipo: tipo,
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
    
    this.cambiarTipo(tipo, false); 
  }

  cambiarTipo(tipo: 'PRODUCTO' | 'SERVICIO', actualizarValores: boolean = true) {
    this.tipoSeleccionado = tipo;
    this.productoForm.patchValue({ tipo: tipo });

    if (tipo === 'SERVICIO') {
      // === MODO SERVICIO ===
      const catServicio = this.categorias.find(c => 
          c.nombre.toUpperCase().includes('SERVIC')
      );
      
      const idCategoriaDefault = catServicio ? catServicio.id : (this.categorias[0]?.id || null);

      if (actualizarValores) {
        this.productoForm.patchValue({
          stockMinimo: 0,
          precioChina: 0,
          costoTotal: 0,
          idCategoria: idCategoriaDefault, 
          unidadMedida: 'Global', 
          codigo: '' 
        });
      }
      
      this.productoForm.get('stockMinimo')?.clearValidators();
      this.productoForm.get('stockMinimo')?.updateValueAndValidity();

    } else {
      // === MODO PRODUCTO ===
      this.productoForm.get('stockMinimo')?.setValidators([Validators.required, Validators.min(0)]);
      this.productoForm.get('stockMinimo')?.updateValueAndValidity();
      
      if (actualizarValores) {
         this.productoForm.patchValue({
             unidadMedida: 'Unidad',
             idCategoria: null 
         });
      }
    }
  }

  guardarProducto(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const val = this.productoForm.value;
    
    const request: ProductoRequest = {
      tipo: this.tipoSeleccionado, 
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

    const operacion = (this.esEdicion && this.productoId)
      ? this.productoService.actualizarProducto(this.productoId, request)
      : this.productoService.crearProducto(request);

    operacion.subscribe({
      next: () => this.finalizarGuardado(this.esEdicion ? 'Actualizado correctamente' : 'Registrado correctamente'),
      error: (e) => this.manejarError(e)
    });
  }

  finalizarGuardado(mensaje: string) {
    this.isSaving = false;
    this.dialogRef.close(true);
  }

  manejarError(e: any) {
    this.isSaving = false;
    console.error(e);
    alert('Error: ' + (e.error?.message || 'Error desconocido'));
  }

  cancelar() { this.dialogRef.close(); }

  get nombre() { return this.productoForm.get('nombre'); }
}