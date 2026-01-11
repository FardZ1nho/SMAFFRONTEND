export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fechaCreacion: Date;
}

export interface CategoriaRequest {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}