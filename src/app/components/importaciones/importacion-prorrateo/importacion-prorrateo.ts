import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// MATERIAL
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

// SERVICIOS
import { ImportacionService } from '../../../services/importacion-service';
import { ImportacionResponse } from '../../../models/importacion';

@Component({
  selector: 'app-importacion-prorrateo',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatCardModule, 
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './importacion-prorrateo.html',
  styleUrls: ['./importacion-prorrateo.css']
})
export class ImportacionProrrateoComponent implements OnInit {

  importacion: ImportacionResponse | null = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private importacionService: ImportacionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDatos(+id);
    }
  }

  cargarDatos(id: number) {
    this.loading = true;
    this.importacionService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.importacion = data;
        this.loading = false;
        this.cdr.detectChanges(); // Forzar renderizado
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        alert("Error al cargar la importación");
        this.volver();
      }
    });
  }

  // Suma total de landed cost de todas las facturas
  calcularTotalLandedGlobal(): number {
    if (!this.importacion || !this.importacion.facturasComerciales) return 0;
    return this.importacion.facturasComerciales.reduce((acc, f) => acc + f.costoTotalImportacion, 0);
  }

  volver() {
    this.router.navigate(['/importaciones']);
  }

  imprimir() {
    window.print();
  }
}