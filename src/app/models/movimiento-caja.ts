export interface MovimientoCajaRequest {
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  motivo: string;
  responsable: string;
  fechaHora?: string; // Lo enviaremos como string ISO desde el formulario
}

export interface MovimientoCajaResponse {
  id: number;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  motivo: string;
  responsable: string;
  fechaHora: string;
}