import { Component, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';


import { TopbarComponent } from './components/topbar/topbar';
import { SidebarComponent } from './components/sidebar/sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,       
    RouterOutlet,
    TopbarComponent,
    SidebarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('smaf');
  
  isSidebarCollapsed = false;
  private currentUrl = '';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl = event.url;
    });
  }

  ngOnInit() {
    this.currentUrl = this.router.url;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  mostrarMenu(): boolean {
    // Solo acceder a sessionStorage en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const token = sessionStorage.getItem('token');
      
      const rutasSinMenu = ['/login', '/'];
      const esRutaSinMenu = rutasSinMenu.some(ruta => 
        this.currentUrl === ruta || this.currentUrl.startsWith(ruta + '?')
      );
      
      return !!token && !esRutaSinMenu;
    }
    return false;
  }
}