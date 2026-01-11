export interface ProductoAlmacen {
  id?: number;
  
  // Información del producto
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  
  // Información del almacén
  almacenId: number;
  almacenCodigo: string;
  almacenNombre: string;
  
  // Stock específico en este almacén
  stock: number;
  ubicacionFisica?: string;
  stockMinimo?: number;
  
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

// DTO para crear/actualizar asignación de producto a almacén
export interface ProductoAlmacenRequest {
  productoId: number;
  almacenId: number;
  stock: number;
  ubicacionFisica?: string;
  stockMinimo?: number;
  activo?: boolean;
}

// DTO para transferencias entre almacenes
export interface TransferenciaStockRequest {
  productoId: number;
  almacenOrigenId: number;
  almacenDestinoId: number;
  cantidad: number;
}

// DTO para ajustes de stock
export interface AjusteStockRequest {
  id: number;
  cantidad: number; // Puede ser positivo (incremento) o negativo (decremento)
  motivo?: string;
}