import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';

import { ProductoService } from '../../../services/producto-service';
import { CategoriaService } from '../../../services/categoria-service';
import { ProductoRequest, ComponenteProducto } from '../../../models/producto';
import { Categoria } from '../../../models/categoria';

@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatAutocompleteModule,
    MatSnackBarModule, FormsModule
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
    
  tipoSeleccionado: 'PRODUCTO' | 'SERVICIO' | 'KIT' = 'PRODUCTO';
  tipoFijo: boolean = false; 

  // 🟢 NUEVO: Bandera para saber si se seleccionó suministro
  esSuministro: boolean = false; 

  coincidencias: any[] = [];
  buscandoCoincidencias = false;

  componentesSeleccionados: ComponenteProducto[] = [];
  buscadorComponentesControl = new FormControl('');
  productosSugeridos: any[] = [];
  buscandoComponente = false;
  costoSugeridoKit: number = 0;

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
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();

    this.categoriaService.listarCategoriasActivas().subscribe({
      next: (data) => {
        this.categorias = data;
        
        // Si estamos en edición y ya hay una categoría cargada, verificamos si es suministro
        if (this.productoForm.get('idCategoria')?.value) {
            this.verificarSiEsSuministro(this.productoForm.get('idCategoria')?.value);
        }
        
        this.cdr.detectChanges();
      }
    });

    // 🟢 NUEVO: Escuchamos los cambios en el selector de categoría
    this.productoForm.get('idCategoria')?.valueChanges.subscribe(id => {
        this.verificarSiEsSuministro(id);
    });

    if (this.data && this.data.tipoFijo) {
      this.tipoSeleccionado = this.data.tipoFijo;
      this.tipoFijo = true; 
      this.cambiarTipo(this.tipoSeleccionado, true); 
    }

    if (this.data && (this.data.modo === 'editar' || this.data.producto)) {
      this.esEdicion = true;
      this.productoId = this.data.producto?.id;
      if (this.data.producto) {
        this.cargarDatosProducto(this.data.producto);
      }
    }

    this.detectarDuplicados();
    this.configurarBuscadorComponentes(); 
  }

  inicializarFormulario(): void {
    this.productoForm = this.fb.group({
      tipo: [this.tipoSeleccionado], 
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      codigo: [''],
      codigoInternacional: [''],
      idCategoria: [null, Validators.required],
      descripcion: [''],
      stockMinimo: [5], 
      moneda: ['USD', Validators.required],
      precioChina: [null],
      costoTotal: [null], 
      precioVenta: [null, [Validators.required, Validators.min(0)]],
      unidadMedida: ['Unidad']
    });
  }

  // 🟢 NUEVO: Método para activar o desactivar la bandera y las validaciones
  verificarSiEsSuministro(idCategoria: number): void {
      if (!this.categorias || this.categorias.length === 0) return;
      
      const catSeleccionada = this.categorias.find(c => c.id === idCategoria);
      
      if (catSeleccionada && catSeleccionada.nombre.toUpperCase().includes('SUMINISTRO')) {
          this.esSuministro = true;
          // Quitamos la obligación de ponerle precio de venta
          this.productoForm.get('precioVenta')?.clearValidators();
      } else {
          this.esSuministro = false;
          // Volvemos a hacer obligatorio el precio de venta
          this.productoForm.get('precioVenta')?.setValidators([Validators.required, Validators.min(0)]);
      }
      this.productoForm.get('precioVenta')?.updateValueAndValidity();
  }

  configurarBuscadorComponentes(): void {
    this.buscadorComponentesControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(valor => {
        if (!valor || typeof valor !== 'string' || valor.length < 2) return of([]);
        this.buscandoComponente = true;
        return this.productoService.buscarProductosPorNombre(valor).pipe(
           map(res => res.filter((p: any) => p.tipo === 'PRODUCTO' && p.id !== this.productoId))
        );
      })
    ).subscribe({
      next: (res) => {
        this.productosSugeridos = res;
        this.buscandoComponente = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.productosSugeridos = [];
        this.buscandoComponente = false;
      }
    });
  }

  seleccionarComponente(producto: any): void {
    const existe = this.componentesSeleccionados.find(c => c.idProducto === producto.id);
    if (existe) {
      existe.cantidad++; 
    } else {
      this.componentesSeleccionados.push({
        idProducto: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        cantidad: 1,
        costoUnitario: producto.costoTotal || 0 
      });
    }
    this.buscadorComponentesControl.setValue(''); 
    this.calcularCostoSugerido();
  }

  eliminarComponente(index: number): void {
    this.componentesSeleccionados.splice(index, 1);
    this.calcularCostoSugerido();
  }

  calcularCostoSugerido(): void {
    if (this.tipoSeleccionado !== 'KIT') return;
    const total = this.componentesSeleccionados.reduce((acc, item) => {
      return acc + ((item.costoUnitario || 0) * item.cantidad);
    }, 0);
    this.costoSugeridoKit = total;
    if (!this.productoForm.get('costoTotal')?.value) {
      this.productoForm.patchValue({ costoTotal: total });
    }
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
    
    if (this.tipoFijo && this.tipoSeleccionado !== this.data.tipoFijo) {
      console.warn("Editando un registro que no corresponde al tipo de la vista actual");
    }

    const categoriaId = producto.categoria?.id || producto.idCategoria;

    this.productoForm.patchValue({
      tipo: tipo,
      nombre: producto.nombre,
      codigo: producto.codigo,
      codigoInternacional: producto.codigoInternacional,
      idCategoria: categoriaId,
      descripcion: producto.descripcion,
      stockMinimo: producto.stockMinimo,
      moneda: producto.moneda || 'USD',
      precioChina: producto.precioChina,
      costoTotal: producto.costoTotal,
      precioVenta: producto.precioVenta,
      unidadMedida: producto.unidadMedida || 'Unidad'
    });
    
    // Si ya teníamos cargadas las categorías, disparamos la verificación de suministro
    if(this.categorias.length > 0 && categoriaId) {
        this.verificarSiEsSuministro(categoriaId);
    }
    
    if (tipo === 'KIT' && producto.componentes) {
      this.componentesSeleccionados = producto.componentes.map((c: any) => ({
        idProducto: c.idProducto,
        nombre: c.nombre, 
        cantidad: c.cantidad,
        codigo: c.codigo || '',
        costoUnitario: 0 
      }));
    }

    this.cambiarTipo(tipo, false); 
  }

  cambiarTipo(tipo: 'PRODUCTO' | 'SERVICIO' | 'KIT', actualizarValores: boolean = true) {
    this.tipoSeleccionado = tipo;
    this.productoForm.patchValue({ tipo: tipo });

    this.productoForm.get('stockMinimo')?.clearValidators();
    this.productoForm.get('precioChina')?.clearValidators();
    this.productoForm.get('costoTotal')?.clearValidators();
    
    // Restablecemos el validador del precio de venta por defecto (luego verificarSiEsSuministro podría quitarlo)
    this.productoForm.get('precioVenta')?.setValidators([Validators.required, Validators.min(0)]);

    if (tipo === 'SERVICIO') {
        const catServicio = this.categorias.find(c => c.nombre.toUpperCase().includes('SERVIC'));
        const idCategoriaDefault = catServicio ? catServicio.id : (this.categorias[0]?.id || null);
        
        if (actualizarValores) {
            this.productoForm.patchValue({
                stockMinimo: 0, precioChina: 0, costoTotal: 0,
                idCategoria: idCategoriaDefault, unidadMedida: 'Global',
                codigo: '', codigoInternacional: ''
            });
        }
    } else if (tipo === 'KIT') {
        this.productoForm.get('stockMinimo')?.setValidators([Validators.required, Validators.min(0)]);
        if (actualizarValores) {
            this.productoForm.patchValue({ 
                unidadMedida: 'Set/Kit', 
                idCategoria: null,
                precioChina: 0 
            });
        }
    } else {
        this.productoForm.get('stockMinimo')?.setValidators([Validators.required, Validators.min(0)]);
        if (actualizarValores) {
           this.productoForm.patchValue({ unidadMedida: 'Unidad', idCategoria: null });
        }
    }
    this.productoForm.get('stockMinimo')?.updateValueAndValidity();
    this.productoForm.get('precioVenta')?.updateValueAndValidity();
  }

  guardarProducto(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    if (this.tipoSeleccionado === 'KIT' && this.componentesSeleccionados.length === 0) {
        this.snackBar.open('Un SET/KIT debe tener al menos un componente.', 'Cerrar', { duration: 3000 });
        return;
    }

    this.isSaving = true;
    const val = this.productoForm.value;
    
    const componentesBackend = this.tipoSeleccionado === 'KIT' 
        ? this.componentesSeleccionados.map(c => ({ idProducto: c.idProducto, cantidad: c.cantidad }))
        : [];

    const request: ProductoRequest = {
      tipo: this.tipoSeleccionado, 
      nombre: val.nombre,
      codigo: val.codigo,
      // Si es suministro, no mandamos código internacional
      codigoInternacional: this.esSuministro ? '' : val.codigoInternacional,
      idCategoria: val.idCategoria, 
      descripcion: val.descripcion,
      stockMinimo: val.stockMinimo,
      moneda: val.moneda,
      precioChina: val.precioChina,
      costoTotal: val.costoTotal,
      // Si es suministro, el precio de venta va en 0 para que BD no moleste
      precioVenta: this.esSuministro ? 0 : val.precioVenta,
      unidadMedida: val.unidadMedida,
      componentes: componentesBackend
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
    this.snackBar.open(mensaje, 'Aceptar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
    this.dialogRef.close(true);
  }

  getSimboloMoneda(): string {
    const codigo = this.productoForm.get('moneda')?.value;
    const moneda = this.monedas.find(m => m.codigo === codigo);
    return moneda ? moneda.simbolo : '$'; 
  }

  manejarError(e: any) {
    this.isSaving = false;
    this.snackBar.open('Error: ' + (e.error?.message || 'Error desconocido'), 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
    });
  }

  cancelar() { this.dialogRef.close(); }
  get nombre() { return this.productoForm.get('nombre'); }
}