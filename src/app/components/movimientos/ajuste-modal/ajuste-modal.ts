import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { debounceTime, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { of } from 'rxjs';

import { ProductoService } from '../../../services/producto-service';
import { MovimientoService } from '../../../services/movimiento-service';
import { AlmacenService } from '../../../services/almacen-service';
import { AjusteRequest } from '../../../models/movimiento';

@Component({
  selector: 'app-ajuste-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, 
    MatAutocompleteModule, MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './ajuste-modal.html',
  styleUrls: ['./ajuste-modal.css']
})
export class AjusteModalComponent implements OnInit {
  ajusteForm: FormGroup;
  isSaving = false;
  
  almacenes: any[] = [];
  
  buscadorControl = new FormControl('');
  productosSugeridos: any[] = [];
  productoSeleccionado: any = null;
  stockActualEnAlmacen: number | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AjusteModalComponent>,
    private productoService: ProductoService,
    private movimientoService: MovimientoService,
    private almacenService: AlmacenService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.ajusteForm = this.fb.group({
      almacenId: [null, Validators.required],
      tipoAccion: ['SALIDA', Validators.required],
      cantidad: [null, [Validators.required, Validators.min(1)]],
      motivo: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.cargarAlmacenes();
    this.setupBuscador();

    this.ajusteForm.get('almacenId')?.valueChanges.subscribe(() => {
        this.consultarStockReal();
    });
  }

  cargarAlmacenes() {
    this.almacenService.listarAlmacenesActivos().subscribe({
      next: (data: any[]) => {
        this.almacenes = data;
        if(this.almacenes.length > 0) {
            this.ajusteForm.patchValue({ almacenId: this.almacenes[0].id });
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading warehouses', err)
    });
  }

  setupBuscador() {
    this.buscadorControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(val => {
        if (!val || typeof val !== 'string' || val.length < 2) return of([]);
        return this.productoService.buscarProductosPorNombre(val);
      })
    ).subscribe({
      next: (data: any[]) => {
        this.productosSugeridos = data;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error searching products', err)
    });
  }

  seleccionarProducto(prod: any) {
    this.productoSeleccionado = prod;
    this.productosSugeridos = [];
    this.consultarStockReal();
    this.cdr.detectChanges();
  }

  limpiarSeleccion() {
    this.productoSeleccionado = null;
    this.stockActualEnAlmacen = null;
    this.buscadorControl.setValue('');
    this.cdr.detectChanges();
  }

  consultarStockReal() {
      const almacenId = this.ajusteForm.get('almacenId')?.value;
      if (!this.productoSeleccionado || !almacenId) return;

      this.stockActualEnAlmacen = this.productoSeleccionado.stockActual;
      this.cdr.detectChanges();
  }

  guardar() {
    if (this.ajusteForm.invalid || !this.productoSeleccionado) return;

    const formVal = this.ajusteForm.value;
    
    if (formVal.tipoAccion === 'SALIDA' && (this.stockActualEnAlmacen || 0) < formVal.cantidad) {
        if(!confirm(`⚠️ Estás intentando sacar más stock (${formVal.cantidad}) del que figura en sistema (${this.stockActualEnAlmacen}). ¿Continuar?`)) {
            return;
        }
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    const cantidadFinal = formVal.tipoAccion === 'SALIDA' ? -formVal.cantidad : formVal.cantidad;
    
    // ✅ CORRECCIÓN AQUÍ: Extraer solo el nombre del JSON
    let usuarioNombre = 'Admin';
    const usuarioStorage = localStorage.getItem('usuario');
    
    if (usuarioStorage) {
        try {
            // Intentamos parsear el JSON
            const usuarioObj = JSON.parse(usuarioStorage);
            // Buscamos la propiedad username o nombre
            usuarioNombre = usuarioObj.username || usuarioObj.nombre || 'Usuario';
        } catch (e) {
            // Si falla el parseo, asumimos que es un string simple
            usuarioNombre = usuarioStorage;
        }
    }

    const request: AjusteRequest = {
      productoId: this.productoSeleccionado.id,
      almacenId: formVal.almacenId,
      cantidad: cantidadFinal,
      motivo: formVal.motivo,
      usuarioResponsable: usuarioNombre // Ahora enviamos solo el nombre limpio
    };

    this.movimientoService.registrarAjuste(request).subscribe({
      next: () => {
        this.snackBar.open('✅ Ajuste realizado con éxito', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.isSaving = false;
        // Mejor manejo de error para ver qué dice el backend
        const msg = err.error?.error || err.message || 'Error desconocido';
        this.snackBar.open('❌ Error: ' + msg, 'Cerrar', { duration: 5000, panelClass: 'snackbar-error' });
        this.cdr.detectChanges();
      }
    });
  }

  cancelar() {
    this.dialogRef.close();
  }
}