import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ProductoService } from '../../../services/producto-service';
import { AlmacenService } from '../../../services/almacen-service';
import { Almacen } from '../../../models/almacen';

@Component({
  selector: 'app-stock-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatButtonModule, MatSelectModule, MatInputModule, 
    MatFormFieldModule, MatIconModule, MatSnackBarModule
  ],
  template: `
    <div class="modal-header">
      <div class="title-row">
        <mat-icon class="header-icon">add_shopping_cart</mat-icon>
        <h2 mat-dialog-title>Ingreso de Stock</h2>
      </div>
      <p class="subtitle">Producto: <strong>{{ data.producto.nombre }}</strong></p>
      <div class="sku-badge">{{ data.producto.codigo }}</div>
    </div>

    <form [formGroup]="stockForm" (ngSubmit)="guardar()">
      <div mat-dialog-content class="modal-content">
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Almacén de Destino</mat-label>
          <mat-select formControlName="idAlmacen">
            <mat-option *ngFor="let alm of almacenes" [value]="alm.id">
              {{ alm.nombre }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="stockForm.get('idAlmacen')?.hasError('required')">Requerido</mat-error>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Cantidad (+)</mat-label>
            <input matInput type="number" formControlName="cantidad" min="1" placeholder="Ej. 50">
            <mat-error *ngIf="stockForm.get('cantidad')?.hasError('min')">Mínimo 1</mat-error>
            <mat-error *ngIf="stockForm.get('cantidad')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Ubicación Física</mat-label>
            <input matInput formControlName="ubicacionFisica" placeholder="Ej. Estante B-4">
            <mat-icon matSuffix>place</mat-icon>
          </mat-form-field>
        </div>

        <div class="info-box">
          <mat-icon>info</mat-icon>
          <span>Esta acción sumará la cantidad ingresada al stock actual del almacén seleccionado.</span>
        </div>

      </div>

      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="cancelar()" class="btn-cancel">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="stockForm.invalid || isSaving">
          <mat-icon>save_alt</mat-icon>
          {{ isSaving ? 'Guardando...' : 'Confirmar Ingreso' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .modal-header { padding: 24px 24px 0; margin-bottom: 10px; }
    .title-row { display: flex; align-items: center; gap: 10px; color: #1e293b; }
    .header-icon { color: #16a34a; } 
    h2 { margin: 0; font-size: 20px; font-weight: 700; }
    .subtitle { margin: 5px 0 0 34px; color: #64748b; font-size: 14px; }
    .sku-badge { margin: 5px 0 0 34px; background: #f1f5f9; display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-family: monospace; color: #475569; border: 1px solid #e2e8f0; }
    
    .modal-content { display: flex; flex-direction: column; gap: 16px; padding-top: 10px !important; min-width: 420px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 16px; }
    .half-width { flex: 1; }
    
    .info-box { background: #ecfdf5; color: #065f46; padding: 12px; border-radius: 8px; display: flex; align-items: flex-start; gap: 10px; font-size: 13px; border: 1px solid #d1fae5; }
    .info-box mat-icon { font-size: 18px; width: 18px; height: 18px; margin-top: 1px; }

    .btn-cancel { color: #64748b; }
  `]
})
export class StockModalComponent implements OnInit {
  stockForm!: FormGroup;
  almacenes: Almacen[] = [];
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<StockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: any },
    private productoService: ProductoService,
    private almacenService: AlmacenService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.stockForm = this.fb.group({
      idAlmacen: [null, Validators.required],
      cantidad: [null, [Validators.required, Validators.min(1)]],
      ubicacionFisica: ['']
    });

    this.almacenService.listarAlmacenesActivos().subscribe({
      next: (data) => {
        this.almacenes = data;
        this.cdr.detectChanges(); 
      },
      error: (e) => console.error(e)
    });
  }

  guardar(): void {
    if (this.stockForm.invalid) return;

    this.isSaving = true;
    const formVal = this.stockForm.value;

    const request = {
      productoId: this.data.producto.id,
      almacenId: formVal.idAlmacen,
      cantidad: formVal.cantidad,
      ubicacionFisica: formVal.ubicacionFisica
    };

    this.productoService.ingresarStock(request).subscribe({
      next: () => {
        this.snackBar.open('✅ Stock ingresado correctamente', 'Cerrar', { 
          duration: 3000, 
          panelClass: 'snackbar-success' 
        });
        // ✅ DEVOLVEMOS TRUE PARA QUE EL PADRE RECALCULE
        this.dialogRef.close(true); 
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.message || err.message || 'Error desconocido';
        alert('Error al ingresar stock: ' + msg);
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}