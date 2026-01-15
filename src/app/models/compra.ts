import { Producto } from "./producto";
import { Almacen } from "./almacen";
import { Proveedor } from "./proveedor"; 

// Lo que enviamos al Backend para registrar
export interface CompraRequest {
    tipoComprobante: string;
    serie: string;
    numero: string;
    fecEmision: string; // Formato YYYY-MM-DD
    proveedorId: number;
    moneda: string;
    tipoCambio: number;
    observaciones: string;
    detalles: CompraDetalleRequest[];
}

export interface CompraDetalleRequest {
    productoId: number;
    almacenId: number;
    cantidad: number;
    precioUnitario: number;
}

// Lo que recibimos del Backend al listar o consultar
export interface CompraResponse {
  id: number;
  tipoComprobante: string;
  serie: string;
  numero: string;
  fecEmision: string; // O Date
  nombreProveedor: string;
  rucProveedor: string;
  moneda: string;
  tipoCambio: number;
  observaciones: string;
  
  // 👇 ¡AGREGA ESTO! 👇
  total: number;
  
  // Opcional: la lista de detalles si la usas
  detalles?: any[]; 
}

export interface CompraDetalleResponse {
    id: number;
    nombreProducto: string;
    codigoProducto: string;
    nombreAlmacen: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}