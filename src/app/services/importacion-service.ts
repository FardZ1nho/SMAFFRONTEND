import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ImportacionResponse, ImportacionRequest, EstadoImportacion } from '../models/importacion';

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
   * ✅ NUEVO: Buscar carpeta por CÓDIGO DE TEXTO (Ej: "2026-01")
   * Backend: GET /importaciones/buscar/{codigo}
   */
  obtenerPorCodigo(codigo: string): Observable<ImportacionResponse> {
    return this.http.get<ImportacionResponse>(`${this.apiUrl}/buscar/${codigo}`);
  }

  /**
   * Crear nueva importación (si usas un formulario de creación aparte)
   */
  guardar(request: ImportacionRequest): Observable<ImportacionResponse> {
    return this.http.post<ImportacionResponse>(this.apiUrl, request);
  }

  /**
   * ✅ MÉTODO AGREGADO (Soluciona el error rojo en el Modal)
   * Actualiza una importación existente por ID
   */
  actualizar(id: number, request: ImportacionRequest | any): Observable<ImportacionResponse> {
    return this.http.put<ImportacionResponse>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * ✅ NUEVO: Forzar recálculo de costos
   * (Por si editaste una factura hija y quieres actualizar la carpeta padre manualmente)
   */
  recalcularCostos(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/recalcular`, {});
  }
}