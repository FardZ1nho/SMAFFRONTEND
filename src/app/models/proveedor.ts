// src/app/models/proveedor.ts

export interface Proveedor {
  id: number;
  nombre: string;
  ruc?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  fechaCreacion?: Date;
}

export interface ProveedorRequest {
  nombre: string;
  ruc?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
}

export interface ProveedorResponse {
  id: number;
  nombre: string;
  ruc?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  fechaCreacion: Date;
}