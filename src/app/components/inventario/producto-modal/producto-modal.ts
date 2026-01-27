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
  
  // ✅ Control de tipo
  tipoSeleccionado: 'PRODUCTO' | 'SERVICIO' = 'PRODUCTO';
  tipoFijo: boolean = false; // Nueva variable para bloquear el selector

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
    this.inicializarFormulario();

    this.categoriaService.listarCategoriasActivas().subscribe({
      next: (data) => {
        this.categorias = data;
        this.cdr.detectChanges();
      }
    });

    // ✅ LÓGICA DE TIPO FIJO (Separación Productos/Servicios)
    if (this.data && this.data.tipoFijo) {
      this.tipoSeleccionado = this.data.tipoFijo;
      this.tipoFijo = true; // Bloquea el cambio manual
      this.cambiarTipo(this.tipoSeleccionado, true); // Forzar la configuración del formulario
    }

    if (this.data && (this.data.modo === 'editar' || this.data.producto)) {
      this.esEdicion = true;
      this.productoId = this.data.producto?.id;
      if (this.data.producto) {
        this.cargarDatosProducto(this.data.producto);
      }
    }

    this.detectarDuplicados();
  }

  inicializarFormulario(): void {
    this.productoForm = this.fb.group({
      tipo: [this.tipoSeleccionado], 
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      codigo: [''],
      idCategoria: [null, Validators.required],
      descripcion: [''],
      stockMinimo: [5], // Validadores dinámicos
      moneda: ['USD', Validators.required],
      precioChina: [null],
      costoTotal: [null],
      precioVenta: [null, [Validators.required, Validators.min(0)]],
      unidadMedida: ['Unidad']
    });
  }

  detectarDuplicados(): void {
    const nombreControl = this.productoForm.get('nombre');
    if(!nombreControl) return;

    nombreControl.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(), 
      switchMap(nombre => {
        if (!nombre || nombre.length < 3) return of([]);
        this.buscandoCoincidencias = true;
        return this.productoService.buscarProductosPorNombre(nombre);
      })
    ).subscribe({
      next: (resultados) => {
        // Filtrar también por tipo para que no sugiera servicios si creamos producto
        const filtrados = resultados.filter((p: any) => p.tipo === this.tipoSeleccionado);
        
        if (this.esEdicion && this.productoId) {
          this.coincidencias = filtrados.filter((p: any) => p.id !== this.productoId);
        } else {
          this.coincidencias = filtrados;
        }
        this.buscandoCoincidencias = false;
        this.cdr.detectChanges();
      },
      error: () => { this.buscandoCoincidencias = false; this.coincidencias = []; }
    });
  }

  usarCoincidencia(prod: any): void {
    if(confirm(`Ya existe "${prod.nombre}". ¿Deseas editar este registro en su lugar?`)) {
      this.esEdicion = true;
      this.productoId = prod.id;
      this.cargarDatosProducto(prod);
      this.coincidencias = []; 
    }
  }

  cargarDatosProducto(producto: any): void {
    const tipo = producto.tipo || 'PRODUCTO';
    this.tipoSeleccionado = tipo;
    
    // Si el modal está forzado a un tipo pero el producto es de otro, mostrar alerta (seguridad)
    if (this.tipoFijo && this.tipoSeleccionado !== this.data.tipoFijo) {
      console.warn("Editando un registro que no corresponde al tipo de la vista actual");
    }

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
      unidadMedida: producto.unidadMedida || 'Unidad'
    });
    
    this.cambiarTipo(tipo, false); 
  }

  cambiarTipo(tipo: 'PRODUCTO' | 'SERVICIO', actualizarValores: boolean = true) {
    this.tipoSeleccionado = tipo;
    this.productoForm.patchValue({ tipo: tipo });

    if (tipo === 'SERVICIO') {
      const catServicio = this.categorias.find(c => c.nombre.toUpperCase().includes('SERVIC'));
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
      this.productoForm.get('stockMinimo')?.setValidators([Validators.required, Validators.min(0)]);
      this.productoForm.get('stockMinimo')?.updateValueAndValidity();
      
      if (actualizarValores) {
         this.productoForm.patchValue({ unidadMedida: 'Unidad', idCategoria: null });
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
    alert('Error: ' + (e.error?.message || 'Error desconocido'));
  }

  cancelar() { this.dialogRef.close(); }
  get nombre() { return this.productoForm.get('nombre'); }
}