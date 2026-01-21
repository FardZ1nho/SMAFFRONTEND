import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CompraService } from '../../../services/compra-service';

@Component({
  selector: 'app-compra-detalle',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './compra-detalle.html',
  styleUrls: ['./compra-detalle.css']
})
export class CompraDetalleComponent implements OnInit {

  compra: any = null;
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
      next: (data: any) => {
        this.compra = data;
        
        // Corrección por si el backend manda nombre distinto
        if (!this.compra.detalles) {
           this.compra.detalles = this.compra.items || [];
        }

        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (e) => {
        console.error(e);
        this.cargando = false;
      }
    });
  }

  imprimir() { window.print(); }
  volver() { this.router.navigate(['/compras']); }
}