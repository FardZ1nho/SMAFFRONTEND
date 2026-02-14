import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timeout, catchError } from 'rxjs';
import { Movimiento, TipoMovimiento, TrasladoRequest, AjusteRequest } from '../models/movimiento';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {

  private baseUrl = `${environment.base}/movimientos`;

  constructor(private http: HttpClient) { }

  /**
   * Registrar traslado entre almacenes
   */
  registrarTraslado(request: TrasladoRequest): Observable<Movimiento> {
    console.log('📤 Enviando traslado...', request);
    return this.http.post<Movimiento>(`${this.baseUrl}/traslado`, request).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * Registrar entrada de mercancía (Compras)
   */
  registrarEntrada(productoId: number, almacenDestinoId: number, cantidad: number, motivo?: string): Observable<Movimiento> {
    const body = { productoId, almacenDestinoId, cantidad, motivo };
    return this.http.post<Movimiento>(`${this.baseUrl}/entrada`, body).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * Registrar salida de mercancía (Ventas/Mermas simples)
   */
  registrarSalida(productoId: number, almacenOrigenId: number, cantidad: number, motivo?: string): Observable<Movimiento> {
    const body = { productoId, almacenOrigenId, cantidad, motivo };
    return this.http.post<Movimiento>(`${this.baseUrl}/salida`, body).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ ACTUALIZADO: Registrar ajuste de inventario (Manual / Auditoría)
   * Recibe el objeto AjusteRequest con el usuario responsable
   */
  registrarAjuste(request: AjusteRequest): Observable<Movimiento> {
    console.log('🔧 Enviando ajuste...', request);
    return this.http.post<Movimiento>(`${this.baseUrl}/ajuste`, request).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  /**
   * Listar todos los movimientos
   */
  listarTodos(): Observable<Movimiento[]> {
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
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
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