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

// ✅ 2. DTO para enviar el Detalle al guardar (Request)
export interface CompraDetalleRequest {
    productoId: number;
    cantidad: number;
    precioUnitario: number;
    almacenId?: number;
}

// ✅ 3. DTO para enviar el Pago inicial al guardar (Request)
export interface PagoCompraRequest {
    monto: number;
    moneda: string;
    metodoPago: MetodoPago;
    referencia?: string;
    cuentaOrigenId?: number;
}

// ✅ 4. DTO PRINCIPAL para el Formulario de Nueva Compra (Request)
export interface CompraRequest {
    proveedorId: number;
    tipoCompra: 'BIEN' | 'SERVICIO';
    tipoComprobante: 'FACTURA_COMERCIAL' | 'FACTURA_ELECTRONICA' | 'BOLETA' | 'RECIBO' | 'GUIA_REMISION' | 'NOTA_VENTA' | 'RECIBO_HONORARIOS' | 'RECIBO_SIMPLE' | 'OTROS';
    tipoPago: TipoPago;
    
    serie: string;
    numero: string;
    
    fechaEmision: Date;
    fechaVencimiento?: Date;
    
    moneda: 'PEN' | 'USD';
    tipoCambio: number;
    observaciones?: string;
    
    // Totales
    subTotal: number;
    igv: number;
    total: number;
    
    // Impuestos
    percepcion?: number;
    detraccionPorcentaje?: number;
    detraccionMonto?: number;
    retencion?: number;
    
    // Importación
    codImportacion?: string;
    pesoNetoKg?: number;
    bultos?: number;
    
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
    igv: number;
    total: number;
    
    saldoPendiente: number;
    montoPagado: number;
    
    observaciones?: string;
    
    // Impuestos
    percepcion?: number;
    detraccionPorcentaje?: number;
    detraccionMonto?: number;
    retencion?: number;
    
    // Importación
    codImportacion?: string;
    pesoNetoKg?: number;
    bultos?: number;
    importacionId?: number;
    
    // ✅ COSTOS PRORRATEADOS (Aquí estaban los errores)
    costoTotalImportacion?: number;    // Landed Cost
    prorrateoFlete?: number;           // Parte del Flete
    prorrateoSeguro?: number;          // Parte del Seguro
    prorrateoGastosAduanas?: number;   // Parte de Gastos Varios

    detalles?: CompraDetalle[];
    pagos?: PagoCompra[];
}