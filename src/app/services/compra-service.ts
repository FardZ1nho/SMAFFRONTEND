import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompraRequest, CompraResponse } from '../models/compra';

@Injectable({
  providedIn: 'root'
})
export class CompraService {

  // Asegúrate de que el puerto (8080) sea el correcto de tu backend
  private apiUrl = 'http://localhost:8080/compras';

  constructor(private http: HttpClient) { }

  /**
   * Registra una nueva compra masiva (Cabecera + Detalles)
   */
  registrarCompra(compra: CompraRequest): Observable<CompraResponse> {
    return this.http.post<CompraResponse>(this.apiUrl, compra);
  }

  /**
   * Obtiene el historial completo de compras
   */
  listarTodas(): Observable<CompraResponse[]> {
    return this.http.get<CompraResponse[]>(this.apiUrl);
  }

  /**
   * Obtiene una compra específica por su ID
   * NOTA: Renombrado a 'obtenerPorId' para coincidir con tu Componente
   */
  obtenerPorId(id: number): Observable<CompraResponse> {
    return this.http.get<CompraResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Busca compras por número de comprobante
   */
  buscarPorNumero(numero: string): Observable<CompraResponse[]> {
    const params = new HttpParams().set('numero', numero);
    return this.http.get<CompraResponse[]>(`${this.apiUrl}/buscar`, { params });
  }

  /**
   * Lista las compras realizadas a un proveedor específico
   */
  listarPorProveedor(proveedorId: number): Observable<CompraResponse[]> {
    return this.http.get<CompraResponse[]>(`${this.apiUrl}/proveedor/${proveedorId}`);
  }

  /**
   * Anular una compra (para el botón de eliminar)
   * Esto revertirá el stock en el backend si tienes la lógica implementada
   */
  anular(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}