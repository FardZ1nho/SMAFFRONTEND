// src/app/components/productos-mas-vendidos/productos-mas-vendidos.component.ts

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
    private cdr: ChangeDetectorRef // ⭐ AGREGAR
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.error = '';
    
    this.dashboardService.obtenerProductosMasVendidos(4).subscribe({
      next: (data) => {
        console.log('✅ Productos más vendidos:', data);
        this.productos = data;
        this.cargando = false;
        this.cdr.detectChanges(); // ⭐ AGREGAR
      },
      error: (err) => {
        console.error('❌ Error al cargar productos:', err);
        this.error = 'Error al cargar productos más vendidos';
        this.cargando = false;
        this.cdr.detectChanges(); // ⭐ AGREGAR
      }
    });
  }

  formatearMoneda(valor: number): string {
    return `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  verTodos(): void {
    console.log('Navegar a todos los productos');
    // TODO: Implementar navegación
  }
}