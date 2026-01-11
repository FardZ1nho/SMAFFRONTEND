// src/app/services/movimiento.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timeout, catchError } from 'rxjs';
import { Movimiento, TipoMovimiento, TrasladoRequest } from '../models/movimiento';

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {

  private baseUrl = 'http://localhost:8080/movimientos';

  constructor(private http: HttpClient) { }

  /**
   * Registrar traslado entre almacenes
   */
  registrarTraslado(request: TrasladoRequest): Observable<Movimiento> {
    console.log('📤 Enviando traslado a:', `${this.baseUrl}/traslado`);
    console.log('📦 Request:', request);
    
    return this.http.post<Movimiento>(`${this.baseUrl}/traslado`, request).pipe(
      timeout(30000), // 30 segundos timeout
      catchError(this.handleError)
    );
  }

  /**
   * Registrar entrada de mercancía
   */
  registrarEntrada(productoId: number, almacenDestinoId: number, cantidad: number, motivo?: string): Observable<Movimiento> {
    const body = { productoId, almacenDestinoId, cantidad, motivo };
    return this.http.post<Movimiento>(`${this.baseUrl}/entrada`, body).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * Registrar salida de mercancía
   */
  registrarSalida(productoId: number, almacenOrigenId: number, cantidad: number, motivo?: string): Observable<Movimiento> {
    const body = { productoId, almacenOrigenId, cantidad, motivo };
    return this.http.post<Movimiento>(`${this.baseUrl}/salida`, body).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * Registrar ajuste de inventario
   */
  registrarAjuste(productoId: number, almacenId: number, cantidad: number, motivo?: string): Observable<Movimiento> {
    const body = { productoId, almacenId, cantidad, motivo };
    return this.http.post<Movimiento>(`${this.baseUrl}/ajuste`, body).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * Listar todos los movimientos
   */
  listarTodos(): Observable<Movimiento[]> {
    console.log('📥 Obteniendo movimientos desde:', this.baseUrl);
    
    return this.http.get<Movimiento[]>(this.baseUrl).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * Listar movimientos por tipo
   */
  listarPorTipo(tipo: TipoMovimiento): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${this.baseUrl}/tipo/${tipo}`).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * Listar movimientos por producto
   */
  listarPorProducto(productoId: number): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${this.baseUrl}/producto/${productoId}`).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * Listar movimientos por almacén
   */
  listarPorAlmacen(almacenId: number): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${this.baseUrl}/almacen/${almacenId}`).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener movimiento por ID
   */
  obtenerPorId(id: number): Observable<Movimiento> {
    return this.http.get<Movimiento>(`${this.baseUrl}/${id}`).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error HTTP:', error);
    
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // Error del servidor
      if (error.status === 0) {
        errorMessage = 'No se puede conectar con el servidor';
      } else if (error.status === 401) {
        errorMessage = 'No autorizado';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else {
        errorMessage = error.error?.error || error.message || `Error ${error.status}`;
      }
    }
    
    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      error: error.error
    }));
  }
}