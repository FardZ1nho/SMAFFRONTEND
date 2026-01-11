// src/app/models/producto.ts
import { ProductoAlmacen } from './producto-almacen';

export interface Producto {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  idCategoria: number;
  nombreCategoria: string;
  
  // ✅ STOCK TOTAL (calculado, suma de todos los almacenes)
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number;
  
  // ❌ ELIMINADO: ubicacionAlmacen (ahora está en ProductoAlmacen)
  // ubicacionAlmacen?: string;
  
  // ✅ NUEVO: Lista de almacenes donde está el producto
  productosAlmacen?: ProductoAlmacen[];
  
  // Precios
  precioChina?: number;
  costoTotal?: number;
  precioVenta?: number;
  moneda?: string;
  
  unidadMedida?: string;
  activo: boolean;
  fechaCreacion: Date;
  estadoStock: 'AGOTADO' | 'BAJO' | 'NORMAL' | 'ALTO';
  necesitaReorden: boolean;
  
  // Campos calculados
  margenGanancia?: number;
  porcentajeMargen?: number;
}

export interface ProductoRequest {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  idCategoria: number;
  
  // ❌ ELIMINADOS: stockActual y ubicacionAlmacen
  // stockActual: number;
  // ubicacionAlmacen?: string;
  
  stockMinimo: number; // ✅ Este se mantiene como stock mínimo general
  
  // Precios
  precioChina?: number;
  costoTotal?: number;
  precioVenta?: number;
  moneda?: string;
  
  unidadMedida?: string;
}