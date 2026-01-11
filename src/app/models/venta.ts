// src/app/models/venta.ts

export interface Venta {
  id: number;
  codigo: string;
  fechaVenta: Date;
  clienteId?: number;          // ⭐ AGREGAR
  nombreCliente?: string;
  tipoCliente: TipoCliente;
  metodoPago: MetodoPago;
  subtotal: number;
  igv: number;
  total: number;
  notas?: string;
  estado: EstadoVenta;
  detalles: DetalleVenta[];
  fechaCreacion: Date;
  fechaActualizacion?: Date;
}

export interface DetalleVenta {
  id?: number;
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface VentaRequest {
  fechaVenta?: Date;
  clienteId?: number;          // ⭐ AGREGAR
  nombreCliente?: string;
  tipoCliente: TipoCliente;
  metodoPago: MetodoPago;
  notas?: string;
  detalles: DetalleVentaRequest[];
}

export interface DetalleVentaRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
}

export enum TipoCliente {
  COMUN = 'COMUN',
  MAYORISTA = 'MAYORISTA',
  DISTRIBUIDOR = 'DISTRIBUIDOR'
}

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  MIXTO = 'MIXTO' // ⭐ AGREGAR
}

export enum EstadoVenta {
  BORRADOR = 'BORRADOR',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
}