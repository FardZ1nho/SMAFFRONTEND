// Enum para que el selector de motivos tenga valores controlados
// Deben coincidir EXACTAMENTE con tu backend Java (MotivoNota)
export enum MotivoNota {
    ANULACION_DE_LA_OPERACION = 'ANULACION_DE_LA_OPERACION',
    ANULACION_POR_ERROR_EN_RUC = 'ANULACION_POR_ERROR_EN_RUC',
    CORRECCION_POR_ERROR_EN_LA_DESCRIPCION = 'CORRECCION_POR_ERROR_EN_LA_DESCRIPCION',
    DESCUENTO_GLOBAL = 'DESCUENTO_GLOBAL',
    DEVOLUCION_TOTAL = 'DEVOLUCION_TOTAL',
    DEVOLUCION_POR_ITEM = 'DEVOLUCION_POR_ITEM'
}

// Lo que envías al Backend para CREAR la nota
export interface NotaCreditoRequest {
    ventaId: number;
    motivo: MotivoNota | string; // Permitimos string por si viene del select
    monto: number;
    observaciones?: string;
}

// Lo que recibes del Backend para MOSTRAR en la lista o detalle
export interface NotaCredito {
    id: number;
    codigoCompleto: string;       // Ej: "NC01-00000025"
    codigoVentaAfectada: string;  // Ej: "VTA-2026-0001"
    motivo: MotivoNota;
    montoTotal: number;
    moneda: string;               // "PEN" o "USD"
    fechaEmision: string | Date;  // Puede venir como string ISO
    observaciones?: string;
}