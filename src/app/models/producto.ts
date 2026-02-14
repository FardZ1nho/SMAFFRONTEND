export interface Producto {
  id: number;
  nombre: string;
  codigo: string;
  // ✅ CAMBIO: Agregado 'KIT'
  tipo: 'PRODUCTO' | 'SERVICIO' | 'KIT' | 'SUMINISTRO'; 
  descripcion?: string;
  
  idCategoria: number;
  nombreCategoria?: string;
  
  stockActual: number;
  stockMinimo: number;
  stockPorLlegar?: number; 

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

  // ✅ NUEVO: Lista de componentes (solo lectura para ver detalles)
  componentes?: ComponenteProducto[];
}

// ✅ INTERFAZ AUXILIAR
export interface ComponenteProducto {
  idProducto: number;
  nombre?: string; // Para mostrar en la tabla
  codigo?: string; // Para mostrar en la tabla
  cantidad: number;
  costoUnitario?: number; // Para calcular costo sugerido
}

export interface ProductoRequest {
  // ✅ CAMBIO: Agregado 'KIT'
  tipo: 'PRODUCTO' | 'SERVICIO' | 'KIT'; 
  
  nombre: string;
  codigo?: string;
  descripcion?: string;
  idCategoria: number;
  stockMinimo: number;
  codigoInternacional?: string;
  
  precioChina?: number;
  costoTotal?: number;
  precioVenta?: number;
  moneda?: string;
  unidadMedida?: string;

  // ✅ NUEVO: Lista para enviar al backend al crear/editar
  componentes?: { idProducto: number, cantidad: number }[];
}

export interface IngresoStockRequest {
  productoId: number;
  almacenId: number;
  cantidad: number;
  ubicacionFisica?: string;
}