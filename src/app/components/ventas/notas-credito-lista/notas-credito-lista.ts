import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. IMPORTAR ESTO
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import { NotaCreditoService } from '../../../services/nota-credito-service';
import { NotaCredito } from '../../../models/nota-credito';
import { MatDialog } from '@angular/material/dialog';
import { NotaCreditoDetalleComponent } from '../nota-credito-detalle/nota-credito-detalle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-notas-credito-lista',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule, 
    MatChipsModule, MatProgressSpinnerModule,MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './notas-credito-lista.html',
  styleUrls: ['./notas-credito-lista.css']
})
export class NotasCreditoListaComponent implements OnInit {

  dataSource = new MatTableDataSource<NotaCredito>([]);
  isLoading = false;
  
  displayedColumns: string[] = ['codigo', 'ventaRef', 'motivo', 'fecha', 'monto', 'acciones'];

  constructor(
    private notaCreditoService: NotaCreditoService,
    private router: Router,
    private cdr: ChangeDetectorRef, // 2. INYECTAR AQUÍ
    private dialog: MatDialog // ✅ Inyectamos Dialog
  ) {}

  ngOnInit(): void {
    this.cargarNotas();
  }
  // ✅ FUNCIÓN DE FILTRO
  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // ✅ FUNCIÓN PARA ABRIR EL DETALLE
  verDetalle(nota: NotaCredito): void {
    this.dialog.open(NotaCreditoDetalleComponent, {
      width: '750px',
      maxWidth: '95vw',
      data: nota
    });
  }

  cargarNotas(): void {
    this.isLoading = true;
    
    this.notaCreditoService.listarTodas().subscribe({
      next: (data) => {
        console.log('Datos cargados:', data);
        this.dataSource.data = data;
        this.isLoading = false;
        
        // 3. FORZAR ACTUALIZACIÓN DE PANTALLA
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges(); // También en error por si acaso
      }
    });
  }

  volverAVentas(): void {
    this.router.navigate(['/ventas/lista']);
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' 
    });
  }
}