import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import { ImportacionService } from '../../../services/importacion-service';
import { ImportacionResponse, EstadoImportacion, TipoTransporte } from '../../../models/importacion';

@Component({
  selector: 'app-importacion-editar-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatIconModule, MatTooltipModule, MatTabsModule,
    MatProgressSpinnerModule 
  ],
  templateUrl: './importacion-editar-modal.html',
  styleUrls: ['./importacion-editar-modal.css']
})
export class ImportacionEditarModalComponent implements OnInit {

  form: any = {};
  estados = Object.values(EstadoImportacion);
  transportes = Object.values(TipoTransporte);
  guardando: boolean = false;

  // ✅ Mapa para los inputs manuales (Key: ID Factura, Value: Monto)
  adValoremInputs: { [key: number]: number } = {};

  constructor(
    public dialogRef: MatDialogRef<ImportacionEditarModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportacionResponse,
    private importacionService: ImportacionService
  ) {}

  ngOnInit(): void {
    // Clonar para no mutar directamente
    this.form = { ...this.data };

    // Convertir fechas string a Date objects para los pickers
    const dateFields = ['fechaEstimadaLlegada', 'fechaLlegadaReal'];
    dateFields.forEach(field => {
      if (this.form[field]) this.form[field] = new Date(this.form[field]);
    });

    // ✅ Inicializar el mapa de Ad Valorem
    if (this.data.facturasComerciales) {
      this.data.facturasComerciales.forEach(f => {
        // Usamos el valor guardado (proAdv) o 0 si es nuevo
        this.adValoremInputs[f.id] = f.proAdv || 0; 
      });
    }
  }

  // =========================================================
  // 🟢 LÓGICA PARA LIMPIAR CEROS (AD VALOREM MANUAL)
  // =========================================================
  
  // Al hacer click (focus): Si es 0, lo borra para escribir limpio
  limpiarCeroAdv(id: number) {
    if (this.adValoremInputs[id] === 0) {
      this.adValoremInputs[id] = null as any; 
    }
  }

  // Al salir (blur): Si está vacío, pone 0 otra vez
  verificarVacioAdv(id: number) {
    const val = this.adValoremInputs[id];
    if (val === null || val === undefined || val.toString() === '') {
      this.adValoremInputs[id] = 0;
    }
  }

  // =========================================================
  // 🔵 LÓGICA PARA LIMPIAR CEROS (FORMULARIO GLOBAL)
  // =========================================================

  limpiarCero(campo: string) {
    if (this.form[campo] === 0) {
      this.form[campo] = null;
    }
  }

  verificarVacio(campo: string) {
    if (this.form[campo] === null || this.form[campo] === '') {
      this.form[campo] = 0;
    }
  }

  // =========================================================
  // 💾 GUARDADO
  // =========================================================

  guardar(): void {
    this.guardando = true;
    
    // ✅ Adjuntar el mapa manual al request
    this.form.adValoremPorFactura = this.adValoremInputs;

    this.importacionService.actualizar(this.form.id, this.form).subscribe({
      next: () => {
        this.guardando = false;
        this.dialogRef.close(true); // Cierra y avisa que hubo cambios
      },
      error: (err) => {
        console.error(err);
        this.guardando = false;
        alert("Error al actualizar importación");
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}