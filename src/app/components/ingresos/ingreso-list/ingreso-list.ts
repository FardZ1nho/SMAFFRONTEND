import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { IngresoService } from '../../../services/ingreso-service';
import { IngresoResponse } from '../../../models/ingreso';
import { IngresoModalComponent } from '../ingreso-modal/ingreso-modal';

@Component({
  selector: 'app-ingreso-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    IngresoModalComponent
  ],
  templateUrl: './ingreso-list.html',
  styleUrls: ['./ingreso-list.css']
})
export class IngresoListComponent implements OnInit {
  ingresos: IngresoResponse[] = [];
  ingresosFiltrados = new MatTableDataSource<IngresoResponse>([]);
  terminoBusqueda: string = '';
  loading: boolean = false;
  mostrarModal: boolean = false;
  
  displayedColumns: string[] = [
    'id',
    'producto',
    'cantidad',
    'proveedor',
    'fecha',
    'observacion',
    'acciones'
  ];

  constructor(
    private ingresoService: IngresoService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.loading = true;
    this.ingresoService.listarHistorial().subscribe({
      next: (data) => {
        this.ingresos = data;
        this.ingresosFiltrados.data = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar historial de ingresos', err);
        this.mostrarMensaje('Error al cargar el historial de ingresos', 'error');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalNuevoIngreso(): void {
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  onRegistroExitoso(): void {
    this.mostrarModal = false;
    this.cargarHistorial();
    this.mostrarMensaje('✅ Ingreso registrado exitosamente', 'success');
  }

  buscarIngresos(): void {
    if (!this.terminoBusqueda.trim()) {
      this.ingresosFiltrados.data = this.ingresos;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase();
    this.ingresosFiltrados.data = this.ingresos.filter(ingreso => 
      ingreso.nombreProducto.toLowerCase().includes(termino) ||
      (ingreso.skuProducto && ingreso.skuProducto.toLowerCase().includes(termino)) ||
      (ingreso.proveedor && ingreso.proveedor.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.ingresosFiltrados.data = this.ingresos;
  }

  verDetalle(ingreso: IngresoResponse): void {
    console.log('Ver detalle:', ingreso);
    // Implementar modal de detalle si es necesario
  }

  editarIngreso(ingreso: IngresoResponse): void {
    console.log('Editar ingreso:', ingreso);
    // Implementar edición si es necesario
  }

  eliminarIngreso(ingreso: IngresoResponse): void {
    if (confirm(`¿Estás seguro de eliminar el ingreso #${ingreso.id}?`)) {
      console.log('Eliminar ingreso:', ingreso);
      // Implementar eliminación
    }
  }

  exportarDatos(): void {
    console.log('Exportar datos');
  }

  abrirFiltros(): void {
    console.log('Abrir filtros');
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}