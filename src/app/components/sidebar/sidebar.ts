import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  
  // Recibimos el estado actual del padre
  @Input() isCollapsed = false;
  
  // Enviamos al padre la orden de cerrar la sidebar (para móvil)
  @Output() closeSidebar = new EventEmitter<void>();

  // ✅ NUEVO: Enviamos al padre la orden de alternar (toggle) colapsado/expandido
  @Output() toggleCollapse = new EventEmitter<void>();
  
  logoPath = 'assets/logo-smaf.png';

  constructor() { }

  ngOnInit(): void { }

  onItemClick(): void {
    if (window.innerWidth <= 768) { 
      this.closeSidebar.emit();
    }
  }

  // ✅ NUEVO: Función que se llama al dar clic en el botón de abajo
  toggleSidebarState(): void {
    this.toggleCollapse.emit();
  }
}