import { CompraResponse } from './compra';

export interface ImportacionResponse {
    id: number;
    compra: CompraResponse;
    
    // --- Seguimiento ---
    estado: EstadoImportacion;
    numeroDua?: string;
    trackingNumber?: string;
    fechaEstimadaLlegada?: string; 
    fechaNacionalizacion?: string;

    // --- Logística (NUEVOS) ---
    paisOrigen?: string;
    puertoEmbarque?: string;
    puertoLlegada?: string;
    incoterm?: Incoterm;
    tipoTransporte?: TipoTransporte;
    navieraAerolinea?: string;
    numeroContenedor?: string;

    // --- Costos ---
    costoFlete: number;
    costoSeguro: number;
    impuestosAduanas: number;
    gastosOperativos: number;
    costoTransporteLocal: number; // Nuevo

    fechaCreacion: string;
}

export interface ImportacionRequest {
    // --- Seguimiento ---
    numeroDua?: string;
    trackingNumber?: string;
    fechaEstimadaLlegada?: Date;
    fechaNacionalizacion?: Date;
    
    // --- Logística ---
    paisOrigen?: string;
    puertoEmbarque?: string;
    puertoLlegada?: string;
    incoterm?: Incoterm;
    tipoTransporte?: TipoTransporte;
    navieraAerolinea?: string;
    numeroContenedor?: string;

    // --- Costos ---
    costoFlete: number;
    costoSeguro: number;
    impuestosAduanas: number;
    gastosOperativos: number;
    costoTransporteLocal: number;

    estado: EstadoImportacion;
}

// --- ENUMS ---
export enum EstadoImportacion {
    ORDENADO = 'ORDENADO',
    EN_TRANSITO = 'EN_TRANSITO',
    EN_ADUANAS = 'EN_ADUANAS',
    NACIONALIZADO = 'NACIONALIZADO',
    EN_ALMACEN = 'EN_ALMACEN',
    CERRADO = 'CERRADO'
}

export enum Incoterm {
    EXW = 'EXW', FOB = 'FOB', CIF = 'CIF', CFR = 'CFR', DDP = 'DDP', DAT = 'DAT', DAP = 'DAP'
}

export enum TipoTransporte {
    MARITIMO = 'MARITIMO', 
    AEREO = 'AEREO', 
    TERRESTRE = 'TERRESTRE'
}