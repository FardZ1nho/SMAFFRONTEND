export interface DashboardResponseDTO {
  // Métricas principales
  ventasMes: number;
  ventasHoy: number;
  productosStock: number;
  clientesActivos: number;

  // Porcentajes de cambio
  porcentajeCambioVentasMes: number;
  porcentajeCambioProductos: number;
  porcentajeCambioClientes: number;
  porcentajeCambioVentasHoy: number;

  // Información adicional
  productosStockBajo: number;
  cantidadVentasHoy: number;
  cantidadVentasMes: number;
  valorInventario: number;

  // ✅ NUEVAS: Alertas y Finanzas (Coinciden con Backend)
  cotizacionesPendientes: number;
  comprasPorPagar: number;
  saldoCajaChica: number;
  saldoBancos: number;
}

export interface MetricaCard {
  titulo: string;
  valor: string | number;
  porcentaje: number;
  icono: string;
  colorIcono: string;
  colorFondo: string;
  tendencia?: 'sube' | 'baja' | 'neutro'; // Útil para poner flechitas
  subtitulo?: string; // Ej: "vs mes anterior"
}

export interface GraficoVentasDTO {
  label: string;    // Ej: "LUNES", "S1", "ENE"
  total: number;
  cantidad: number;
}

export interface ProductoVendidoDTO {
  nombreProducto: string; // ✅ Coincide con backend
  cantidad: number;       // ✅ Coincide con backend
  total: number;          // ✅ Coincide con backend
}

export interface ReporteMetodoPagoDTO {
  metodo: string;
  total: number;
  cantidad: number;
}

// ✅ CORREGIDO: Mapeo exacto a DashboardAlertaDTO.java
export interface DashboardAlerta {
  idImportacion: number;
  codigoImportacion: string; 
  fechaLlegada: string; 
  estado: string;       
  proveedores: string; 
}