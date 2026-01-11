import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor } from '../models/proveedor';
import { ProveedorRequest } from '../models/proveedor';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private apiUrl = `${environment.base}/proveedores`;

  constructor(private http: HttpClient) { }

  // Listar todos los proveedores
  listarProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  // Listar solo proveedores activos
  listarProveedoresActivos(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}/activos`);
  }

  // Buscar por nombre
  buscarProveedores(nombre: string): Observable<Proveedor[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Proveedor[]>(`${this.apiUrl}/buscar`, { params });
  }

  // Obtener proveedor por ID
  obtenerProveedor(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  // Obtener proveedor por RUC
  obtenerProveedorPorRuc(ruc: string): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/ruc/${ruc}`);
  }

  // Crear nuevo proveedor
  crearProveedor(proveedor: ProveedorRequest): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  // Actualizar proveedor existente
  actualizarProveedor(id: number, proveedor: ProveedorRequest): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, proveedor);
  }

  // Eliminar (desactivar) proveedor
  eliminarProveedor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      observe: 'response',
      responseType: 'text' as 'json'
    });
  }
}