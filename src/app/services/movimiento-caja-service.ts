import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; 
import { MovimientoCajaRequest, MovimientoCajaResponse, TurnoCaja } from '../models/movimiento-caja';

@Injectable({
  providedIn: 'root'
})
export class MovimientoCajaService {

  private apiUrl = `${environment.base}/cajachica`;

  constructor(private http: HttpClient) { }

  registrar(movimiento: MovimientoCajaRequest): Observable<MovimientoCajaResponse> {
    return this.http.post<MovimientoCajaResponse>(this.apiUrl, movimiento);
  }

  listar(): Observable<MovimientoCajaResponse[]> {
    return this.http.get<MovimientoCajaResponse[]>(this.apiUrl);
  }

  actualizar(id: number, movimiento: MovimientoCajaRequest): Observable<MovimientoCajaResponse> {
    return this.http.put<MovimientoCajaResponse>(`${this.apiUrl}/${id}`, movimiento);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ==========================================
  // ✅ NUEVOS ENDPOINTS PARA TURNOS Y BANCOS
  // ==========================================
  
  obtenerTurnoActivo(): Observable<TurnoCaja> {
    // Retorna el turno actual o un error/null si está cerrado
    return this.http.get<TurnoCaja>(`${this.apiUrl}/turnos/activo`);
  }

  abrirCaja(saldoInicial: number, responsable: string): Observable<TurnoCaja> {
    return this.http.post<TurnoCaja>(`${this.apiUrl}/turnos/abrir`, { saldoInicial, responsable });
  }

  cerrarCaja(saldoFisico: number): Observable<TurnoCaja> {
    return this.http.post<TurnoCaja>(`${this.apiUrl}/turnos/cerrar`, { saldoFisico });
  }

  depositarABanco(monto: number, cuentaId: number, responsable: string): Observable<MovimientoCajaResponse> {
    return this.http.post<MovimientoCajaResponse>(`${this.apiUrl}/depositar`, { monto, cuentaId, responsable });
  }
}