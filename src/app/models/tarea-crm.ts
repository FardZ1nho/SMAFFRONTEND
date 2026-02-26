// Enums para los tipos y estados
export enum EstadoTareaCrm {
  PENDIENTE = 'PENDIENTE',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
}

export enum TipoTareaCrm {
  LLAMADA = 'LLAMADA',
  CORREO = 'CORREO',
  MENSAJE = 'MENSAJE',
  REUNION = 'REUNION'
}

// Lo que enviamos al backend (Request)
export interface TareaCrmRequest {
  cotizacionId: number;
  titulo: string;
  descripcion: string;
  fechaLimite: string; // Lo enviamos como string en formato ISO (ej. '2026-02-28T15:30:00')
  tipo: TipoTareaCrm;
}

// Lo que recibimos del backend (Response)
export interface TareaCrmResponse {
  id: number;
  cotizacionId: number;
  titulo: string;
  descripcion: string;
  fechaLimite: string; 
  estado: EstadoTareaCrm;
  tipo: TipoTareaCrm;
}