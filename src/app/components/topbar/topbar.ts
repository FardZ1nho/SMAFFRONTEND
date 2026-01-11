import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { LoginService } from '../../services/login-service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './topbar.html',
  styleUrls: ['./topbar.css']
})
export class TopbarComponent implements OnInit {
  @Output() toggleMenu = new EventEmitter<void>();
  
  userName: string = '';
  userRole: string = '';

  constructor(private loginService: LoginService) {}

  ngOnInit(): void {
    // Suscribirse a los cambios del usuario
    this.loginService.currentUser$.subscribe(user => {
      this.userName = user?.username || 'Usuario';
      this.userRole = user?.role || '';
    });
  }

  onToggleMenu(): void {
    this.toggleMenu.emit();
  }

  onLogout(): void {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      this.loginService.logout();
    }
  }
}