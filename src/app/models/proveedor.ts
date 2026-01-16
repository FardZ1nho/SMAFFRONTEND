export interface Proveedor {
    id?: number;
    nombre: string;
    ruc: string;    // Guardará RUC (11) o USCC (18)
    pais: string;   // 'PERÚ' | 'CHINA'
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    activo: boolean;
    fechaCreacion?: string;
    fechaActualizacion?: string;
}