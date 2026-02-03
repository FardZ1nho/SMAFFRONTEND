import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, Router, NavigationEnd } from '@angular/router'; // 2. Importar Router
import { filter } from 'rxjs/operators';

import { CotizacionService } from '../../../services/cotizacion-service'; 
import { CotizacionResponse } from '../../../models/cotizacion';

@Component({
  selector: 'app-cotizacion-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './cotizacion-list.html', // Asegúrate que el nombre coincida con tu archivo
  styleUrls: ['./cotizacion-list.css']
})
export class CotizacionListComponent implements OnInit {

  cotizaciones: CotizacionResponse[] = [];
  displayedColumns: string[] = ['codigo', 'cliente', 'fecha', 'total', 'estado', 'acciones'];

  constructor(
    private cotizacionService: CotizacionService,
    private cdr: ChangeDetectorRef, // ✅ Inyección para forzar vista
    private router: Router          // ✅ Inyección para recargar al dar clic en menú
  ) {
    // ✅ ESCUCHA EL ROUTER: Si le das clic a "Cotizaciones" estando ya ahí, recarga.
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.cargarDatos();
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cotizacionService.listar().subscribe({
      next: (data) => {
        this.cotizaciones = data;
        // ✅ EL TRUCO: Decirle a Angular "¡Actualiza la tabla YA!"
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error al cargar cotizaciones:', err)
    });
  }

  // 📄 LÓGICA PARA ABRIR EL PDF
  verPdf(cot: CotizacionResponse): void {
    this.cotizacionService.descargarPdf(cot.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url);
      },
      error: (err) => console.error('Error al descargar PDF', err)
    });
  }

  aprobar(cot: CotizacionResponse): void {
    if(confirm(`¿Deseas aprobar la cotización ${cot.serie}-${cot.numero} y convertirla en venta?`)) {
      this.cotizacionService.aprobar(cot.id).subscribe(() => {
        alert('Cotización aprobada correctamente');
        this.cargarDatos();
      });
    }
  }
}