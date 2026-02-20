import { Routes } from '@angular/router';

// COMPONENTES PRINCIPALES
import { Autenticador } from './components/autenticador/autenticador';
import { InicioComponent } from './components/inicio/inicio';
import { InventarioComponent } from './components/inventario/inventario';

// GUARDS
import { seguridadGuard } from './guard/seguridad-guard';

// VENTAS
import { VentasListaComponent } from './components/ventas/ventas-listar/ventas-lista';
import { NotasCreditoListaComponent } from './components/ventas/notas-credito-lista/notas-credito-lista';

// ALMACENES Y MOVIMIENTOS
import { AlmacenesListComponent } from './components/almacenes/almacenes-list/almacenes-list';
import { AlmacenForm } from './components/almacenes/almacen-form/almacen-form';
import { MovimientosListComponent } from './components/movimientos/movimientos-list/movimientos-list';
import { TrasladoFormComponent } from './components/movimientos/traslado-form/traslado-form';

// COMPRAS
import { CompraFormComponent } from './components/compras/compra-form/compra-form'; 

// CONFIGURACION Y OTROS
import { CuentasListaComponent } from './components/configuracion/cuentas-lista/cuentas-lista';
import { ImportacionesListComponent } from './components/importaciones/importaciones-list/importaciones-list';
import { CotizacionListComponent } from './components/cotizaciones/cotizacion-list/cotizacion-list';
import { CotizacionFormComponent } from './components/cotizaciones/cotizacion-form/cotizacion-form';

// RECEPCIONES
import { RecepcionChecklistComponent } from './components/importaciones/recepcion-checklist/recepcion-checklist'; 
import { RecepcionListaComponent } from './components/importaciones/recepcion-lista/recepcion-lista';

export const routes: Routes = [
  // ========== RUTAS BASE ==========
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

  // ========== INVENTARIO ==========
  {
    path: 'inventario',
    component: InventarioComponent,
    canActivate: [seguridadGuard]
  },
  { path: 'inventario/productos', component: InventarioComponent },
  { path: 'inventario/servicios', component: InventarioComponent },
  { path: 'inventario/suministros', component: InventarioComponent },

  // ========== PROVEEDORES (Lazy Loading) ==========
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

  // ========== COMPRAS ==========
  {
    path: 'compras',
    loadComponent: () => import('./components/compras/compras-list/compras-list').then(m => m.ComprasListComponent)
  },
  {
    path: 'compras/nueva',
    loadComponent: () => import('./components/compras/compra-form/compra-form').then(m => m.CompraFormComponent)
  },
  { 
    path: 'compras/editar/:id', 
    component: CompraFormComponent 
  },
  {
    path: 'compras/detalle/:id',
    loadComponent: () => import('./components/compras/compra-detalle/compra-detalle').then(m => m.CompraDetalleComponent)
  },

  // ========== VENTAS ==========
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
    path: 'ventas/notas-credito', 
    component: NotasCreditoListaComponent 
  },
  {
    path: 'ventas/:id', 
    loadComponent: () => import('./components/ventas/ventas').then(m => m.VentasComponent),
    canActivate: [seguridadGuard]
  },

  // ========== COTIZACIONES ==========
  { path: 'cotizaciones', component: CotizacionListComponent },
  { path: 'cotizaciones/nuevo', component: CotizacionFormComponent },

  // ========== IMPORTACIONES Y RECEPCIONES ==========
  { 
    path: 'importaciones', 
    component: ImportacionesListComponent,
    title: 'Gestión de Importaciones' 
  },
  { 
    path: 'importaciones/prorrateo/:id', 
    loadComponent: () => import('./components/importaciones/importacion-prorrateo/importacion-prorrateo').then(m => m.ImportacionProrrateoComponent)
  },
  { 
    path: 'recepciones', 
    component: RecepcionListaComponent,
    title: 'Recepciones Pendientes',
    canActivate: [seguridadGuard] // ✅ Añadida seguridad
  },
  { 
    path: 'recepciones/:id', 
    component: RecepcionChecklistComponent,
    title: 'Checklist de Recepción',
    canActivate: [seguridadGuard] // ✅ Añadida seguridad
  },

  // ========== CLIENTES ==========
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

  // ========== CAJA CHICA ==========
  {
    path: 'caja-chica',
    loadComponent: () => import('./components/caja-chica/caja-chica').then(m => m.CajaChicaComponent),
    canActivate: [seguridadGuard]
  },

  // ========== CONFIGURACIÓN ==========
  { path: 'configuracion/cuentas', component: CuentasListaComponent },

  // ========== ⚠️ RUTA COMODÍN (404) ⚠️ ==========
  // ¡ESTO SIEMPRE DEBE IR AL FINAL DEL ARCHIVO!
  {
    path: '**',
    redirectTo: 'login'
  }
];