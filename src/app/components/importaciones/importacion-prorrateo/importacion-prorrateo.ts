import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ IMPORTANTE: Agregado para usar ngModel
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
    FormsModule, // ✅ Agregado aquí
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
  guardando: boolean = false;

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

        // ✅ INICIALIZAR EL AD VALOREM MANUAL PARA CADA PRODUCTO
        if (this.importacion?.facturasComerciales) {
          this.importacion.facturasComerciales.forEach(fact => {
            if (fact.items) {
              fact.items.forEach((item: any) => {
                // Se calcula el Ad Valorem Unitario actual (o 0 si no tiene)
                item.adValoremUnitarioManual = (item.itemAdv || 0) / item.cantidad;
                // Guardamos el total original de ad valorem para calcular diferencias luego
                item._advTotalOriginal = item.itemAdv || 0; 
              });
            }
          });
        }

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

  // ✅ NUEVO: RECALCULA TODO CUANDO SE CAMBIA EL AD VALOREM MANUALMENTE
  recalcularLanded(item: any, factura: any) {
    // 1. Calcular el nuevo Ad Valorem Total para esa fila
    const nuevoAdvTotal = (item.adValoremUnitarioManual || 0) * item.cantidad;
    
    // 2. ¿Cuánto cambió respecto al valor anterior?
    const diferencia = nuevoAdvTotal - (item._advTotalOriginal || 0);

    // 3. Actualizar el Item
    item.itemAdv = nuevoAdvTotal;
    item._advTotalOriginal = nuevoAdvTotal; // Actualizar la referencia
    item.costoTotalLanded = (item.costoTotalLanded || 0) + diferencia;
    item.costoUnitarioLanded = item.costoTotalLanded / item.cantidad;

    // 4. Actualizar los totales de la Factura
    factura.proAdv = (factura.proAdv || 0) + diferencia;
    factura.costoTotalImportacion = (factura.costoTotalImportacion || 0) + diferencia;
  }

  // Suma total de landed cost de todas las facturas
  calcularTotalLandedGlobal(): number {
    if (!this.importacion || !this.importacion.facturasComerciales) return 0;
    return this.importacion.facturasComerciales.reduce((acc, f) => acc + f.costoTotalImportacion, 0);
  }

  guardarCambiosManuales() {
    // ✅ Aquí puedes agregar la llamada a tu servicio para guardar los nuevos valores en BD
    /*
    this.guardando = true;
    this.importacionService.actualizarImportacion(this.importacion.id, this.importacion).subscribe({
       next: () => { alert("Guardado"); this.guardando = false; },
       error: () => { alert("Error"); this.guardando = false; }
    });
    */
    alert("Totales recalculados en pantalla. Conecta esto con tu backend si deseas guardar los cambios permanentemente.");
  }

  volver() {
    this.router.navigate(['/importaciones']);
  }

  imprimir() {
    window.print();
  }
}