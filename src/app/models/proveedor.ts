export interface Proveedor {
    id?: number;           // Opcional: Solo viene del backend
    nombre: string;
    ruc: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    activo?: boolean;
    fechaCreacion?: string;      // Opcional: Solo lectura
    fechaActualizacion?: string; // Opcional: Solo lectura
}