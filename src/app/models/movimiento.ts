export interface Movimiento {
  id: number;
  codigo: string;
  
  // Producto
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  
  // Almacenes
  almacenOrigenId?: number;
  almacenOrigenNombre?: string;
  almacenDestinoId?: number;
  almacenDestinoNombre?: string;
  
  // Detalles
  tipoMovimiento: TipoMovimiento;
  tipoMovimientoLabel: string;
  cantidad: number;
  motivo?: string;
  usuarioResponsable?: string; // ✅ Campo para mostrar en el historial
  
  // Fechas
  fechaMovimiento: string;
  fechaCreacion: string;
}

export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  TRASLADO = 'TRASLADO',
  AJUSTE = 'AJUSTE'
}

// ✅ DTO para Traslados (Ya lo tenías)
export interface TrasladoRequest {
  productoId: number;
  almacenOrigenId: number;
  almacenDestinoId: number;
  cantidad: number;
  motivo?: string;
}

// ✅ NUEVO: DTO para Ajustes (Coincide con AjusteRequestDTO del Backend)
export interface AjusteRequest {
  productoId: number;
  almacenId: number;
  cantidad: number;        // Puede ser positivo o negativo
  motivo: string;
  usuarioResponsable: string;
}