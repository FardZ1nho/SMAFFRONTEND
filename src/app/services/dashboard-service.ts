import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  DashboardResponseDTO, 
  GraficoVentasDTO, 
  ProductoVendidoDTO, 
  ReporteMetodoPagoDTO,
  DashboardAlerta // ✅ Importamos la nueva interfaz
} from '../models/dashboard';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  
  private baseUrl = `${environment.base}/dashboard`;

  constructor(private http: HttpClient) { }

  obtenerMetricas(): Observable<DashboardResponseDTO> {
    return this.http.get<DashboardResponseDTO>(`${this.baseUrl}/metricas`);
  }

  obtenerVentasMes(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/ventas-mes`);
  }

  obtenerVentasHoy(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/ventas-hoy`);
  }

  obtenerProductosEnStock(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/productos-stock`);
  }

  obtenerClientesActivos(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/clientes-activos`);
  }

  obtenerPorcentajeCambioVentas(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/porcentaje-ventas`);
  }

  /**
   * Obtiene datos para el gráfico según el periodo
   * @param periodo 'SEMANA' | 'MES' | 'ANIO'
   */
  obtenerVentasGrafico(periodo: string): Observable<GraficoVentasDTO[]> {
    let params = new HttpParams().set('periodo', periodo);
    return this.http.get<GraficoVentasDTO[]>(`${this.baseUrl}/ventas-grafico`, { params });
  }

  obtenerProductosMasVendidos(limit: number = 5): Observable<ProductoVendidoDTO[]> {
    return this.http.get<ProductoVendidoDTO[]>(`${this.baseUrl}/productos-mas-vendidos?limit=${limit}`);
  }

  obtenerReporteMetodosPago(fechaInicio?: string, fechaFin?: string): Observable<ReporteMetodoPagoDTO[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);

    return this.http.get<ReporteMetodoPagoDTO[]>(`${this.baseUrl}/metodos-pago`, { params });
  }

  // ✅ NUEVO MÉTODO: Obtener Alertas de Próximas Llegadas
  obtenerProximasLlegadas(): Observable<DashboardAlerta[]> {
    return this.http.get<DashboardAlerta[]>(`${this.baseUrl}/proximas-llegadas`);
  }
}