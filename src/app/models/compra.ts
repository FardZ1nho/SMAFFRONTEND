// src/app/models/compra.ts

// ==========================================
// 📤 LO QUE ENVIAMOS AL BACKEND (Request)
// ==========================================
export interface CompraRequest {
  // ✅ NUEVO: Vital para la lógica (BIEN vs SERVICIO)
  tipoCompra: 'BIEN' | 'SERVICIO';
  
  tipoComprobante: string;
  serie: string;
  numero: string;
  
  // ⚠️ NOTA: Ajustado a 'fechaEmision' para coincidir con Java DTO
  fechaEmision: string; // YYYY-MM-DD
  fechaVencimiento?: string; // YYYY-MM-DD (Opcional)

  proveedorId: number;
  moneda: string; // 'PEN' | 'USD'
  tipoCambio: number;
  observaciones?: string;

  // ✅ NUEVO: Totales (Se envían para validar o guardar directo)
  subTotal: number;
  igv: number;
  total: number;

  // ✅ NUEVO: Impuestos específicos del Excel
  percepcion?: number;          // Solo Bienes
  detraccionPorcentaje?: number; // Solo Servicios
  detraccionMonto?: number;      // Solo Servicios
  retencion?: number;           // Ambos

  detalles: CompraDetalleRequest[];
}

export interface CompraDetalleRequest {
  productoId: number;
  
  // ✅ CAMBIO: Ahora es opcional (puede ser null si es SERVICIO)
  almacenId?: number | null; 
  
  cantidad: number;
  precioUnitario: number;
}

// ==========================================
// 📥 LO QUE RECIBIMOS DEL BACKEND (Response)
// ==========================================
export interface CompraResponse {
  id: number;
  
  tipoCompra: string; // 'BIEN' | 'SERVICIO'
  tipoComprobante: string;
  serie: string;
  numero: string;
  
  fechaEmision: string;
  fechaVencimiento?: string;
  fechaRegistro: string;

  nombreProveedor: string;
  rucProveedor?: string;

  moneda: string;
  tipoCambio: number;
  observaciones?: string;

  // ✅ MONTOS
  subTotal: number;
  igv: number;
  total: number;

  // ✅ IMPUESTOS
  percepcion?: number;
  detraccionPorcentaje?: number;
  detraccionMonto?: number;
  retencion?: number;
  
  detalles?: CompraDetalleResponse[]; 
}

export interface CompraDetalleResponse {
  id: number;
  productoId: number;
  nombreProducto: string;
  codigoProducto: string;
  
  // ✅ Almacén puede venir null si fue servicio
  almacenId?: number;
  nombreAlmacen?: string;
  
  cantidad: number;
  precioUnitario: number;
  
  // ✅ Backend nos manda el cálculo listo
  importeTotal: number; 
}