// src/app/models/compra.ts

// ==========================================
// 🛠️ ENUMS (Para evitar errores de texto)
// ==========================================
export enum TipoCompra {
  BIEN = 'BIEN',
  SERVICIO = 'SERVICIO'
}

export enum TipoPago {
  CONTADO = 'CONTADO',
  CREDITO = 'CREDITO'
}

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  TARJETA = 'TARJETA'
}

export enum EstadoCompra {
  REGISTRADA = 'REGISTRADA',
  COMPLETADA = 'COMPLETADA',
  ANULADA = 'ANULADA'
}

// ==========================================
// 📤 REQUEST: LO QUE ENVIAMOS AL GUARDAR
// ==========================================
export interface CompraRequest {
  tipoCompra: 'BIEN' | 'SERVICIO'; // O usa el Enum TipoCompra
  tipoComprobante: string;
  
  // Obligatorio para definir deuda
  tipoPago: TipoPago; 

  serie: string;
  numero: string;

  // ✅ NUEVO: CÓDIGO DE IMPORTACIÓN (Opcional, solo si es Factura Comercial)
  codImportacion?: string;

  fechaEmision: string; // YYYY-MM-DD
  fechaVencimiento?: string; 

  proveedorId: number;
  moneda: string; // 'PEN' | 'USD'
  tipoCambio: number;
  observaciones?: string;

  // Totales
  subTotal: number;
  igv: number;
  total: number;

  // Impuestos específicos
  percepcion?: number;          
  detraccionPorcentaje?: number; 
  detraccionMonto?: number;      
  retencion?: number;           

  // Lista de pagos iniciales (Ej: Adelanto o Pago total)
  pagos: PagoCompraRequest[];

  detalles: CompraDetalleRequest[];
}

// Sub-interfaz para registrar pagos
export interface PagoCompraRequest {
  metodoPago: MetodoPago;
  monto: number;
  moneda: string;
  cuentaOrigenId?: number; // ID de TU cuenta bancaria de donde sale el dinero
  referencia?: string;     // Nro de operación
}

export interface CompraDetalleRequest {
  productoId: number;
  almacenId?: number | null; 
  cantidad: number;
  precioUnitario: number;
}

// ==========================================
// 📥 RESPONSE: LO QUE RECIBIMOS PARA VER/EDITAR
// ==========================================
export interface CompraResponse {
  id: number;
  
  tipoCompra: string;
  tipoComprobante: string;
  
  // Estados
  tipoPago: TipoPago;
  estado: EstadoCompra; // O string si no usas el Enum estricto

  serie: string;
  numero: string;

  // ✅ NUEVO: RECIBIR EL DATO PARA MOSTRARLO EN EL DETALLE
  codImportacion?: string;
  
  fechaEmision: string;
  fechaVencimiento?: string;
  fechaRegistro: string;

  nombreProveedor: string;
  rucProveedor?: string;

  moneda: string;
  tipoCambio: number;
  observaciones?: string;

  // Montos Base
  subTotal: number;
  igv: number;
  total: number;

  // SALDOS Y DEUDA
  montoPagadoInicial: number;
  saldoPendiente: number;

  // Impuestos
  percepcion?: number;
  detraccionPorcentaje?: number;
  detraccionMonto?: number;
  retencion?: number;
  
  detalles?: CompraDetalleResponse[]; 
  
  // HISTORIAL DE PAGOS REALIZADOS
  pagos?: PagoCompraResponse[];
}

export interface CompraDetalleResponse {
  id: number;
  productoId: number;
  nombreProducto: string;
  codigoProducto: string;
  
  almacenId?: number;
  nombreAlmacen?: string;
  
  cantidad: number;
  precioUnitario: number;
  importeTotal: number; 
}

// Sub-interfaz para listar los pagos en la vista de detalle
export interface PagoCompraResponse {
  id: number;
  monto: number;
  moneda: string;
  metodoPago: string;       // Viene como String del backend .name()
  fechaPago: string;
  referencia?: string;
  nombreCuentaOrigen?: string; // Ej: "BCP Soles - Empresa"
}