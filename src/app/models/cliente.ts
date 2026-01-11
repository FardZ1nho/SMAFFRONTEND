// src/app/models/cliente.ts

export interface Cliente {
  id: number;
  tipoCliente: string;           // PERSONA o EMPRESA
  nombreCompleto: string;
  tipoDocumento: string;         // DNI, RUC, PASAPORTE, CARNET_EXTRANJERIA
  numeroDocumento: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  direccionCompleta?: string;    // Concatenada
  razonSocial?: string;          // Solo para empresas
  nombreContacto?: string;       // Solo para empresas
  notas?: string;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface ClienteRequest {
  tipoCliente: string;           // PERSONA o EMPRESA
  nombreCompleto: string | null;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  razonSocial?: string | null;
  nombreContacto?: string | null;
  notas?: string | null;
}