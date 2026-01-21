// src/app/models/producto.ts

export interface Producto {
  id: number;
  nombre: string;
  codigo: string;
  // 👇 ASEGÚRATE DE QUE ESTO ESTÉ AQUÍ TAMBIÉN
  tipo: 'PRODUCTO' | 'SERVICIO'; 
  descripcion?: string;
  
  idCategoria: number;
  nombreCategoria?: string;
  
  stockActual: number;
  stockMinimo: number;
  
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

// 👇 AQUÍ ES DONDE TE FALTA EL CAMPO "tipo"
export interface ProductoRequest {
  tipo: 'PRODUCTO' | 'SERVICIO'; // 👈 ¡AGREGA ESTA LÍNEA!
  
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