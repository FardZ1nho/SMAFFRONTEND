import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
// ✅ NUEVO: Añadida la importación de RecepcionItemRequest
import { ImportacionResponse, ImportacionRequest, EstadoImportacion, RecepcionItemRequest } from '../models/importacion';

@Injectable({
  providedIn: 'root'
})
export class ImportacionService {

  private apiUrl = `${environment.base}/importaciones`;

  constructor(private http: HttpClient) { }

  /**
   * Listar todas las carpetas logísticas
   */
  listarTodas(): Observable<ImportacionResponse[]> {
    return this.http.get<ImportacionResponse[]>(this.apiUrl);
  }

  /**
   * Filtrar por estado (ej: Ver solo "EN_TRANSITO")
   */
  listarPorEstado(estado: EstadoImportacion): Observable<ImportacionResponse[]> {
    return this.http.get<ImportacionResponse[]>(`${this.apiUrl}/estado/${estado}`);
  }

  /**
   * Obtener detalle de una importación por ID (Numérico)
   */
  obtenerPorId(id: number): Observable<ImportacionResponse> {
    return this.http.get<ImportacionResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Buscar carpeta por CÓDIGO DE TEXTO (Ej: "2026-01")
   */
  obtenerPorCodigo(codigo: string): Observable<ImportacionResponse> {
    return this.http.get<ImportacionResponse>(`${this.apiUrl}/buscar/${codigo}`);
  }

  /**
   * Crear nueva importación
   */
  guardar(request: ImportacionRequest): Observable<ImportacionResponse> {
    return this.http.post<ImportacionResponse>(this.apiUrl, request);
  }

  /**
   * ACTUALIZAR CARPETA Y COSTOS
   * Este método dispara el PRORRATEO en el Backend
   */
  actualizar(id: number, request: ImportacionRequest): Observable<ImportacionResponse> {
    return this.http.put<ImportacionResponse>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Forzar recálculo de costos manualmente
   */
  recalcularCostos(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/recalcular`, {});
  }

  /**
   * ✅ NUEVO: CONFIRMAR RECEPCIÓN EN ALMACÉN
   * Esto actualizará la cantidad recibida y sumará el stock real en el Kardex
   */
  confirmarRecepcion(id: number, items: RecepcionItemRequest[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/recepcion`, items);
  }
}