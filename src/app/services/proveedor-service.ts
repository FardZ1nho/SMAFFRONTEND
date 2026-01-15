import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor } from '../models/proveedor';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  // Asegúrate de que este puerto coincida con tu backend (Spring Boot por defecto es 8080)
  private apiUrl = `${environment.base}/proveedores`;

  constructor(private http: HttpClient) { }

  /**
   * GET: Listar todos los proveedores (activos e inactivos)
   */
  listar(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  /**
   * GET: Listar solo proveedores activos
   */
  listarActivos(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}/activos`);
  }

  /**
   * GET: Obtener un proveedor por su ID
   * CORRECCIÓN: Cambiamos el nombre de 'obtener' a 'obtenerPorId'
   */
  obtenerPorId(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST: Crear un nuevo proveedor
   */
  crear(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  /**
   * PUT: Actualizar un proveedor existente
   */
  actualizar(id: number, proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, proveedor);
  }

  /**
   * DELETE: Desactivar un proveedor (Eliminación lógica)
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET: Buscar proveedores por coincidencia de nombre
   */
  buscarPorNombre(nombre: string): Observable<Proveedor[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Proveedor[]>(`${this.apiUrl}/buscar`, { params });
  }

  /**
   * GET: Buscar un proveedor específico por RUC
   */
  obtenerPorRuc(ruc: string): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/ruc/${ruc}`);
  }
}