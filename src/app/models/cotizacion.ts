export interface CotizacionRequest {
    idCliente: number;
    fechaVencimiento: string; // YYYY-MM-DD
    moneda: 'PEN' | 'USD';
    tipoCambio: number;
    observaciones?: string;
    subTotal: number;
    igv: number;
    total: number;
    detalles: CotizacionDetalleDTO[];
}

export interface CotizacionDetalleDTO {
    idProducto: number;
    cantidad: number;
    precioUnitario: number;
}

export interface CotizacionResponse {
    id: number;
    serie: string;
    numero: string;
    fechaEmision: string;
    fechaVencimiento: string;
    moneda: string;
    total: number;
    estado: 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'VENCIDA';
    cliente: {
        id: number;
        nombreCompleto: string;
        numeroDocumento: string;
    };
    detalles?: any[]; // Puedes detallarlo más si lo necesitas
}