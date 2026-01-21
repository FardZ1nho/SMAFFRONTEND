// ==========================================
// INTERFACES PRINCIPALES (Respuesta del Backend)
// ==========================================

export interface Venta {
  id: number;
  codigo: string;
  fechaVenta: string; // String por LocalDateTime
  clienteId?: number;
  nombreCliente?: string;
  tipoCliente: TipoCliente;

  // Tipo de Pago (Contado vs Crédito)
  tipoPago: TipoPago; 
  
  // Estado de la venta
  estado: EstadoVenta;

  // CAMPOS DE CRÉDITO
  montoInicial?: number; // Se calcula sumando los pagos iniciales
  numeroCuotas?: number;
  montoCuota?: number;     
  saldoPendiente?: number; 

  // ✅ HISTORIAL DE PAGOS REALIZADOS
  pagos?: Pago[]; 

  // Moneda y Totales de la Venta
  moneda: string;           
  tipoCambio: number;       
  
  tipoDocumento: string;    
  numeroDocumento?: string; 
  
  subtotal: number;
  igv: number;
  total: number;
  notas?: string;

  detalles: DetalleVenta[];
  fechaCreacion: string;
  fechaActualizacion?: string;
}

// ✅ INTERFAZ DE RESPUESTA DE PAGO (Lo que viene del backend)
export interface Pago {
  id: number;
  monto: number;
  moneda: string; // 'PEN' | 'USD'
  fechaPago: string;
  metodoPago: MetodoPago;
  referencia?: string; // Nro Operación
  
  // Datos de la cuenta destino (si aplica)
  cuentaDestinoId?: number; 
  nombreCuentaDestino?: string;    
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

// ==========================================
// INTERFACES DE REQUEST (Para enviar al Backend)
// ==========================================

export interface VentaRequest {
  fechaVenta?: Date;
  clienteId?: number;
  nombreCliente?: string;
  tipoCliente: TipoCliente;
  
  // Define si hay deuda o no
  tipoPago: TipoPago;

  // ✅ NUEVO: LISTA DE PAGOS DINÁMICA
  // Reemplaza a pagoEfectivo, pagoTransferencia, metodoPago suelto, etc.
  pagos: PagoRequest[];

  // CAMPOS PARA SOLICITAR CRÉDITO
  // (El montoInicial se deduce de la suma de 'pagos')
  numeroCuotas?: number;

  // Moneda y Documento
  moneda: string;           
  tipoCambio: number;       
  tipoDocumento: string;    
  numeroDocumento?: string; 
  
  notas?: string;
  detalles: DetalleVentaRequest[];
}

// ✅ NUEVO: ESTRUCTURA PARA REGISTRAR UN PAGO INDIVIDUAL
export interface PagoRequest {
  metodoPago: MetodoPago;
  monto: number;
  moneda: string; // La moneda en la que paga el cliente (puede ser distinta a la venta)
  cuentaBancariaId?: number; // Opcional (Solo para Yape/Plin/Transferencia)
  referencia?: string; // Opcional (Nro operación)
}

export interface DetalleVentaRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
}

// ==========================================
// ENUMS
// ==========================================

export enum TipoCliente {
  COMUN = 'COMUN',
  MAYORISTA = 'MAYORISTA',
  DISTRIBUIDOR = 'DISTRIBUIDOR'
}

export enum TipoPago {
  CONTADO = 'CONTADO',
  CREDITO = 'CREDITO'
}

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  // MIXTO ya no es necesario como método único, pero no estorba si lo dejas.
  // Ahora "Mixto" es simplemente enviar varios objetos en el array 'pagos'.
}

export enum EstadoVenta {
  BORRADOR = 'BORRADOR',
  PENDIENTE = 'PENDIENTE',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
}