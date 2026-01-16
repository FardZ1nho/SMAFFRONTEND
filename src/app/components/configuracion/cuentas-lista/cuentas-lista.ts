import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { ChangeDetectorRef } from '@angular/core';

import { CuentaBancaria } from '../../../models/cuenta-bancaria';
import { CuentaBancariaService } from '../../../services/cuenta-bancaria-service'; 
import { CuentaModalComponent } from '../cuenta-modal/cuenta-modal';
@Component({
  selector: 'app-cuentas-lista',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatDialogModule, MatCardModule, MatMenuModule
  ],
  templateUrl: './cuentas-lista.html',
  styleUrls: ['./cuentas-lista.css']
})
export class CuentasListaComponent implements OnInit {

  cuentas: CuentaBancaria[] = [];

  constructor(
    private cuentaService: CuentaBancariaService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef // <--- AGREGAR ESTO
  ) {}

  ngOnInit(): void {
    this.cargarCuentas();
  }

  cargarCuentas() {
    this.cuentaService.listarTodas().subscribe(data => {
      this.cuentas = data;
      this.cdr.detectChanges(); // <--- AGREGAR ESTA LÍNEA MÁGICA
    });
  }

  abrirModal(cuenta?: CuentaBancaria) {
    const dialogRef = this.dialog.open(CuentaModalComponent, {
      width: '500px',
      data: { cuenta }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.cargarCuentas();
    });
  }

  eliminar(id: number) {
    if (confirm('¿Seguro de eliminar esta cuenta?')) {
      this.cuentaService.eliminar(id).subscribe(() => this.cargarCuentas());
    }
  }

  // Helper para dar color a la tarjetita según el banco
  getColorClass(banco: string): string {
    const b = banco.toUpperCase();
    if (b.includes('YAPE')) return 'card-yape';
    if (b.includes('PLIN')) return 'card-plin';
    if (b.includes('BCP')) return 'card-bcp';
    if (b.includes('INTERBANK')) return 'card-interbank';
    if (b.includes('BBVA')) return 'card-bbva';
    return 'card-default';
  }
}