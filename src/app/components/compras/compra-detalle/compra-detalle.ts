import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CompraService } from '../../../services/compra-service';
import { CompraResponse } from '../../../models/compra';

@Component({
  selector: 'app-compra-detalle',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './compra-detalle.html',
  styleUrls: ['./compra-detalle.css']
})
export class CompraDetalleComponent implements OnInit {

  compra: CompraResponse | null = null;
  cargando: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private compraService: CompraService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalle(+id);
    }
  }

  cargarDetalle(id: number) {
    this.cargando = true;
    this.compraService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.compra = data;
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (e) => {
        console.error(e);
        this.cargando = false;
        alert('Error al cargar la compra');
        this.volver();
      }
    });
  }

  imprimir() {
    window.print();
  }

  volver() {
    this.router.navigate(['/compras']);
  }

  // ✅ Navegación inteligente a la Importación
  verImportacion() {
    if (!this.compra) return;

    if (this.compra.importacionId) {
       // Si tenemos el ID, navegamos directamente (Ajusta la ruta según tu router)
       // Opción A: Ir a la lista filtrando (si tienes filtros por query params)
       this.router.navigate(['/importaciones']); 
       // Opción B: Ir al detalle (si lo tienes implementado)
       // this.router.navigate(['/importaciones/detalle', this.compra.importacionId]);
    } else if (this.compra.codImportacion) {
       // Fallback: Ir a la lista
       this.router.navigate(['/importaciones']);
    }
  }
}