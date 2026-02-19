import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Necesario para ngModel
import { ActivatedRoute, Router } from '@angular/router';

// MATERIAL
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // ✅ Para notificaciones visuales

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
    MatSnackBarModule // ✅ Importado para los mensajes
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
    private snackBar: MatSnackBar // ✅ Inyectado para notificaciones
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
        this.mostrarNotificacion("Error al cargar la importación", "error");
        this.volver();
      }
    });
  }

  // ✅ MÉTODO CORREGIDO: SUPERPONE EL AD VALOREM VIEJO Y EVITA ERRORES DE TEXTO
  recalcularLanded(item: any, factura: any) {
    // 1. Valor unitario ingresado (Number estricto para evitar concatenaciones raras)
    const valorUnitario = Number(item.adValoremUnitarioManual) || 0;
    
    // 2. Nuevo Ad Valorem Total para el ÍTEM
    const nuevoAdvTotalItem = valorUnitario * item.cantidad;
    
    // 3. Diferencia de costos SOLO para este ítem
    const diferenciaItem = nuevoAdvTotalItem - (item._advTotalOriginal || 0);

    // 4. Actualizar el Ítem
    item.itemAdv = nuevoAdvTotalItem;
    item._advTotalOriginal = nuevoAdvTotalItem; 
    item.costoTotalLanded = (item.costoTotalLanded || 0) + diferenciaItem;
    item.costoUnitarioLanded = item.costoTotalLanded / item.cantidad;

    // =========================================================
    // 🛑 5. ANULAR EL VIEJO AD VALOREM DE LA FACTURA Y SUPERPONER
    // =========================================================
    let sumaRealAdValoremFactura = 0;
    
    // Sumamos estrictamente los Ad Valorem de todos los ítems
    factura.items.forEach((i: any) => {
      sumaRealAdValoremFactura += (i.itemAdv || 0);
    });

    // 6. Calculamos la diferencia de la factura respecto a lo que tenía antes
    // (Esto anula mágicamente cualquier valor manual viejo que tuviera la factura general)
    const diferenciaFactura = sumaRealAdValoremFactura - (factura.proAdv || 0);

    // 7. Actualizamos la Factura con la sumatoria real y limpia
    factura.proAdv = sumaRealAdValoremFactura; 
    factura.costoTotalImportacion = (factura.costoTotalImportacion || 0) + diferenciaFactura;
  }

  // Suma total de landed cost de todas las facturas
  calcularTotalLandedGlobal(): number {
    if (!this.importacion || !this.importacion.facturasComerciales) return 0;
    return this.importacion.facturasComerciales.reduce((acc, f) => acc + f.costoTotalImportacion, 0);
  }

  // ✅ GUARDA LOS CAMBIOS EN EL BACKEND
  guardarCambiosManuales() {
    if (!this.importacion) return;
    
    this.guardando = true;

    // 1. Construir el mapa de Ad Valorem (ID_DEL_DETALLE -> MONTO_TOTAL_AD_VALOREM)
    const adValoremMap: { [key: number]: number } = {};

    this.importacion.facturasComerciales?.forEach(fact => {
      fact.items?.forEach(item => {
        if (item.id) { // Solo si el ítem tiene ID válido
          adValoremMap[item.id] = item.itemAdv || 0;
        }
      });
    });

    // 2. Construir el DTO para el backend
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

      // ✅ PASAMOS EL MAPA AL BACKEND
      adValoremPorItem: adValoremMap 
    };

    // 3. Enviar al Backend
    this.importacionService.actualizar(this.importacion.id, requestParaBackend).subscribe({
      next: (data) => {
        this.mostrarNotificacion("✅ Ad Valorem y Costos guardados en la Base de Datos", "success");
        this.guardando = false;
        
        // Refrescamos los datos para estar sincronizados con la BD
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