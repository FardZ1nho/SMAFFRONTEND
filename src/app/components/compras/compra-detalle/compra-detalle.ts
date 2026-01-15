import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CompraService } from '../../../services/compra-service'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-compra-detalle',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  // CORRECCIÓN: Ajustado a tus nombres de archivo (sin .component)
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
        console.log('📦 DATA CRUDA DEL BACKEND:', data); // <--- Mira esto en la consola (F12)
        
        this.compra = data;

        // --- CORRECCIÓN DE EMERGENCIA ---
        // Si el backend manda 'detalleCompras' o 'items' en vez de 'detalles', lo arreglamos aquí:
        if (!this.compra.detalles) {
           this.compra.detalles = this.compra.detalleCompras || this.compra.items || [];
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

  calcularTotal(): number {
    if (!this.compra || !this.compra.detalles) return 0;
    return this.compra.detalles.reduce((acc: number, item: any) => acc + (item.cantidad * item.precioUnitario), 0);
  }

  imprimir() {
    window.print();
  }

  volver() {
    this.router.navigate(['/compras']);
  }
}