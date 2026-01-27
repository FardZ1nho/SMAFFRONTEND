// src/app/models/producto.ts

export interface Producto {
  id: number;
  nombre: string;
  codigo: string;
  tipo: 'PRODUCTO' | 'SERVICIO'; 
  descripcion?: string;
  
  idCategoria: number;
  nombreCategoria?: string;
  
  stockActual: number;
  stockMinimo: number;
  
  // ✅ CAMBIO 1: Agregado para ver lo que viene en barco
  stockPorLlegar?: number; 

  // Precios
  precioChina?: number;
  costoTotal?: number;
  precioVenta?: number;
  moneda?: string;
  unidadMedida?: string;
  
  activo: boolean;
  fechaCreacion?: string;
  estadoStock?: string;
  
  margenGanancia?: number;
  porcentajeMargen?: number;
}

export interface ProductoRequest {
  // ✅ CAMBIO 2: Agregado el tipo obligatorio
  tipo: 'PRODUCTO' | 'SERVICIO'; 
  
  nombre: string;
  codigo?: string;
  descripcion?: string;
  idCategoria: number;
  stockMinimo: number;
  
  precioChina?: number;
  costoTotal?: number;
  precioVenta?: number;
  moneda?: string;
  unidadMedida?: string;
}

export interface IngresoStockRequest {
  productoId: number;
  almacenId: number;
  cantidad: number;
  ubicacionFisica?: string;
}