import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompraRequest, CompraResponse, MetodoPago } from '../models/compra';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompraService {

  private apiUrl = `${environment.base}/compras`;

  constructor(private http: HttpClient) { }

  /**
   * Registra una nueva compra
   */
  registrarCompra(compra: CompraRequest): Observable<CompraResponse> {
    return this.http.post<CompraResponse>(this.apiUrl, compra);
  }

  /**
   * ✅ Actualiza una compra existente
   * IMPORTANTE: El backend revertirá el stock anterior y aplicará el nuevo
   */
  actualizarCompra(id: number, compra: CompraRequest): Observable<CompraResponse> {
    return this.http.put<CompraResponse>(`${this.apiUrl}/${id}`, compra);
  }

  /**
   * Registra un pago posterior (Amortizar deuda)
   */
  registrarAmortizacion(compraId: number, monto: number, metodo: MetodoPago, cuentaId?: number, referencia?: string): Observable<CompraResponse> {
    let params = new HttpParams()
      .set('monto', monto.toString())
      .set('metodo', metodo);

    if (cuentaId) params = params.set('cuentaId', cuentaId.toString());
    if (referencia) params = params.set('referencia', referencia);

    return this.http.post<CompraResponse>(`${this.apiUrl}/${compraId}/pagos`, null, { params });
  }

  /**
   * Obtiene el historial completo de compras
   */
  listarTodas(): Observable<CompraResponse[]> {
    return this.http.get<CompraResponse[]>(this.apiUrl);
  }

  /**
   * Obtiene una compra específica por su ID
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
   * Listar facturas vinculadas a un Código de Importación
   */
  listarPorImportacion(codImportacion: string): Observable<CompraResponse[]> {
    return this.http.get<CompraResponse[]>(`${this.apiUrl}/importacion/${codImportacion}`);
  }

  /**
   * Eliminar/Anular compra
   */
  anular(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}