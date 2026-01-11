import { Routes } from '@angular/router';
import { Autenticador } from './components/autenticador/autenticador';
import { InicioComponent } from './components/inicio/inicio';
import { InventarioComponent } from './components/inventario/inventario';
import { seguridadGuard } from './guard/seguridad-guard';
import { VentasListaComponent } from './components/ventas/ventas-listar/ventas-lista'; 
import { AlmacenesListComponent } from './components/almacenes/almacenes-list/almacenes-list';
import { AlmacenForm } from './components/almacenes/almacen-form/almacen-form';
import { MovimientosListComponent } from './components/movimientos/movimientos-list/movimientos-list';
import { TrasladoFormComponent } from './components/movimientos/traslado-form/traslado-form';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Autenticador
  },
  {
    path: 'inicio',
    component: InicioComponent,
    canActivate: [seguridadGuard]
  },
  {
    path: 'inventario',
    component: InventarioComponent,
    canActivate: [seguridadGuard]
  },
  {
    path: 'ingresos',
    loadComponent: () => import('./components/ingresos/ingreso-list/ingreso-list').then(m => m.IngresoListComponent),
    canActivate: [seguridadGuard]
  },
  {
    path: 'ventas',
    loadComponent: () => import('./components/ventas/ventas').then(m => m.VentasComponent),
    canActivate: [seguridadGuard]
  },
  {
    path: 'ventas/lista',
    component: VentasListaComponent,
    canActivate: [seguridadGuard]
  },
  {
    path: 'clientes',
    loadComponent: () => import('./components/cliente/cliente').then(m => m.ClientesComponent),
    canActivate: [seguridadGuard]
  },
  
  // ========== ALMACENES ==========
  {
    path: 'almacenes',
    component: AlmacenesListComponent,
    canActivate: [seguridadGuard]
  },
  {
    path: 'almacenes/nuevo',
    component: AlmacenForm,
    canActivate: [seguridadGuard]
  },
  {
    path: 'almacenes/editar/:id',
    component: AlmacenForm,
    canActivate: [seguridadGuard]
  },

  // ========== MOVIMIENTOS ==========
  {
    path: 'movimientos',
    component: MovimientosListComponent,
    canActivate: [seguridadGuard]
  },
  {
    path: 'movimientos/traslado',
    component: TrasladoFormComponent,
    canActivate: [seguridadGuard]
  },

  // Ruta por defecto
  {
    path: '**',
    redirectTo: 'login'
  }
];