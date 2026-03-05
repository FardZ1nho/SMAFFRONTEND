export interface MovimientoCajaRequest {
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  motivo: string;
  responsable: string;
  categoria?: string; // ✅ NUEVO
  fechaHora?: string; 
}

export interface MovimientoCajaResponse {
  id: number;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  motivo: string;
  categoria?: string; // ✅ NUEVO
  responsable: string;
  fechaHora: string;
  turnoCajaId?: number; // ✅ NUEVO
}

// ✅ NUEVO: Interfaz para el Turno de Caja
export interface TurnoCaja {
  id?: number;
  estado: 'ABIERTO' | 'CERRADO';
  fechaApertura: string;
  fechaCierre?: string;
  saldoInicial: number;
  saldoFinalCalculado?: number;
  saldoFinalFisico?: number;
  descuadre?: number;
  responsable: string;
}