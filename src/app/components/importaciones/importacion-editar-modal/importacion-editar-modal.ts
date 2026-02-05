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
import { MatTabsModule } from '@angular/material/tabs'; // ✅ Para organizar mejor

import { ImportacionService } from '../../../services/importacion-service';
import { ImportacionResponse, EstadoImportacion, TipoTransporte } from '../../../models/importacion';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-importacion-editar-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatIconModule, MatTooltipModule, MatTabsModule,
    MatProgressSpinner
],
  templateUrl: './importacion-editar-modal.html',
  styleUrls: ['./importacion-editar-modal.css']
})
export class ImportacionEditarModalComponent implements OnInit {

  form: any = {};
  estados = Object.values(EstadoImportacion);
  transportes = Object.values(TipoTransporte);
  guardando: boolean = false;

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
  }

  // ✅ Limpia el 0 visualmente al hacer foco
  limpiarCero(campo: string) {
    if (this.form[campo] === 0) this.form[campo] = null;
  }

  // ✅ Restaura el 0 si el usuario deja vacío
  verificarVacio(campo: string) {
    if (this.form[campo] === null || this.form[campo] === '') this.form[campo] = 0;
  }

  guardar(): void {
    this.guardando = true;
    
    this.importacionService.actualizar(this.form.id, this.form).subscribe({
      next: () => {
        this.guardando = false;
        this.dialogRef.close(true);
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