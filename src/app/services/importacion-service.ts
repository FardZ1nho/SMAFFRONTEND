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

  // Listar todas (para la tabla principal)
  listarTodas(): Observable<ImportacionResponse[]> {
    return this.http.get<ImportacionResponse[]>(this.apiUrl);
  }

  // Filtrar por estado (ej: Ver solo "EN_TRANSITO")
  listarPorEstado(estado: EstadoImportacion): Observable<ImportacionResponse[]> {
    return this.http.get<ImportacionResponse[]>(`${this.apiUrl}/estado/${estado}`);
  }

  // Obtener detalle de una importación por ID
  obtenerPorId(id: number): Observable<ImportacionResponse> {
    return this.http.get<ImportacionResponse>(`${this.apiUrl}/${id}`);
  }

  // Actualizar datos (Costos, DUA, Fechas, Estado)
  actualizarImportacion(id: number, request: ImportacionRequest): Observable<ImportacionResponse> {
    return this.http.put<ImportacionResponse>(`${this.apiUrl}/${id}`, request);
  }
}