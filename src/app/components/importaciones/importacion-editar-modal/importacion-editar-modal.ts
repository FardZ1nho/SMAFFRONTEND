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

import { ImportacionService } from '../../../services/importacion-service';
import { ImportacionResponse, EstadoImportacion, TipoTransporte } from '../../../models/importacion';

@Component({
  selector: 'app-importacion-editar-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatIconModule, MatTooltipModule
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
    this.form = { ...this.data };

    if (this.form.fechaEstimadaLlegada) {
       this.form.fechaEstimadaLlegada = new Date(this.form.fechaEstimadaLlegada);
    }
  }

  // ✅ 1. FUNCIÓN PARA LIMPIAR EL CERO AL HACER CLIC
  limpiarCero(campo: string) {
    if (this.form[campo] === 0) {
      this.form[campo] = null;
    }
  }

  // ✅ 2. FUNCIÓN PARA RESTAURAR EL CERO SI LO DEJAN VACÍO
  verificarVacio(campo: string) {
    if (this.form[campo] === null || this.form[campo] === '') {
      this.form[campo] = 0;
    }
  }

  guardar(): void {
    this.guardando = true;
    
    this.importacionService.actualizar(this.form.id, this.form).subscribe({
      next: (resp) => {
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