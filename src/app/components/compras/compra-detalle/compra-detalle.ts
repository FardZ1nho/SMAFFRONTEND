import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';

import { CompraService } from '../../../services/compra-service';
import { CompraResponse } from '../../../models/compra';

@Component({
  selector: 'app-compra-detalle',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIconModule, 
    MatButtonModule,
    MatDividerModule,
    MatCardModule
  ],
  templateUrl: './compra-detalle.html',
  styleUrls: ['./compra-detalle.css']
})
export class CompraDetalleComponent implements OnInit {

  compra: CompraResponse | null = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private compraService: CompraService,
    private cdr: ChangeDetectorRef // ✅ Inyectado
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarCompra(+id);
    }
  }

  cargarCompra(id: number) {
    this.loading = true;
    this.compraService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.compra = data;
        this.loading = false;
        this.cdr.detectChanges(); // ✅ Forzar detección de cambios
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  imprimir() {
    window.print();
  }

  // Helper para sumar totales si no vienen del back (opcional)
  getTotalCantidad(): number {
    return this.compra?.detalles?.reduce((acc, item) => acc + item.cantidad, 0) || 0;
  }
}