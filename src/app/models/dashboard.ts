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
}

export interface MetricaCard {
  titulo: string;
  valor: string | number;
  porcentaje: number;
  icono: string;
  colorIcono: string;
  colorFondo: string;
}

export interface GraficoVentasDTO {
  label: string;    // Ej: "Lunes", "24/01", "Enero"
  total: number;
  cantidad: number;
}

export interface ProductoVendidoDTO {
  id: number;
  nombre: string;
  codigo: string;
  cantidadVendida: number;
  totalVentas: number;
}

export interface ReporteMetodoPagoDTO {
  metodo: string;
  total: number;
  cantidad: number;
}

// ✅ NUEVO: Interfaz para el Widget de Alertas (Próximas Llegadas)
export interface DashboardAlerta {
  idImportacion: number;
  codigoImportacion: string; // Ej: "IMP-2026-01"
  proveedor: string;
  fechaEta: string;          // Fecha en formato string (ISO)
  diasRestantes: number;     // Días que faltan (o atraso si es negativo)
  estado: string;            // TRANSITO / ADUANAS
}