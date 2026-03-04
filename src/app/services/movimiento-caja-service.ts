import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; 
import { MovimientoCajaRequest, MovimientoCajaResponse } from '../models/movimiento-caja';

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

  // ✅ NUEVO MÉTODO PARA ELIMINAR
  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}