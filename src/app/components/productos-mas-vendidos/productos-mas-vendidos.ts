import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard-service';
import { ProductoVendidoDTO } from '../../models/dashboard';

@Component({
  selector: 'app-productos-mas-vendidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productos-mas-vendidos.html',
  styleUrls: ['./productos-mas-vendidos.css']
})
export class ProductosMasVendidosComponent implements OnInit {
  productos: ProductoVendidoDTO[] = [];
  cargando: boolean = true;
  error: string = '';

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.error = '';
    
    // Pedimos los top 5 productos
    this.dashboardService.obtenerProductosMasVendidos(5).subscribe({
      next: (data) => {
        console.log('✅ Productos más vendidos:', data);
        this.productos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al cargar productos:', err);
        this.error = 'Error al cargar datos.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Se adapta para aceptar null o undefined por seguridad
  formatearMoneda(valor: number | undefined): string {
    if (valor === undefined || valor === null) return 'S/ 0.00';
    return `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  verTodos(): void {
    console.log('Navegar a todos los productos');
  }
}