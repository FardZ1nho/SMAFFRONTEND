import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ProductoRequest, IngresoStockRequest } from '../models/producto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = `${environment.base}/productos`;

  constructor(private http: HttpClient) { }

  // --- LECTURA ---
  listarProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  listarProductosActivos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/activos`);
  }

  obtenerProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  obtenerProductoPorCodigo(codigo: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/codigo/${codigo}`);
  }

  // ✅ ESTE ES EL MÉTODO QUE FALTABA
  buscarProductosPorNombre(termino: string): Observable<Producto[]> {
    const params = new HttpParams().set('nombre', termino);
    // Asume que tu backend tiene un endpoint /buscar?nombre=...
    return this.http.get<Producto[]>(`${this.apiUrl}/buscar`, { params });
  }

  // Mantengo este por si lo usas en otro lado, hace lo mismo que el de arriba
  buscarProductos(termino: string): Observable<Producto[]> {
    const params = new HttpParams().set('nombre', termino);
    return this.http.get<Producto[]>(`${this.apiUrl}/buscar`, { params });
  }

  obtenerProductosStockBajo(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/stock-bajo`);
  }

  // --- ESCRITURA (FICHA TÉCNICA) ---
  
  crearProducto(producto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }

  actualizarProducto(id: number, producto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto);
  }

  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // --- LOGÍSTICA ---
  ingresarStock(request: IngresoStockRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/ingreso-stock`, request);
  }
}