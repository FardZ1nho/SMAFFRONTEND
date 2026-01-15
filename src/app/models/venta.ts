export interface Venta {
  id: number;
  codigo: string;
  fechaVenta: Date;
  clienteId?: number;
  nombreCliente?: string;
  tipoCliente: TipoCliente;
  metodoPago: MetodoPago;

  // ✅ PAGO MIXTO
  pagoEfectivo?: number;
  pagoTransferencia?: number;

  // ⭐ NUEVOS CAMPOS (Moneda, Documento y Cambio)
  moneda: string;           
  tipoDocumento: string;    
  numeroDocumento?: string; // <--- ✅ AGREGADO: Faltaba este para el N° de factura/boleta
  tipoCambio: number;       
  
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
  clienteId?: number;
  nombreCliente?: string;
  tipoCliente: TipoCliente;
  metodoPago: MetodoPago;

  // ✅ PAGO MIXTO
  pagoEfectivo?: number;
  pagoTransferencia?: number;

  // ⭐ NUEVOS CAMPOS PARA ENVIAR AL BACKEND
  moneda: string;           
  tipoDocumento: string;    
  numeroDocumento?: string; // <--- ✅ AGREGADO: Importante para guardar el número
  tipoCambio: number;       
  
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
  MIXTO = 'MIXTO'
}

export enum EstadoVenta {
  BORRADOR = 'BORRADOR',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
}