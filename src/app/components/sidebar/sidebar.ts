import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() closeSidebar = new EventEmitter<void>(); // Nuevo evento
  
  logoPath = 'assets/logo-smaf.png';

  constructor() { }

  ngOnInit(): void { }

  // Método para manejar el clic en los enlaces
  onItemClick(): void {
    // Solo disparamos el cierre si estamos en móvil
    // Una forma simple es detectar el ancho de la pantalla
    if (window.innerWidth <= 768) { 
      this.closeSidebar.emit();
    }
  }
}