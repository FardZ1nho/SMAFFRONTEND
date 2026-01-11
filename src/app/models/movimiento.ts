// src/app/models/movimiento.model.ts

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
  usuarioResponsable?: string;
  
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

export interface MovimientoRequest {
  productoId: number;
  almacenOrigenId?: number;
  almacenDestinoId?: number;
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  motivo?: string;
  usuarioResponsable?: string;
  fechaMovimiento?: string;
}

export interface TrasladoRequest {
  productoId: number;
  almacenOrigenId: number;
  almacenDestinoId: number;
  cantidad: number;
  motivo?: string;
}