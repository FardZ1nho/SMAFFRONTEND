import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

// MATERIAL
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs'; // ✅ EL MÓDULO DE PESTAÑAS

import { ImportacionService } from '../../../services/importacion-service';
import { EstadoImportacion, ImportacionResponse } from '../../../models/importacion';

@Component({
  selector: 'app-recepcion-lista',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTabsModule],
  template: `
    <div class="page-container">
      <div class="header">
        <h1>Recepciones de Almacén</h1>
        <p>Gestiona los ingresos de mercadería al inventario físico.</p>
      </div>

      <div *ngIf="loading" class="text-center mt-5">
        <mat-spinner diameter="40" class="mx-auto"></mat-spinner>
      </div>

      <div *ngIf="!loading">
        <mat-tab-group animationDuration="0ms" color="primary">
          
          <mat-tab label="Pendientes ({{pendientes.length}})">
            <div class="grid-cards" *ngIf="pendientes.length > 0">
              <div class="card-recepcion" *ngFor="let imp of pendientes">
                <div class="card-head">
                  <mat-icon class="box-icon status-pending">inventory_2</mat-icon>
                  <div>
                    <h3>{{ imp.codigoAgrupador }}</h3>
                    <span class="badge badge-pending">{{ imp.facturasComerciales?.length || 0 }} Facturas</span>
                  </div>
                </div>
                <button mat-flat-button color="primary" class="w-100 mt-3" (click)="irAChecklist(imp.id)">
                  Iniciar Revisión
                </button>
              </div>
            </div>
            
            <div class="empty-state" *ngIf="pendientes.length === 0">
              <mat-icon>task_alt</mat-icon>
              <p>No hay importaciones esperando recepción.</p>
            </div>
          </mat-tab>

          <mat-tab label="Historial Cerrado ({{cerradas.length}})">
            <div class="grid-cards" *ngIf="cerradas.length > 0">
              <div class="card-recepcion card-closed" *ngFor="let imp of cerradas">
                <div class="card-head">
                  <mat-icon class="box-icon status-closed">check_circle</mat-icon>
                  <div>
                    <h3>{{ imp.codigoAgrupador }}</h3>
                    <span class="badge badge-closed">Ingreso Confirmado</span>
                  </div>
                </div>
                <button mat-stroked-button color="primary" class="w-100 mt-3" (click)="irAChecklist(imp.id)">
                  Ver Checklist de Ingreso
                </button>
              </div>
            </div>

            <div class="empty-state" *ngIf="cerradas.length === 0">
              <mat-icon>history</mat-icon>
              <p>Aún no hay recepciones confirmadas en el historial.</p>
            </div>
          </mat-tab>

        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; background: #f8fafc; min-height: 100vh; font-family: 'Roboto', sans-serif;}
    .header h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin:0; }
    .header p { color: #64748b; margin-top: 4px; margin-bottom: 24px;}
    
    .grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 24px; padding: 10px 0;}
    .card-recepcion { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s;}
    .card-recepcion:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .card-closed { background: #f8fafc; border: 1px dashed #cbd5e1; }
    
    .card-head { display: flex; align-items: center; gap: 16px; }
    .box-icon { font-size: 32px; width: 32px; height: 32px; padding: 8px; border-radius: 8px; }
    .status-pending { color: #2563eb; background: #eff6ff; }
    .status-closed { color: #16a34a; background: #f0fdf4; }
    
    .card-head h3 { margin: 0; font-size: 18px; color: #0f172a; font-weight: 700;}
    .badge { font-size: 12px; padding: 4px 10px; border-radius: 12px; font-weight: 600; display: inline-block; margin-top: 4px;}
    .badge-pending { background: #f1f5f9; color: #475569; }
    .badge-closed { background: #dcfce7; color: #16a34a; }
    
    .w-100 { width: 100%; font-weight: 600; letter-spacing: 0.5px;}
    .mt-3 { margin-top: 16px; }
    .mx-auto { margin: 0 auto; }
    .text-center { text-align: center; }
    
    .empty-state { text-align: center; margin-top: 60px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 60px; width: 60px; height: 60px; margin-bottom: 16px; opacity: 0.5; }
    
    ::ng-deep .mat-mdc-tab-labels { gap: 16px; border-bottom: 1px solid #e2e8f0; }
    ::ng-deep .mat-mdc-tab .mdc-tab__text-label { font-size: 15px; font-weight: 600; letter-spacing: 0.3px;}
  `]
})
export class RecepcionListaComponent implements OnInit {
  pendientes: ImportacionResponse[] = [];
  cerradas: ImportacionResponse[] = [];
  loading: boolean = true;

  constructor(
    private importacionService: ImportacionService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    
    forkJoin({
      pendientes: this.importacionService.listarPorEstado(EstadoImportacion.EN_ALMACEN),
      cerradas: this.importacionService.listarPorEstado(EstadoImportacion.CERRADO as any)
    }).subscribe({
      next: (res) => {
        this.pendientes = res.pendientes;
        this.cerradas = res.cerradas;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error cargando listas", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  irAChecklist(id: number) {
    this.router.navigate(['/recepciones', id]);
  }
}