// --- ENUMS ---
export enum EstadoImportacion {
  ORDENADO = 'ORDENADO',
  EN_TRANSITO = 'EN_TRANSITO',
  EN_ADUANAS = 'EN_ADUANAS',
  EN_ALMACEN = 'EN_ALMACEN',
  CERRADA = 'CERRADA',
  LIQUIDADA = 'LIQUIDADA'
}

export enum Incoterm {
  EXW = 'EXW', FOB = 'FOB', CIF = 'CIF', CFR = 'CFR', DDP = 'DDP', DAT = 'DAT', DAP = 'DAP'
}

export enum TipoTransporte {
  MARITIMO = 'MARITIMO', 
  AEREO = 'AEREO', 
  TERRESTRE = 'TERRESTRE'
}

// Resumen ligero de facturas dentro de la importación
// ✅ ACTUALIZA ESTA INTERFAZ
export interface FacturaResumen {
    id: number;
    serie: string;
    numero: string;
    nombreProveedor: string;
    total: number;
    moneda: string;
    pesoNetoKg: number;
    cbm: number;

    // --- DETALLE FULL ---
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
}
// ... resto igual
// ==========================================
// 📥 RESPONSE (CONSULTA)
// ==========================================
export interface ImportacionResponse {
  id: number;
  codigoAgrupador: string; 
  estado: EstadoImportacion;

  facturasComerciales?: FacturaResumen[];

  // --- LOGÍSTICA ---
  numeroDua?: string;
  trackingNumber?: string;
  canal?: string;          
  agenteAduanas?: string;

  fechaEstimadaLlegada?: string; 
  fechaLlegadaReal?: string;     

  tipoTransporte?: TipoTransporte;

  // --- TOTALES ---
  sumaFobTotal: number;  
  pesoTotalKg: number;   
  cbmTotal: number; // ✅ Nuevo Total Volumen

  // ==========================================
  // 💰 COSTOS GLOBALES (DESGLOSADOS)
  // ==========================================
  
  // Grupo Volumen
  costoFlete: number;
  costoAlmacenajeCft: number;
  costoTransporteSjl: number;
  costoPersonalDescarga: number;
  costoMontacarga: number;

  // Grupo Peso
  costoDesconsolidacion: number;

  // Grupo Valor (FOB)
  costoVistosBuenos: number;
  costoTransmision: number;
  costoComisionAgencia: number;
  costoVobo: number;
  costoGastosOperativos: number;
  costoResguardo: number;

  // Impuestos
  costoIgv: number;
  costoIpm: number;
  costoPercepcion: number;
  costoAdv: number;

  // Otros
  costoOtros1: number;
  costoOtros2: number;
  costoOtros3: number;
  costoOtros4: number;
}

// ==========================================
// 📤 REQUEST (GUARDAR / EDITAR)
// ==========================================
export interface ImportacionRequest {
  codigoAgrupador?: string; 
  estado?: EstadoImportacion | string; 
  tipoTransporte?: TipoTransporte | string;

  // --- LOGÍSTICA ---
  numeroDua?: string;
  trackingNumber?: string;
  canal?: string;
  agenteAduanas?: string;
  
  fechaEstimadaLlegada?: string; 
  fechaLlegadaReal?: string;

  // ==========================================
  // 💰 COSTOS GLOBALES (INPUTS)
  // ==========================================

  // Grupo Volumen
  costoFlete?: number;
  costoAlmacenajeCft?: number;
  costoTransporteSjl?: number;
  costoPersonalDescarga?: number;
  costoMontacarga?: number;

  // Grupo Peso
  costoDesconsolidacion?: number;

  // Grupo Valor
  costoVistosBuenos?: number;
  costoTransmision?: number;
  costoComisionAgencia?: number;
  costoVobo?: number;
  costoGastosOperativos?: number;
  costoResguardo?: number;

  // Impuestos
  costoIgv?: number;
  costoIpm?: number;
  costoPercepcion?: number;
  costoAdv?: number;

  // Otros
  costoOtros1?: number;
  costoOtros2?: number;
  costoOtros3?: number;
  costoOtros4?: number;
}