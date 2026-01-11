// src/app/services/ingreso.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IngresoRequest, IngresoResponse } from '../models/ingreso';

@Injectable({
  providedIn: 'root'
})
export class IngresoService {
  // Cambia esto por la URL de tu backend, igual que en VentaService
  private apiUrl = 'http://localhost:8080/api/ingresos'; 

  constructor(private http: HttpClient) { }

  // ========== CREAR Y REGISTRAR ==========
  
  /**
   * Registra un nuevo ingreso de mercadería y actualiza stock
   */
  registrarIngreso(ingreso: IngresoRequest): Observable<IngresoResponse> {
    return this.http.post<IngresoResponse>(this.apiUrl, ingreso);
  }

  // ========== CONSULTAR ==========

  /**
   * Lista todo el historial de ingresos (el Kardex de entradas)
   */
  listarHistorial(): Observable<IngresoResponse[]> {
    return this.http.get<IngresoResponse[]>(this.apiUrl);
  }

  /**
   * Opcional: Buscar ingresos por rango de fechas (siguiendo tu estilo de Ventas)
   */
  listarPorFecha(inicio: string, fin: string): Observable<IngresoResponse[]> {
    return this.http.get<IngresoResponse[]>(`${this.apiUrl}/fechas?inicio=${inicio}&fin=${fin}`);
  }
}