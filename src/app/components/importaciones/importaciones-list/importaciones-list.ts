import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// MATERIAL
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';

// COMPONENTES
import { ImportacionEditarModalComponent } from '../importacion-editar-modal/importacion-editar-modal'; 
import { ProrrateoModalComponent } from '../prorrateo-modal/prorrateo-modal';

// SERVICIOS Y MODELOS
import { ImportacionService } from '../../../services/importacion-service'; 
import { ImportacionResponse, EstadoImportacion, TipoTransporte } from '../../../models/importacion';

interface ImportacionUI extends ImportacionResponse {
  expanded?: boolean;
}

@Component({
  selector: 'app-importaciones-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatIconModule, MatInputModule, 
    MatSelectModule, MatTooltipModule, MatChipsModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule
  ],
  templateUrl: './importaciones-list.html',
  styleUrls: ['./importaciones-list.css']
})
export class ImportacionesListComponent implements OnInit {

  importaciones: ImportacionUI[] = [];
  importacionesFiltradas: ImportacionUI[] = [];
  loading: boolean = true;

  // Filtros
  mostrarFiltros: boolean = false;
  filtroTexto: string = '';
  filtroEstado: string = 'TODOS';
  filtroTransporte: string = 'TODOS';
  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;

  estados = Object.values(EstadoImportacion);
  transportes = Object.values(TipoTransporte);

  constructor(
    private importacionService: ImportacionService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.importacionService.listarTodas().subscribe({
      next: (data) => {
        this.importaciones = data.map(i => ({ ...i, expanded: false }));
        this.filtrar(); 
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando importaciones', err);
        this.loading = false;
      }
    });
  }

  // ... (Lógica de filtrado se mantiene igual, la omito para ahorrar espacio visual pero debe estar aquí) ...
  filtrar(): void {
    let lista = this.importaciones;
    // ... tu lógica de filtros ...
    if (this.filtroEstado !== 'TODOS') lista = lista.filter(imp => imp.estado === this.filtroEstado);
    // ...
    this.importacionesFiltradas = lista;
  }

  toggleFiltros(): void { this.mostrarFiltros = !this.mostrarFiltros; }
  limpiarBusqueda(): void { this.filtroTexto = ''; this.filtrar(); }
  limpiarFiltros(): void { 
    this.filtroEstado = 'TODOS'; this.filtroTransporte = 'TODOS'; 
    this.filtroFechaInicio = null; this.filtroFechaFin = null; this.filtroTexto = ''; 
    this.filtrar(); 
  }
  
  toggleGroup(imp: ImportacionUI): void { imp.expanded = !imp.expanded; }

  // ✅ ABRIR MODAL DE EDICIÓN (Ingreso de Costos)
  editarImportacion(imp: ImportacionResponse): void {
    const dialogRef = this.dialog.open(ImportacionEditarModalComponent, {
      width: '95vw',      // 95% del ancho de la pantalla
      maxWidth: '98vw',   // Límite máximo
      height: '90vh',     // 90% del alto (para que se vea todo el contenido)
      maxHeight: '95vh',
      data: imp, 
      disableClose: true,
      panelClass: 'full-screen-modal' // Opcional: clase para estilos extra si necesitas
    });
    dialogRef.afterClosed().subscribe(result => { if (result === true) this.cargarDatos(); });
  }

  // ✅ 2. MODAL DE VER PRORRATEO (MÁS ANCHO)
  verProrrateo(imp: ImportacionResponse): void {
    this.dialog.open(ProrrateoModalComponent, {
      width: '90vw',      // Muy ancho para que la tabla se vea perfecta
      maxWidth: '95vw',
      data: imp
    });
  }

  // --- HELPERS VISUALES ---

  getClassEstado(estado: string): string {
    switch (estado) {
      case 'ORDENADO': return 'badge-ordenado';
      case 'EN_TRANSITO': return 'badge-transito';
      case 'EN_ADUANAS': return 'badge-aduanas';
      case 'EN_ALMACEN': return 'badge-almacen';
      case 'CERRADA': return 'badge-cerrado';
      case 'LIQUIDADA': return 'badge-liquidada';
      default: return '';
    }
  }

  getLabelEstado(estado: string): string { return estado ? estado.replace(/_/g, ' ') : 'ND'; }

  getProveedoresResumen(imp: ImportacionResponse): string {
    if (!imp.facturasComerciales || imp.facturasComerciales.length === 0) return 'Sin Facturas';
    const nombres = [...new Set(imp.facturasComerciales.map(f => f.nombreProveedor))];
    return nombres.join(', ');
  }

  // ✅ CÁLCULO DE COSTOS ACTUALIZADO CON NUEVOS CAMPOS
  getTotalCostoEstimado(imp: ImportacionResponse): number {
      const fob = imp.sumaFobTotal || 0;
      
      // Sumar todos los campos nuevos
      const gastosVolumen = (imp.costoFlete || 0) + (imp.costoAlmacenajeCft || 0) + 
                            (imp.costoTransporteSjl || 0) + (imp.costoPersonalDescarga || 0) + 
                            (imp.costoMontacarga || 0);

      const gastosPeso = (imp.costoDesconsolidacion || 0);

      const gastosValor = (imp.costoVistosBuenos || 0) + (imp.costoTransmision || 0) + 
                          (imp.costoComisionAgencia || 0) + (imp.costoVobo || 0) + 
                          (imp.costoGastosOperativos || 0) + (imp.costoResguardo || 0);
      
      const impuestos = (imp.costoIgv || 0) + (imp.costoIpm || 0) + (imp.costoPercepcion || 0) + (imp.costoAdv || 0);
      
      const otros = (imp.costoOtros1 || 0) + (imp.costoOtros2 || 0) + 
                    (imp.costoOtros3 || 0) + (imp.costoOtros4 || 0);

      return fob + gastosVolumen + gastosPeso + gastosValor + impuestos + otros;
  }

  // ✅ Suma solo los gastos (sin FOB) para mostrar "Gastos Logísticos"
  getTotalGastos(imp: ImportacionResponse): number {
    return this.getTotalCostoEstimado(imp) - (imp.sumaFobTotal || 0);
  }

  isStepComplete(estadoActual: string, paso: string): boolean {
    const orden = ['ORDENADO', 'EN_TRANSITO', 'EN_ADUANAS', 'EN_ALMACEN', 'CERRADA', 'LIQUIDADA'];
    let estadoNormalizado = estadoActual;
    if (estadoActual === 'NACIONALIZADO') estadoNormalizado = 'EN_ADUANAS'; 
    
    const idxActual = orden.indexOf(estadoNormalizado);
    const idxPaso = orden.indexOf(paso);

    if (idxActual === -1) return false;
    return idxActual >= idxPaso;
  }
}