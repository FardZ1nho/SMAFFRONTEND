import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { DashboardService } from '../../services/dashboard-service'; 
import { DashboardAlerta } from '../../models/dashboard'; 

@Component({
  selector: 'app-llegadas-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule, MatTooltipModule],
  templateUrl: './llegadas-widget.html',
  styleUrls: ['./llegadas-widget.css']
})
export class LlegadasWidgetComponent implements OnInit {
  
  alertas: DashboardAlerta[] = [];
  isLoading: boolean = true;

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.cargarAlertas();
  }

  cargarAlertas() {
    this.isLoading = true;
    this.cdr.detectChanges(); 

    this.dashboardService.obtenerProximasLlegadas().subscribe({
      next: (data) => {
        // ✅ EL FILTRO MÁGICO: Solo guardamos las que NO estén cerradas.
        // Usamos '(alerta as any)' para evitar el error de TypeScript si 'estado' no está en tu interface DashboardAlerta
        this.alertas = data.filter((alerta: any) => alerta.estado !== 'CERRADO' && alerta.estado !== 'RECIBIDO');
        
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error cargando alertas', err);
        this.isLoading = false;
        this.cdr.detectChanges(); 
      }
    });
  }

  // Determina el color basado en días restantes
  getUrgencyClass(dias: number): string {
    if (dias < 0) return 'urgent'; // Atrasado (Rojo)
    if (dias <= 2) return 'urgent'; // Crítico 0-2 días (Rojo)
    if (dias <= 7) return 'soon';   // Pronto 3-7 días (Naranja)
    return 'normal';                // Normal >7 días (Azul/Gris)
  }

  irAImportacion(id: number) {
    this.router.navigate(['/importaciones'], { queryParams: { searchId: id } });
  }
}