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
  
  @Input() isCollapsed = false;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();
  
  logoPath = 'assets/logo-smaf.png';

  // ✅ NUEVO: Variable para controlar el submenú de inventario
  isInventarioOpen = false;

  constructor() { }

  ngOnInit(): void { }

  onItemClick(): void {
    if (window.innerWidth <= 768) { 
      this.closeSidebar.emit();
    }
  }

  toggleSidebarState(): void {
    this.toggleCollapse.emit();
  }

  // ✅ NUEVO: Lógica para abrir/cerrar inventario
  toggleInventario(): void {
    if (this.isCollapsed) {
      // Si la barra está colapsada, la expandimos primero para ver el menú
      this.toggleCollapse.emit();
      this.isInventarioOpen = true;
    } else {
      // Si ya está expandida, solo alternamos el menú
      this.isInventarioOpen = !this.isInventarioOpen;
    }
  }
}