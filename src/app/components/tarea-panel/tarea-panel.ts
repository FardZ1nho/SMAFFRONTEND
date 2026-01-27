import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // ✅ Importar OnDestroy
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, interval } from 'rxjs'; // ✅ Importar para el Polling
import { switchMap } from 'rxjs/operators';

import { TareaService } from '../../services/tarea-service';
import { LoginService } from '../../services/login-service';
import { Tarea, EstadoTarea } from '../../models/tarea';
import { TareaModalComponent } from '../tarea-modal/tarea-modal';

@Component({
  selector: 'app-tarea-panel',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule, MatTabsModule, 
    MatCheckboxModule, MatDialogModule, MatProgressSpinnerModule
  ],
  templateUrl: './tarea-panel.html',
  styleUrls: ['./tarea-panel.css']
})
export class TareaPanelComponent implements OnInit, OnDestroy { // ✅ Implementar OnDestroy
  
  tareasPendientes: Tarea[] = [];
  tareasCompletadas: Tarea[] = [];
  isAdmin: boolean = false;
  isLoading: boolean = false;
  
  private pollingSubscription: Subscription | undefined; // ✅ Variable para el temporizador

  constructor(
    private tareaService: TareaService,
    private loginService: LoginService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loginService.currentUser$.subscribe(user => {
      this.isAdmin = user?.role === 'ADMIN'; 
      
      // ✅ Iniciar la carga automática
      this.cargarTareas();     // Carga inicial inmediata
      this.iniciarPolling();   // Carga repetitiva
    });
  }

  ngOnDestroy(): void {
    this.detenerPolling(); // ✅ Limpiar memoria al cerrar el componente
  }

  // ==========================================
  // 🔄 AUTO-REFRESCO (POLLING)
  // ==========================================
  iniciarPolling() {
    this.detenerPolling();

    // Consultar cada 5 segundos mientras el panel esté abierto
    this.pollingSubscription = interval(5000) 
      .pipe(switchMap(() => this.tareaService.listarTareas()))
      .subscribe({
        next: (data) => this.procesarDatos(data),
        error: (e) => console.error('Error polling panel', e)
      });
  }

  detenerPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }
  // ==========================================

  cargarTareas() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.tareaService.listarTareas().subscribe({
      next: (data) => {
        this.procesarDatos(data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error(e);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Método auxiliar para actualizar las listas sin repetir código
  procesarDatos(data: Tarea[]) {
    this.tareasPendientes = data.filter(t => t.estado === EstadoTarea.PENDIENTE);
    this.tareasCompletadas = data.filter(t => t.estado === EstadoTarea.COMPLETADA);
    this.cdr.detectChanges(); // 🔔 Importante para refrescar la vista
  }

  toggleCompletar(tarea: Tarea, completada: boolean) {
    const nuevoEstado = completada ? EstadoTarea.COMPLETADA : EstadoTarea.PENDIENTE;
    
    // Feedback visual inmediato (optimista)
    this.isLoading = true;
    this.cdr.detectChanges();

    this.tareaService.cambiarEstado(tarea.id, nuevoEstado).subscribe({
      next: () => this.cargarTareas(), // Recargar para confirmar
      error: () => {
        alert('Error al actualizar tarea');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirNuevaTarea() {
    const dialogRef = this.dialog.open(TareaModalComponent, { width: '600px' });
    dialogRef.afterClosed().subscribe(res => { if(res) this.cargarTareas(); });
  }

  getPrioridadColor(prioridad: string): string {
    if (prioridad === 'ALTA') return '#ef4444';
    if (prioridad === 'MEDIA') return '#f59e0b';
    return '#10b981';
  }
}