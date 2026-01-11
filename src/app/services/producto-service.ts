// src/app/services/producto-service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ProductoRequest } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:8080/productos';

  constructor(private http: HttpClient) { }

  // Listar todos los productos
  listarProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  // Listar solo productos activos
  listarProductosActivos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/activos`);
  }

  // Buscar por nombre o código
  buscarProductos(termino: string): Observable<Producto[]> {
    const params = new HttpParams().set('nombre', termino);
    return this.http.get<Producto[]>(`${this.apiUrl}/buscar`, { params });
  }

  // Obtener producto por ID
  obtenerProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  // Obtener producto por código
  obtenerProductoPorCodigo(codigo: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/codigo/${codigo}`);
  }

  // Productos con stock bajo
  obtenerProductosStockBajo(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/stock-bajo`);
  }

  // Crear nuevo producto
  crearProducto(producto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }

  // Actualizar producto existente
  actualizarProducto(id: number, producto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto);
  }

  // CORREGIDO: Eliminar (desactivar) producto
  // El backend retorna 204 No Content, por eso usamos 'any' o 'Object'
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      observe: 'response',
      responseType: 'text' as 'json'
    });
  }

  // Actualizar stock
  actualizarStock(id: number, cantidad: number): Observable<Producto> {
    return this.http.patch<Producto>(`${this.apiUrl}/${id}/stock`, { cantidad });
  }
}