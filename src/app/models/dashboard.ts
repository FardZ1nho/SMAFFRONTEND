// src/app/models/dashboard.model.ts

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

// ✅ AGREGAR esta interfaz
export interface VentasSemanaDTO {
  fecha: string;
  diaSemana: string;
  totalVentas: number;
  cantidadVentas: number; // Se mantiene como number en TypeScript
}


export interface ProductoVendidoDTO {
  id: number;
  nombre: string;
  codigo: string;
  cantidadVendida: number;
  totalVentas: number;
}