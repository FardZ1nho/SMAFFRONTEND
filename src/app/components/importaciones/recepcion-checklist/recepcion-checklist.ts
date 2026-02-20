import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// MATERIAL
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// SERVICIOS Y MODELOS
import { ImportacionService } from '../../../services/importacion-service';
import { ImportacionResponse, RecepcionItemRequest } from '../../../models/importacion';

@Component({
  selector: 'app-recepcion-checklist',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule, 
    MatProgressSpinnerModule, 
    MatSnackBarModule
  ],
  templateUrl: './recepcion-checklist.html',
  styleUrls: ['./recepcion-checklist.css']
})
export class RecepcionChecklistComponent implements OnInit {

  importacion: ImportacionResponse | null = null;
  loading: boolean = true;
  guardando: boolean = false;

  listaPlanaItems: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private importacionService: ImportacionService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef // ✅ INYECTADO AQUÍ
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
        this.procesarListaPlana(data);
        this.loading = false;
        this.cdr.detectChanges(); // ✅ FUERZA EL RENDERIZADO AL INSTANTE
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.mostrarNotificacion("Error al cargar la importación", "error");
        this.cdr.detectChanges(); // ✅ FUERZA EL RENDERIZADO EN CASO DE ERROR
        this.volver();
      }
    });
  }

  procesarListaPlana(data: ImportacionResponse) {
    this.listaPlanaItems = [];
    if (data.facturasComerciales) {
      data.facturasComerciales.forEach(factura => {
        if (factura.items) {
          factura.items.forEach(item => {
            this.listaPlanaItems.push({
              detalleId: item.id,
              nombreProducto: item.nombreProducto,
              facturaReferencia: `${factura.serie}-${factura.numero}`,
              cantidadEsperada: item.cantidad,
              cantidadRecibida: (item.cantidadRecibida && item.cantidadRecibida > 0) 
                                  ? item.cantidadRecibida 
                                  : item.cantidad 
            });
          });
        }
      });
    }
  }

  confirmarIngreso() {
    if (!this.importacion) return;

    if (!confirm('¿Estás seguro de confirmar el ingreso físico? Esto sumará el stock real al inventario (Kardex) y cerrará la importación.')) {
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges(); // ✅ Muestra el spinner inmediatamente

    const request: RecepcionItemRequest[] = this.listaPlanaItems.map(item => ({
      detalleId: item.detalleId,
      cantidadRecibida: item.cantidadRecibida
    }));

    this.importacionService.confirmarRecepcion(this.importacion.id, request).subscribe({
      next: () => {
        this.mostrarNotificacion("✅ Ingreso confirmado. Stock actualizado correctamente en el Kardex.", "success");
        this.guardando = false;
        this.cdr.detectChanges();
        this.router.navigate(['/recepciones']); // ✅ Te regresa a la lista de recepciones
      },
      error: (err) => {
        console.error(err);
        this.mostrarNotificacion("❌ Error al confirmar el ingreso.", "error");
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error') {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: tipo === 'success' ? ['snackbar-success'] : ['snackbar-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  volver() {
    this.router.navigate(['/recepciones']);
  }
}