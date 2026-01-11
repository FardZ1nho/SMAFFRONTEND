export interface Almacen {
  id?: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  activo: boolean;
  fechaCreacion?: string; // o Date si prefieres
}

// DTO para crear/actualizar
export interface AlmacenRequest {
  codigo: string;
  nombre: string;
  direccion?: string;
  activo?: boolean;
}