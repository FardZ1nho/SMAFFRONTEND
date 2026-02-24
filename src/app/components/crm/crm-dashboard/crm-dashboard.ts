import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// IMPORTAMOS TUS SERVICIOS REALES
import { CotizacionService } from '../../../services/cotizacion-service';

@Component({
  selector: 'app-crm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './crm-dashboard.html',
  styleUrls: ['./crm-dashboard.css']
})
export class CrmDashboardComponent implements OnInit {
  
  // Variables reales que se calcularán
  pipelineValor: number = 0;
  cotizacionesActivas: number = 0;
  tasaCierre: number = 0;
  
  isLoading: boolean = true;

  constructor(
    private cotizacionService: CotizacionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.calcularMetricas();
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
}