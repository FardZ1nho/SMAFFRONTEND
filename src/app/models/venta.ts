// ==========================================
// INTERFACES PRINCIPALES (Respuesta del Backend)
// ==========================================

export interface Venta {
  id: number;
  codigo: string;
  fechaVenta: Date;
  clienteId?: number;
  nombreCliente?: string;
  tipoCliente: TipoCliente;

  // Tipo de Pago (Contado vs Crédito)
  tipoPago: TipoPago; 

  metodoPago: MetodoPago;

  // ✅ NUEVO: Información de la Cuenta Bancaria (Para Venta Inicial/Total)
  cuentaBancariaId?: number;
  nombreCuentaBancaria?: string; // Ej: "Yape Patrick"

  // PAGO MIXTO
  pagoEfectivo?: number;
  pagoTransferencia?: number;

  // CAMPOS DE CRÉDITO
  montoInicial?: number;
  numeroCuotas?: number;
  montoCuota?: number;     
  saldoPendiente?: number; 

  // HISTORIAL DE PAGOS (Amortizaciones)
  pagos?: Pago[]; 

  // Moneda, Documento y Cambio
  moneda: string;           
  tipoDocumento: string;    
  numeroDocumento?: string; 
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

// ✅ INTERFAZ PARA EL HISTORIAL DE PAGOS (Cuotas)
export interface Pago {
  id: number;
  monto: number;
  fechaPago: string;
  metodoPago: MetodoPago;
  
  // ✅ Dónde entró este pago específico
  cuentaDestinoId?: number; 
  nombreCuenta?: string;    
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
  
  // Obligatorio enviar si es Contado o Crédito
  tipoPago: TipoPago;

  metodoPago: MetodoPago;

  // ✅ NUEVO: Seleccionar Cuenta al crear la venta (Si es Yape/Plin/Etc)
  cuentaBancariaId?: number; 

  // PAGO MIXTO
  pagoEfectivo?: number;
  pagoTransferencia?: number;

  // CAMPOS PARA SOLICITAR CRÉDITO
  montoInicial?: number;
  numeroCuotas?: number;

  // Moneda y Documento
  moneda: string;           
  tipoDocumento: string;    
  numeroDocumento?: string; 
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
  MIXTO = 'MIXTO'
}

export enum EstadoVenta {
  BORRADOR = 'BORRADOR',
  PENDIENTE = 'PENDIENTE',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
}