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
  
  fechaEmision: string | Date; 
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
  cbm?: number; 
  
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
  
  // Opcional: Si quisieras ver el costo landed en el detalle de la compra también
  costoUnitarioLanded?: number;
  costoTotalLanded?: number;
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
  montoPagado: number; 
  
  observaciones?: string;
  
  percepcion?: number;
  detraccionPorcentaje?: number;
  detraccionMonto?: number;
  retencion?: number;
  
  // Importación
  codImportacion?: string;
  pesoNetoKg?: number;
  cbm?: number; 
  importacionId?: number;
  
  // ==========================================
  // 📊 RESULTADOS DEL PRORRATEO (DETALLADO)
  // ==========================================
  
  // Grupo Volumen
  proFlete?: number;
  proAlmacenaje?: number;
  proTransporte?: number;
  proPersonalDescarga?: number; // Nuevo
  proMontacarga?: number;       // Nuevo

  // Grupo Peso
  proDesconsolidacion?: number;

  // Grupo Valor / Aduanas
  proVistosBuenos?: number;     // Nuevo
  proTransmision?: number;      // Nuevo
  proComisionAgencia?: number;  // Nuevo
  proVobo?: number;             // Nuevo
  proGastosOperativos?: number; // Nuevo
  proResguardo?: number;        // Nuevo

  // Grupo Impuestos
  proAdv?: number;              // Nuevo (Ad Valorem)
  proIgv?: number;              // Nuevo (Desglosado)
  proIpm?: number;              // Nuevo (Desglosado)
  proPercepcion?: number;       // Nuevo (Desglosado)

  // Grupo Otros
  proOtros1?: number;           // Nuevo
  proOtros2?: number;           // Nuevo
  proOtros3?: number;           // Nuevo
  proOtros4?: number;           // Nuevo

  // Campos Agrupados (Se mantienen por si el backend envía ambos)
  proCargaDescarga?: number;
  proGastosAduaneros?: number;
  proSeguroResguardo?: number;
  proImpuestos?: number;
  proOtrosGastos?: number;

  costoTotalImportacion?: number; // Landed Cost Final

  detalles?: CompraDetalle[];
  pagos?: PagoCompra[];
}