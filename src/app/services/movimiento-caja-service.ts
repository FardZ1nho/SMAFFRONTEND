import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; 
import { MovimientoCajaRequest, MovimientoCajaResponse } from '../models/movimiento-caja'; // Ajusta la ruta

@Injectable({
  providedIn: 'root'
})
export class MovimientoCajaService {

  // Fíjate que le puse /api/cajachica porque así lo definimos en el Controller de Java
  private apiUrl = `${environment.base}/cajachica`;

  constructor(private http: HttpClient) { }

  registrar(movimiento: MovimientoCajaRequest): Observable<MovimientoCajaResponse> {
    return this.http.post<MovimientoCajaResponse>(this.apiUrl, movimiento);
  }

  listar(): Observable<MovimientoCajaResponse[]> {
    return this.http.get<MovimientoCajaResponse[]>(this.apiUrl);
  }
}