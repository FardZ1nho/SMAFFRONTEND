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

// ✅ NUEVA INTERFAZ: Para leer el resumen ligero que envía el Backend
// Esto evita cargar todos los detalles de productos de cada factura
export interface FacturaResumen {
    id: number;
    serie: string;
    numero: string;
    nombreProveedor: string;
    total: number;
    moneda: string;
    pesoNetoKg: number;
}

// ==========================================
// 📥 RESPONSE (CONSULTA)
// ==========================================
export interface ImportacionResponse {
  id: number;
  codigoAgrupador: string; 
  estado: EstadoImportacion;

  // ✅ CORREGIDO: Usamos FacturaResumen[] en lugar de CompraResponse[]
  // Esto hace match con el DTO "CompraResumenDTO" de Java
  facturasComerciales?: FacturaResumen[];

  // --- LOGÍSTICA Y SEGUIMIENTO ---
  numeroDua?: string;
  trackingNumber?: string;
  
  // ✅ CAMPOS NUEVOS (Que agregamos al Backend hace un momento)
  canal?: string;          // VERDE, ROJO, NARANJA
  agenteAduanas?: string;

  // Fechas Críticas
  fechaCutOffDocumental?: string;
  fechaCutOffFisico?: string;
  fechaSalidaEstimada?: string; // ETD
  fechaEstimadaLlegada?: string; // ETA
  fechaLlegadaReal?: string;     // ATA
  fechaLevanteAutorizado?: string;
  fechaNacionalizacion?: string;

  // Transporte
  paisOrigen?: string;
  puertoEmbarque?: string;
  puertoLlegada?: string;
  incoterm?: Incoterm;
  tipoTransporte?: TipoTransporte;
  navieraAerolinea?: string;
  numeroViaje?: string;      
  numeroContenedor?: string;
  diasLibres?: number;
  fechaLimiteDevolucion?: string;

  // --- COSTOS GLOBALES ---
  totalFleteInternacional: number;
  totalSeguro: number;
  totalGastosAduana: number;    
  totalGastosAlmacen: number;    
  totalTransporteLocal: number;  
  otrosGastosGlobales: number;

  // --- TOTALIZADORES ---
  sumaFobTotal: number;  
  pesoTotalKg: number;   

  fechaCreacion: string;
}

// ==========================================
// 📤 REQUEST (GUARDAR / EDITAR)
// ==========================================
export interface ImportacionRequest {
  codigoAgrupador: string; 
  estado: EstadoImportacion; // O string si prefieres simpleza

  // --- LOGÍSTICA ---
  numeroDua?: string;
  trackingNumber?: string;
  
  // ✅ CAMPOS NUEVOS EN EL FORMULARIO
  canal?: string;
  agenteAduanas?: string;
  
  fechaCutOffDocumental?: string;
  fechaCutOffFisico?: string;
  fechaSalidaEstimada?: string;
  fechaEstimadaLlegada?: string; // El datepicker de Angular devuelve Date o string
  fechaLlegadaReal?: string;

  fechaLevanteAutorizado?: string;
  fechaNacionalizacion?: string;
  
  diasLibres?: number;
  fechaLimiteDevolucion?: string;
  
  paisOrigen?: string;
  puertoEmbarque?: string;
  puertoLlegada?: string;
  incoterm?: Incoterm;
  tipoTransporte?: TipoTransporte;
  navieraAerolinea?: string;
  numeroViaje?: string;
  numeroContenedor?: string;

  // --- COSTOS GLOBALES ---
  totalFleteInternacional: number;
  totalSeguro: number;
  totalGastosAduana: number;
  totalGastosAlmacen: number;
  totalTransporteLocal: number;
  otrosGastosGlobales: number;
}