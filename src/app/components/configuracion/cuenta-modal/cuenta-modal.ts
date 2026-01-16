import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { CuentaBancaria } from '../../../models/cuenta-bancaria';
import { CuentaBancariaService } from '../../../services/cuenta-bancaria-service'; 

@Component({
  selector: 'app-cuenta-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, 
    MatInputModule, MatSelectModule, MatIconModule, MatSnackBarModule, MatSlideToggleModule
  ],
  templateUrl: './cuenta-modal.html',
  styleUrls: ['./cuenta-modal.css']
})
export class CuentaModalComponent implements OnInit {

  cuenta: CuentaBancaria = {
    nombre: '',
    banco: '',
    numero: '',
    moneda: 'PEN',
    tipo: 'DIGITAL',
    titular: '',
    activa: true
  };

  esEdicion: boolean = false;

  bancos = ['BCP', 'INTERBANK', 'BBVA', 'SCOTIABANK', 'YAPE', 'PLIN', 'CAJA AREQUIPA', 'OTRO'];

  constructor(
    public dialogRef: MatDialogRef<CuentaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cuenta?: CuentaBancaria },
    private cuentaService: CuentaBancariaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.cuenta) {
      this.esEdicion = true;
      this.cuenta = { ...this.data.cuenta }; // Copia para no mutar directo
    }
  }

  guardar(): void {
    if (!this.cuenta.nombre || !this.cuenta.banco || !this.cuenta.numero) {
      this.mostrarNotif('Completa los campos obligatorios (*)', 'warning');
      return;
    }

    const request$ = this.esEdicion 
      ? this.cuentaService.actualizar(this.cuenta.id!, this.cuenta)
      : this.cuentaService.crear(this.cuenta);

    request$.subscribe({
      next: (res) => {
        this.mostrarNotif(this.esEdicion ? 'Cuenta actualizada' : 'Cuenta creada', 'success');
        this.dialogRef.close(true); // Retorna true para refrescar lista
      },
      error: () => this.mostrarNotif('Error al guardar cuenta', 'error')
    });
  }

  mostrarNotif(msg: string, tipo: string) {
    this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: `snackbar-${tipo}` });
  }
}