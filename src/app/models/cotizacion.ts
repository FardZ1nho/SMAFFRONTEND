// ✅ NUEVO: Los estados de tu embudo CRM
export type EstadoPipeline = 'CONTACTO_INICIAL' | 'COTIZACION_ENVIADA' | 'EN_NEGOCIACION' | 'GANADA' | 'PERDIDA' | 'VENCIDA';

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
    estado: EstadoPipeline; // 👈 Actualizado al nuevo embudo
    
    // ⭐ NUEVOS CAMPOS DEL CRM
    motivoPerdida?: string; 
    margenGananciaEstimado?: number; 

    cliente: {
        id: number;
        nombreCompleto: string;
        numeroDocumento: string;
        telefono?: string; // ✅ AÑADIDO PARA EL BOTÓN DE WHATSAPP
    };
    detalles?: any[]; 
}