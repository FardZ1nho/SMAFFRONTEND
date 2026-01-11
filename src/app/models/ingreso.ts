// src/app/models/ingreso.ts

export interface IngresoRequest {
    productoId: number;
    almacenId: number; // ✅ NUEVO
    cantidad: number;
    proveedor: string;
    observacion: string;
    fecha?: string;
}

export interface IngresoResponse {
    id: number;
    nombreProducto: string;
    skuProducto: string;
    cantidad: number;
    fecha: string;
    proveedor: string;
    observacion?: string;
    
    // ✅ NUEVO: Información del almacén
    almacenId: number;
    almacenCodigo: string;
    almacenNombre: string;
}

// ⭐ MODIFICADO: Agregar almacenId
export interface ProductoParaIngreso {
    producto: any;
    almacenId: number | null; // ✅ NUEVO
    almacenNombre: string; // ✅ NUEVO (para mostrar en la interfaz)
    cantidad: number;
    proveedorNombre: string;
}