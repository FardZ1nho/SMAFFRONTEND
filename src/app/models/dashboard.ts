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
  tendencia?: 'sube' | 'baja' | 'neutro';
  subtitulo?: string;
}

export interface GraficoVentasDTO {
  label: string;
  total: number;
  cantidad: number;
}

export interface ProductoVendidoDTO {
  nombreProducto: string;
  cantidad: number;
  total: number;
}

export interface ReporteMetodoPagoDTO {
  metodo: string;
  total: number;
  cantidad: number;
}

export interface DashboardAlerta {
  idImportacion: number;
  codigoImportacion: string;
  fechaLlegada: string;
  estado: string;
  proveedores: string;

  // ✅ Propiedades calculadas en frontend (usadas en el template)
  diasRestantes: number;
  fechaEta: string;
  proveedor: string;
}