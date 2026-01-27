// importacion.ts

import { CompraResponse } from './compra';

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

// --- INTERFACES ---

export interface ImportacionResponse {
  id: number;
  compra: CompraResponse;
  
  // --- Seguimiento General ---
  estado: EstadoImportacion;
  numeroDua?: string;
  trackingNumber?: string;

  // --- Fechas Críticas (NUEVO) ---
  fechaCutOffDocumental?: string;
  fechaCutOffFisico?: string;
  fechaSalidaEstimada?: string; // ETD
  fechaEstimadaLlegada?: string; // ETA
  fechaLlegadaReal?: string;     // ATA

  // --- Cierre y Penalidades (NUEVO) ---
  fechaLevanteAutorizado?: string;
  fechaNacionalizacion?: string;
  diasLibres?: number;
  fechaLimiteDevolucion?: string;

  // --- Logística ---
  paisOrigen?: string;
  puertoEmbarque?: string;
  puertoLlegada?: string;
  incoterm?: Incoterm;
  tipoTransporte?: TipoTransporte;
  navieraAerolinea?: string;
  numeroViaje?: string;      // Nuevo (Vessel/Voyage)
  numeroContenedor?: string;

  // --- Costos ---
  costoFlete: number;
  costoSeguro: number;
  impuestosAduanas: number;
  gastosOperativos: number;
  costoTransporteLocal: number;

  fechaCreacion: string;
}

export interface ImportacionRequest {
  // --- Seguimiento ---
  numeroDua?: string;
  trackingNumber?: string;
  
  // --- Fechas Críticas ---
  fechaCutOffDocumental?: Date;
  fechaCutOffFisico?: Date;
  fechaSalidaEstimada?: Date;
  fechaEstimadaLlegada?: Date;
  fechaLlegadaReal?: Date;

  // --- Cierre y Penalidades ---
  fechaLevanteAutorizado?: Date;
  fechaNacionalizacion?: Date;
  diasLibres?: number;
  fechaLimiteDevolucion?: Date;
  
  // --- Logística ---
  paisOrigen?: string;
  puertoEmbarque?: string;
  puertoLlegada?: string;
  incoterm?: Incoterm;
  tipoTransporte?: TipoTransporte;
  navieraAerolinea?: string;
  numeroViaje?: string;
  numeroContenedor?: string;

  // --- Costos ---
  costoFlete: number;
  costoSeguro: number;
  impuestosAduanas: number;
  gastosOperativos: number;
  costoTransporteLocal: number;

  estado: EstadoImportacion;
}