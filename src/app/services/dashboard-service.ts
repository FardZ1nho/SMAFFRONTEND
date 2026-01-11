import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardResponseDTO, VentasSemanaDTO } from '../models/dashboard';
import { ProductoVendidoDTO } from '../models/dashboard';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  
  private baseUrl = `${environment.base}/dashboard`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las métricas del dashboard en una sola llamada
   */
  obtenerMetricas(): Observable<DashboardResponseDTO> {
    return this.http.get<DashboardResponseDTO>(`${this.baseUrl}/metricas`);
  }

  /**
   * Obtiene las ventas del mes actual
   */
  obtenerVentasMes(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/ventas-mes`);
  }

  /**
   * Obtiene las ventas de hoy
   */
  obtenerVentasHoy(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/ventas-hoy`);
  }

  /**
   * Obtiene la cantidad total de productos en stock
   */
  obtenerProductosEnStock(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/productos-stock`);
  }

  /**
   * Obtiene la cantidad de clientes activos
   */
  obtenerClientesActivos(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/clientes-activos`);
  }

  /**
   * Obtiene el porcentaje de cambio de ventas vs mes anterior
   */
  obtenerPorcentajeCambioVentas(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/porcentaje-ventas`);
  }

  // ✅ AGREGAR este método
  /**
   * Obtiene las ventas de la semana actual (Lunes a Domingo)
   */
  obtenerVentasSemana(): Observable<VentasSemanaDTO[]> {
    return this.http.get<VentasSemanaDTO[]>(`${this.baseUrl}/ventas-semana`);
  }

  /**
   * Obtiene los productos más vendidos
   */
  obtenerProductosMasVendidos(limit: number = 5): Observable<ProductoVendidoDTO[]> {
    return this.http.get<ProductoVendidoDTO[]>(`${this.baseUrl}/productos-mas-vendidos?limit=${limit}`);
  }
}