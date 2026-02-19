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

// --- RESPUESTAS (RESPONSE) ---

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
  
  costoTotalImportacion?: number; 

  detalles?: CompraDetalle[];
  pagos?: PagoCompra[];
}

export enum EstadoImportacion {
  ORDENADO = 'ORDENADO',
  EN_TRANSITO = 'EN_TRANSITO',
  EN_ADUANAS = 'EN_ADUANAS',
  EN_ALMACEN = 'EN_ALMACEN',
  CERRADA = 'CERRADA',
  LIQUIDADA = 'LIQUIDADA'
}

export enum TipoTransporte {
  MARITIMO = 'MARITIMO', 
  AEREO = 'AEREO', 
  TERRESTRE = 'TERRESTRE'
}

// =========================================================
// 🚀 ÍTEM DETALLADO DE IMPORTACIÓN
// =========================================================
export interface DetalleItemImportacion {
    id?: number; // ✅ SOLUCIÓN ERROR 1 Y 2: Añadido el ID del ítem

    nombreProducto: string;
    cantidad: number;
    precioUnitarioFob: number; 
    importeFob: number;        
    
    factorParticipacion?: number; 
    
    // --- GRUPO VOLUMEN ---
    itemFlete?: number;
    itemAlmacenaje?: number;
    itemTransporte?: number;
    itemDescarga?: number;
    itemMontacarga?: number;

    // --- GRUPO PESO ---
    itemDesconsolidacion?: number;

    // --- GRUPO VALOR / ADUANA ---
    itemVistosBuenos?: number;
    itemTransmision?: number;
    itemAgente?: number;
    itemVobo?: number;
    itemGastosOp?: number;
    itemResguardo?: number;

    // --- IMPUESTOS ---
    itemAdv?: number; 
    itemIgv?: number;
    itemIpm?: number;
    itemPercepcion?: number;

    // --- OTROS ---
    itemOtros1?: number;
    itemOtros2?: number;

    costoUnitarioLanded: number; 
    costoTotalLanded: number;

    // Variables Front-End
    adValoremUnitarioManual?: number;
    _advTotalOriginal?: number;
}

// =========================================================
// 📄 FACTURA RESUMEN (SÁBANA GENERAL)
// =========================================================
export interface FacturaResumen {
    id: number;
    serie: string;
    numero: string;
    nombreProveedor: string;
    total: number;
    moneda: string;
    pesoNetoKg: number;
    cbm: number;

    proFlete?: number;
    proAlmacenaje?: number;
    proTransporte?: number;
    proPersonalDescarga?: number;
    proMontacarga?: number;
    
    proDesconsolidacion?: number;
    
    proVistosBuenos?: number;
    proTransmision?: number;
    proComisionAgencia?: number;
    proVobo?: number;
    proGastosOperativos?: number;
    proResguardo?: number;
    
    proAdv?: number; 
    proIgv?: number;
    proIpm?: number;
    proPercepcion?: number;
    
    proOtros1?: number;
    proOtros2?: number;
    proOtros3?: number;
    proOtros4?: number;

    costoTotalImportacion: number;
    items?: DetalleItemImportacion[];
}

export interface ImportacionResponse {
  id: number;
  codigoAgrupador: string; 
  estado: EstadoImportacion;
  facturasComerciales?: FacturaResumen[];

  tipoTransporte?: TipoTransporte;
  fechaEstimadaLlegada?: string; 
  fechaLlegadaReal?: string;
  numeroDua?: string;
  trackingNumber?: string;
  agenteAduanas?: string;
  canal?: string;

  sumaFobTotal: number;  
  pesoTotalKg: number;   
  cbmTotal: number; 

  costoFlete: number;
  costoAlmacenajeCft: number;
  costoTransporteSjl: number;
  costoPersonalDescarga: number;
  costoMontacarga: number;
  costoDesconsolidacion: number;
  costoVistosBuenos: number;
  costoTransmision: number;
  costoComisionAgencia: number;
  costoVobo: number;
  costoGastosOperativos: number;
  costoResguardo: number;

  costoAdv: number; 
  costoIgv: number;
  costoIpm: number;
  costoPercepcion: number;

  costoOtros1: number;
  costoOtros2: number;
  costoOtros3: number;
  costoOtros4: number;
}

export interface ImportacionRequest {
  codigoAgrupador?: string; // ✅ SOLUCIÓN ERROR 3: Añadido
  estado?: EstadoImportacion | string; 
  tipoTransporte?: TipoTransporte | string;
  fechaEstimadaLlegada?: Date;
  fechaLlegadaReal?: Date;
  numeroDua?: string;
  trackingNumber?: string;
  agenteAduanas?: string;
  canal?: string;

  costoFlete?: number;
  costoAlmacenajeCft?: number;
  costoTransporteSjl?: number;
  costoPersonalDescarga?: number;
  costoMontacarga?: number;
  costoDesconsolidacion?: number;
  costoVistosBuenos?: number;
  costoTransmision?: number;
  costoComisionAgencia?: number;
  costoVobo?: number;
  costoGastosOperativos?: number;
  costoResguardo?: number;
  
  costoIgv?: number;
  costoIpm?: number;
  costoPercepcion?: number;
  
  // ✅ SOLUCIÓN AL MAPA DE AD VALOREM: Actualizado el nombre a como lo espera la lógica nueva
  adValoremPorItem?: { [key: number]: number };

  costoOtros1?: number;
  costoOtros2?: number;
  costoOtros3?: number;
  costoOtros4?: number;
}