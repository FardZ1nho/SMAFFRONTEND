import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router'; // ✅ IMPORTANTE: Importar Router

import { ImportacionResponse, ImportacionRequest, EstadoImportacion, Incoterm, TipoTransporte } from '../../../models/importacion';
import { ImportacionService } from '../../../services/importacion-service';

@Component({
  selector: 'app-importacion-editar-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatIconModule, MatSnackBarModule,
    MatDividerModule, MatTooltipModule
  ],
  templateUrl: './importacion-editar-modal.html',
  styleUrls: ['./importacion-editar-modal.css']
})
export class ImportacionEditarModalComponent implements OnInit {

  form: ImportacionRequest = {
    numeroDua: '',
    trackingNumber: '',
    
    // Fechas
    fechaCutOffDocumental: undefined,
    fechaCutOffFisico: undefined,
    fechaSalidaEstimada: undefined,
    fechaEstimadaLlegada: undefined,
    fechaLlegadaReal: undefined,
    fechaLevanteAutorizado: undefined,
    fechaNacionalizacion: undefined,
    fechaLimiteDevolucion: undefined,

    // Logística
    paisOrigen: '',
    puertoEmbarque: '',
    puertoLlegada: '',
    incoterm: undefined,
    tipoTransporte: undefined,
    navieraAerolinea: '',
    numeroViaje: '',
    numeroContenedor: '',
    diasLibres: undefined,

    // Costos (Se mantienen en objeto para no romper backend)
    costoFlete: 0,
    costoSeguro: 0,
    impuestosAduanas: 0,
    gastosOperativos: 0,
    costoTransporteLocal: 0,

    estado: EstadoImportacion.ORDENADO
  };

  estados = Object.values(EstadoImportacion);
  incoterms = Object.values(Incoterm);
  tiposTransporte = Object.values(TipoTransporte);
  isSaving: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ImportacionEditarModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportacionResponse,
    private importacionService: ImportacionService,
    private snackBar: MatSnackBar,
    private router: Router // ✅ INYECCIÓN DEL ROUTER
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.cargarDatosExistentes();
    }
  }

  cargarDatosExistentes() {
    this.form.numeroDua = this.data.numeroDua;
    this.form.trackingNumber = this.data.trackingNumber;
    
    this.form.paisOrigen = this.data.paisOrigen;
    this.form.puertoEmbarque = this.data.puertoEmbarque;
    this.form.puertoLlegada = this.data.puertoLlegada;
    this.form.incoterm = this.data.incoterm;
    this.form.tipoTransporte = this.data.tipoTransporte;
    this.form.navieraAerolinea = this.data.navieraAerolinea;
    this.form.numeroViaje = this.data.numeroViaje;
    this.form.numeroContenedor = this.data.numeroContenedor;
    this.form.diasLibres = this.data.diasLibres;

    // Costos
    this.form.costoFlete = this.data.costoFlete || 0;
    this.form.costoSeguro = this.data.costoSeguro || 0;
    this.form.impuestosAduanas = this.data.impuestosAduanas || 0;
    this.form.gastosOperativos = this.data.gastosOperativos || 0;
    this.form.costoTransporteLocal = this.data.costoTransporteLocal || 0;

    this.form.estado = this.data.estado;

    // Fechas
    if(this.data.fechaCutOffDocumental) this.form.fechaCutOffDocumental = new Date(this.data.fechaCutOffDocumental);
    if(this.data.fechaCutOffFisico) this.form.fechaCutOffFisico = new Date(this.data.fechaCutOffFisico);
    if(this.data.fechaSalidaEstimada) this.form.fechaSalidaEstimada = new Date(this.data.fechaSalidaEstimada);
    if(this.data.fechaEstimadaLlegada) this.form.fechaEstimadaLlegada = new Date(this.data.fechaEstimadaLlegada);
    if(this.data.fechaLlegadaReal) this.form.fechaLlegadaReal = new Date(this.data.fechaLlegadaReal);
    if(this.data.fechaLevanteAutorizado) this.form.fechaLevanteAutorizado = new Date(this.data.fechaLevanteAutorizado);
    if(this.data.fechaNacionalizacion) this.form.fechaNacionalizacion = new Date(this.data.fechaNacionalizacion);
    if(this.data.fechaLimiteDevolucion) this.form.fechaLimiteDevolucion = new Date(this.data.fechaLimiteDevolucion);
  }

  // ✅ MÉTODO PARA IR AL DETALLE
  irADetalleCompra(): void {
    this.dialogRef.close(); // Cerramos el modal primero
    // Asumiendo que tu ruta es /compras/detalle/:id
    if (this.data.compra && this.data.compra.id) {
      this.router.navigate(['/compras/detalle', this.data.compra.id]);
    } else {
      this.snackBar.open('No se encontró el ID de la compra', 'Cerrar', { duration: 3000 });
    }
  }

  guardar(): void {
    this.isSaving = true;
    this.importacionService.actualizarImportacion(this.data.id, this.form).subscribe({
      next: (res) => {
        this.snackBar.open('Importación actualizada correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error al guardar cambios', 'Cerrar', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  getLabelEstado(est: string): string { 
    return est.replace(/_/g, ' '); 
  }
}