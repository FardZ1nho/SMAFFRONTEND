import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// IMPORTAMOS TUS SERVICIOS REALES
import { CotizacionService } from '../../../services/cotizacion-service';
import { TareaCrmService } from '../../../services/tarea-crm-service'; 
import { TareaCrmResponse } from '../../../models/tarea-crm'; 

@Component({
  selector: 'app-crm-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './crm-dashboard.html',
  styleUrls: ['./crm-dashboard.css']
})
export class CrmDashboardComponent implements OnInit {
  
  // Variables reales que se calcularán
  pipelineValor: number = 0;
  cotizacionesActivas: number = 0;
  tasaCierre: number = 0;
  
  isLoading: boolean = true;

  // Variables para las tareas
  tareasPendientes: TareaCrmResponse[] = [];

  constructor(
    private cotizacionService: CotizacionService,
    private cdr: ChangeDetectorRef,
    private tareaCrmService: TareaCrmService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.calcularMetricas();
    this.cargarTareasPendientes(); // Cargamos las tareas al iniciar
  }

  calcularMetricas(): void {
    this.isLoading = true;
    this.cotizacionService.listar().subscribe({
      next: (cotizaciones) => {
        
        // 1. Oportunidades Abiertas (Cualquier estado que no sea GANADA, PERDIDA o VENCIDA)
        const activas = cotizaciones.filter(c => 
          c.estado === 'CONTACTO_INICIAL' || 
          c.estado === 'COTIZACION_ENVIADA' || 
          c.estado === 'EN_NEGOCIACION'
        );
        this.cotizacionesActivas = activas.length;

        // 2. Valor del Pipeline (La suma de los totales de las cotizaciones activas)
        this.pipelineValor = activas.reduce((sum, cot) => sum + (cot.total || 0), 0);

        // 3. Tasa de Cierre (Porcentaje de Ganadas sobre el total de cerradas)
        const ganadas = cotizaciones.filter(c => c.estado === 'GANADA').length;
        const perdidas = cotizaciones.filter(c => c.estado === 'PERDIDA').length;
        const totalCerradas = ganadas + perdidas;

        if (totalCerradas > 0) {
          this.tasaCierre = Math.round((ganadas / totalCerradas) * 100);
        } else {
          this.tasaCierre = 0; // Si no ha cerrado ninguna aún
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando métricas:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- MÉTODOS DE TAREAS PENDIENTES ---

  cargarTareasPendientes(): void {
    this.tareaCrmService.obtenerPendientes().subscribe({
      next: (data) => {
        this.tareasPendientes = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar tareas', err);
        this.snackBar.open('Error al cargar las tareas pendientes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  marcarComoCompletada(id: number): void {
    this.tareaCrmService.completarTarea(id).subscribe({
      next: () => {
        this.snackBar.open('¡Tarea completada! Buen trabajo 🚀', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
        this.cargarTareasPendientes(); // Recargamos para actualizar la vista
      },
      error: (err) => {
        console.error('Error al completar', err);
        this.snackBar.open('Error al completar la tarea', 'Cerrar', { duration: 3000, panelClass: 'snackbar-error' });
      }
    });
  }

  obtenerIconoTarea(tipo: string): string {
    switch (tipo) {
      case 'LLAMADA': return 'call';
      case 'CORREO': return 'mail';
      case 'MENSAJE': return 'chat';
      case 'REUNION': return 'groups';
      default: return 'task';
    }
  }
}