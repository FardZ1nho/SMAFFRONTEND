import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { CompraService } from '../../../services/compra-service';
import { CompraResponse } from '../../../models/compra';

@Component({
  selector: 'app-compra-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './compra-detalle.html',
  styleUrls: ['./compra-detalle.css']
})
export class CompraDetalleComponent implements OnInit {

  compra: CompraResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private compraService: CompraService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarCompra(+id);
    }
  }

  cargarCompra(id: number) {
    this.compraService.obtenerPorId(id).subscribe({
      next: (data) => this.compra = data,
      error: (err) => console.error(err)
    });
  }
}