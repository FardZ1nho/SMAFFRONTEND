import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ActivatedRoute, Router } from '@angular/router';

// MATERIAL
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; 

// SERVICIOS
import { ImportacionService } from '../../../services/importacion-service';
import { ImportacionResponse, ImportacionRequest } from '../../../models/importacion';

@Component({
  selector: 'app-importacion-prorrateo',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatCardModule, 
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule 
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
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar 
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

        if (this.importacion?.facturasComerciales) {
          this.importacion.facturasComerciales.forEach(fact => {
            if (fact.items) {
              fact.items.forEach((item: any) => {
                item.adValoremUnitarioManual = (item.itemAdv || 0) / item.cantidad;
                item._advTotalOriginal = item.itemAdv || 0; 
              });
            }
          });
        }

        this.loading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.mostrarNotificacion("Error al cargar la importación", "error");
        this.volver();
      }
    });
  }

  recalcularLanded(item: any, factura: any) {
    const valorUnitario = Number(item.adValoremUnitarioManual) || 0;
    const nuevoAdvTotalItem = valorUnitario * item.cantidad;
    const diferenciaItem = nuevoAdvTotalItem - (item._advTotalOriginal || 0);

    item.itemAdv = nuevoAdvTotalItem;
    item._advTotalOriginal = nuevoAdvTotalItem; 
    item.costoTotalLanded = (item.costoTotalLanded || 0) + diferenciaItem;
    item.costoUnitarioLanded = item.costoTotalLanded / item.cantidad;

    let sumaRealAdValoremFactura = 0;
    
    factura.items.forEach((i: any) => {
      sumaRealAdValoremFactura += (i.itemAdv || 0);
    });

    const diferenciaFactura = sumaRealAdValoremFactura - (factura.proAdv || 0);

    factura.proAdv = sumaRealAdValoremFactura; 
    factura.costoTotalImportacion = (factura.costoTotalImportacion || 0) + diferenciaFactura;
  }

  calcularTotalLandedGlobal(): number {
    if (!this.importacion || !this.importacion.facturasComerciales) return 0;
    return this.importacion.facturasComerciales.reduce((acc, f) => acc + f.costoTotalImportacion, 0);
  }

  // ✅ NUEVO: Calcula el % de incremento entre el FOB y el Landed Cost
  calcularPorcentajeAumento(fob: number, landed: number): number {
    if (!fob || fob === 0) return 0;
    return (landed - fob) / fob;
  }

  guardarCambiosManuales() {
    if (!this.importacion) return;
    
    this.guardando = true;

    const adValoremMap: { [key: number]: number } = {};

    this.importacion.facturasComerciales?.forEach(fact => {
      fact.items?.forEach(item => {
        if (item.id) { 
          adValoremMap[item.id] = item.itemAdv || 0;
        }
      });
    });

    const requestParaBackend: ImportacionRequest = {
      codigoAgrupador: this.importacion.codigoAgrupador,
      estado: this.importacion.estado,
      tipoTransporte: this.importacion.tipoTransporte,
      numeroDua: this.importacion.numeroDua,
      trackingNumber: this.importacion.trackingNumber,
      agenteAduanas: this.importacion.agenteAduanas,
      canal: this.importacion.canal,

      costoFlete: this.importacion.costoFlete,
      costoAlmacenajeCft: this.importacion.costoAlmacenajeCft,
      costoTransporteSjl: this.importacion.costoTransporteSjl,
      costoPersonalDescarga: this.importacion.costoPersonalDescarga,
      costoMontacarga: this.importacion.costoMontacarga,
      costoDesconsolidacion: this.importacion.costoDesconsolidacion,
      costoVistosBuenos: this.importacion.costoVistosBuenos,
      costoTransmision: this.importacion.costoTransmision,
      costoComisionAgencia: this.importacion.costoComisionAgencia,
      costoVobo: this.importacion.costoVobo,
      costoGastosOperativos: this.importacion.costoGastosOperativos,
      costoResguardo: this.importacion.costoResguardo,
      costoIgv: this.importacion.costoIgv,
      costoIpm: this.importacion.costoIpm,
      costoPercepcion: this.importacion.costoPercepcion,
      
      costoOtros1: this.importacion.costoOtros1,
      costoOtros2: this.importacion.costoOtros2,
      costoOtros3: this.importacion.costoOtros3,
      costoOtros4: this.importacion.costoOtros4,

      adValoremPorItem: adValoremMap 
    };

    this.importacionService.actualizar(this.importacion.id, requestParaBackend).subscribe({
      next: (data) => {
        this.mostrarNotificacion("✅ Ad Valorem y Costos guardados en la Base de Datos", "success");
        this.guardando = false;
        
        this.cargarDatos(this.importacion!.id); 
      },
      error: (err) => {
        console.error(err);
        this.mostrarNotificacion("❌ Error al guardar los cambios en el servidor.", "error");
        this.guardando = false;
      }
    });
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error') {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? ['snackbar-success'] : ['snackbar-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  volver() {
    this.router.navigate(['/importaciones']);
  }

  imprimir() {
    window.print();
  }
}