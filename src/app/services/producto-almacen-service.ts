import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ProductoAlmacen, 
  ProductoAlmacenRequest, 
  TransferenciaStockRequest,
  AjusteStockRequest 
} from '../models/producto-almacen';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ProductoAlmacenService {
  
  private baseUrl = `${environment.base}/producto-almacen`;

  constructor(private http: HttpClient) { }

  /**
   * Asignar un producto a un almacén
   */
  asignarProductoAAlmacen(request: ProductoAlmacenRequest): Observable<ProductoAlmacen> {
    return this.http.post<ProductoAlmacen>(this.baseUrl, request);
  }

  /**
   * Actualizar información de un producto en un almacén
   */
  actualizarProductoAlmacen(id: number, request: ProductoAlmacenRequest): Observable<ProductoAlmacen> {
    return this.http.put<ProductoAlmacen>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Obtener información específica por ID
   */
  obtenerPorId(id: number): Observable<ProductoAlmacen> {
    return this.http.get<ProductoAlmacen>(`${this.baseUrl}/${id}`);
  }

  /**
   * Listar todas las ubicaciones de un producto (en qué almacenes está)
   */
  listarUbicacionesPorProducto(productoId: number): Observable<ProductoAlmacen[]> {
    return this.http.get<ProductoAlmacen[]>(`${this.baseUrl}/producto/${productoId}`);
  }

  /**
   * Listar todos los productos en un almacén específico
   */
  listarProductosPorAlmacen(almacenId: number): Observable<ProductoAlmacen[]> {
    return this.http.get<ProductoAlmacen[]>(`${this.baseUrl}/almacen/${almacenId}`);
  }

  /**
   * Obtener stock de un producto en un almacén específico
   */
  obtenerStockEnAlmacen(productoId: number, almacenId: number): Observable<ProductoAlmacen> {
    const params = new HttpParams()
      .set('productoId', productoId.toString())
      .set('almacenId', almacenId.toString());
    
    return this.http.get<ProductoAlmacen>(`${this.baseUrl}/stock`, { params });
  }

  /**
   * Transferir stock entre almacenes
   */
  transferirStockEntreAlmacenes(request: TransferenciaStockRequest): Observable<void> {
    const params = new HttpParams()
      .set('productoId', request.productoId.toString())
      .set('almacenOrigenId', request.almacenOrigenId.toString())
      .set('almacenDestinoId', request.almacenDestinoId.toString())
      .set('cantidad', request.cantidad.toString());
    
    return this.http.post<void>(`${this.baseUrl}/transferir`, null, { params });
  }

  /**
   * Ajustar stock en un almacén (incrementar o decrementar)
   */
  ajustarStock(id: number, cantidad: number, motivo?: string): Observable<ProductoAlmacen> {
    let params = new HttpParams().set('cantidad', cantidad.toString());
    
    if (motivo) {
      params = params.set('motivo', motivo);
    }
    
    return this.http.patch<ProductoAlmacen>(`${this.baseUrl}/${id}/ajustar-stock`, null, { params });
  }

  /**
   * Eliminar asignación de producto en almacén
   */
  eliminarProductoDeAlmacen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Calcular stock total de un producto (suma de todos los almacenes)
   */
  calcularStockTotalProducto(productoId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/producto/${productoId}/stock-total`);
  }
}