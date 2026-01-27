import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // ✅ 1. Importar SnackBar
import { Subscription, interval } from 'rxjs';
import { switchMap, retry } from 'rxjs/operators';

import { LoginService } from '../../services/login-service';
import { TareaService } from '../../services/tarea-service'; 
import { TareaPanelComponent } from '../tarea-panel/tarea-panel'; 
import { EstadoTarea } from '../../models/tarea';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatSnackBarModule, // ✅ 2. Agregar al import
    TareaPanelComponent 
  ],
  templateUrl: './topbar.html',
  styleUrls: ['./topbar.css']
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Output() toggleMenu = new EventEmitter<void>();
  
  userName: string = '';
  userRole: string = '';
  tareasPendientesCount: number = 0;
  
  private pollingSubscription: Subscription | undefined;
  private isFirstLoad: boolean = true;

  constructor(
    private loginService: LoginService,
    private tareaService: TareaService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar // ✅ 3. Inyectar servicio
  ) {}

  ngOnInit(): void {
    this.loginService.currentUser$.subscribe(user => {
      this.userName = user?.username || 'Usuario';
      this.userRole = user?.role || '';
      
      if (user) {
        this.actualizarContadorTareas();
        this.iniciarPolling();
      } else {
        this.detenerPolling();
      }
    });
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  iniciarPolling() {
    this.detenerPolling();

    // Revisa cada 5 segundos
    this.pollingSubscription = interval(5000) 
      .pipe(
        switchMap(() => this.tareaService.listarTareas()),
        retry(3)
      )
      .subscribe({
        next: (tareas) => this.procesarTareas(tareas),
        error: (e) => console.error('Error polling', e)
      });
  }

  detenerPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  actualizarContadorTareas() {
    this.tareaService.listarTareas().subscribe({
      next: (tareas) => this.procesarTareas(tareas),
      error: (e) => console.error(e)
    });
  }

  private procesarTareas(tareas: any[]) {
    const newCount = tareas.filter(t => t.estado === EstadoTarea.PENDIENTE).length;
    
    // ✅ DETECCIÓN DE NUEVA TAREA
    if (!this.isFirstLoad && newCount > this.tareasPendientesCount) {
        // 1. Sonido
        this.playNotificationSound();
        
        // 2. Mensajito discreto (SnackBar)
        this.snackBar.open('🔔 Tienes una nueva tarea asignada', 'Ver', {
          duration: 4000,              // Dura 4 segundos
          horizontalPosition: 'right', // Abajo a la derecha
          verticalPosition: 'top',  // Arriba (para que se vea cerca del menú)
          panelClass: ['notification-toast'] // Clase opcional para estilo
        });
    }

    if (this.tareasPendientesCount !== newCount) {
        this.tareasPendientesCount = newCount;
        this.cdr.detectChanges();
    }

    this.isFirstLoad = false;
  }

  playNotificationSound() {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {}
  }

  onToggleMenu(): void { this.toggleMenu.emit(); }

  onLogout(): void {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      this.detenerPolling();
      this.loginService.logout();
    }
  }
}