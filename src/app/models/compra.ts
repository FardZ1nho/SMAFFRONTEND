// ✅ 1. ENUMS
export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  DEPOSITO = 'DEPOSITO',
  CHEQUE = 'CHEQUE',
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  TARJETA = 'TARJETA',
  OTROS = 'OTROS'
}

export enum TipoPago {
  CONTADO = 'CONTADO',
  CREDITO = 'CREDITO'
}

// ✅ 2. DTO REQUEST DETALLE
export interface CompraDetalleRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  almacenId?: number;
}

// ✅ 3. DTO REQUEST PAGO
export interface PagoCompraRequest {
  monto: number;
  moneda: string;
  metodoPago: MetodoPago;
  referencia?: string;
  cuentaOrigenId?: number;
}

// ✅ 4. DTO PRINCIPAL REQUEST (GUARDAR)
export interface CompraRequest {
  proveedorId: number;
  tipoCompra: 'BIEN' | 'SERVICIO';
  tipoComprobante: 'FACTURA_COMERCIAL' | 'FACTURA_ELECTRONICA' | 'BOLETA' | 'RECIBO' | 'GUIA_REMISION' | 'NOTA_VENTA' | 'RECIBO_HONORARIOS' | 'RECIBO_SIMPLE' | 'OTROS';
  tipoPago: TipoPago;
  
  serie: string;
  numero: string;
  
  fechaEmision: string | Date; // Flexible para evitar errores de formato
  fechaVencimiento?: string | Date;
  
  moneda: 'PEN' | 'USD';
  tipoCambio: number;
  observaciones?: string;
  
  // Totales
  subTotal: number;
  fob?: number; 
  igv: number;
  total: number;
  
  // Impuestos Locales
  percepcion?: number;
  detraccionPorcentaje?: number;
  detraccionMonto?: number;
  retencion?: number;
  
  // Importación
  codImportacion?: string;
  pesoNetoKg?: number;
  cbm?: number; // ✅ VOLUMEN (Antes bultos)
  
  // Listas
  detalles: CompraDetalleRequest[];
  pagos?: PagoCompraRequest[];
}

// --- RESPUESTAS (RESPONSE - LO QUE RECIBES EN LA LISTA) ---

export interface CompraDetalle {
  id: number;
  productoId: number;
  nombreProducto: string;
  codigoProducto: string; 
  cantidad: number;
  precioUnitario: number;
  importe: number;
  nombreAlmacen?: string;
}

export interface PagoCompra {
  id: number;
  monto: number;
  moneda: string;
  metodoPago: string;
  fechaPago: string; 
  referencia: string;
  nombreCuentaOrigen?: string;
}

export interface CompraResponse {
  id: number;
  tipoCompra: string;
  tipoComprobante: string;
  tipoPago: string;
  estado: string;
  
  serie: string;
  numero: string;
  
  fechaEmision: string;
  fechaVencimiento: string;
  fechaRegistro: string;
  
  nombreProveedor: string;
  rucProveedor: string;
  
  moneda: string;
  tipoCambio: number;
  
  subTotal: number;
  fob?: number; 
  igv: number;
  total: number;
  
  saldoPendiente: number;
  montoPagado: number; // A veces el backend puede no mandarlo si no se calculó
  
  observaciones?: string;
  
  percepcion?: number;
  detraccionPorcentaje?: number;
  detraccionMonto?: number;
  retencion?: number;
  
  // Importación
  codImportacion?: string;
  pesoNetoKg?: number;
  cbm?: number; // ✅ Actualizado
  importacionId?: number;
  
  // ==========================================
  // 📊 RESULTADOS DEL PRORRATEO (Backend)
  // ==========================================
  proFlete?: number;
  proAlmacenaje?: number;
  proTransporte?: number;
  proCargaDescarga?: number;

  proDesconsolidacion?: number;

  proGastosAduaneros?: number;
  proSeguroResguardo?: number;
  proImpuestos?: number;
  proOtrosGastos?: number;

  costoTotalImportacion?: number; // Landed Cost Final

  detalles?: CompraDetalle[];
  pagos?: PagoCompra[];
}