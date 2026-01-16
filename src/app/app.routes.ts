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
import { NotasCreditoListaComponent } from './components/ventas/notas-credito-lista/notas-credito-lista';
import { ProveedorComponent } from './components/proveedor/proveedor';
import { CompraDetalleComponent } from './components/compras/compra-detalle/compra-detalle';
import { CuentasListaComponent } from './components/configuracion/cuentas-lista/cuentas-lista';

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
  // --- AQUI AGREGAMOS PROVEEDORES ---
  {
    path: 'proveedores',
    loadComponent: () => import('./components/proveedor/proveedor').then(m => m.ProveedorComponent)
  },
  {
    path: 'proveedores/nuevo',
    loadComponent: () => import('./components/proveedor/proveedor-form/proveedor-form').then(m => m.ProveedorFormComponent)
  },
  {
    path: 'proveedores/editar/:id',
    loadComponent: () => import('./components/proveedor/proveedor-form/proveedor-form').then(m => m.ProveedorFormComponent)
  },
  // ----------------------------------
  {
    path: 'compras',
    children: [
      {
        path: '', // Ruta: /compras (Muestra la lista)
        loadComponent: () => import('./components/compras/compras-list/compras-list').then(m => m.ComprasListComponent),
        // canActivate: [seguridadGuard] // Descomenta si usas guard
      },
      {
        path: 'nueva', // Ruta: /compras/nueva (Muestra el formulario)
        loadComponent: () => import('./components/compras/compra-form/compra-form').then(m => m.CompraFormComponent),
        // canActivate: [seguridadGuard]
      }
    ]
  },
  { path: 'configuracion/cuentas', component: CuentasListaComponent },

  // En tus rutas:
  {
    path: 'compras/detalle/:id',
    loadComponent: () => import('./components/compras/compra-detalle/compra-detalle').then(m => m.CompraDetalleComponent)
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

  { path: 'ventas/notas-credito', component: NotasCreditoListaComponent },

  {
    path: 'ventas/:id',
    loadComponent: () => import('./components/ventas/ventas').then(m => m.VentasComponent),
    canActivate: [seguridadGuard]
  },

  // Ruta por defecto
  {
    path: '**',
    redirectTo: 'login'
  }
];