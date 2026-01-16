import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor } from '../models/proveedor';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  private apiUrl = `${environment.base}/proveedores`;

  constructor(private http: HttpClient) { }

  listar(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  listarActivos(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}/activos`);
  }

  obtenerPorId(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  crear(proveedor: Proveedor): Observable<Proveedor> {
    // Al enviar el objeto 'proveedor', Angular ya incluye el nuevo campo 'pais'
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  actualizar(id: number, proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, proveedor);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  buscarPorNombre(nombre: string): Observable<Proveedor[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Proveedor[]>(`${this.apiUrl}/buscar`, { params });
  }

  /**
   * GET: Buscar por RUC o USCC (China)
   * Nota: El endpoint en el Backend sigue siendo /ruc/{ruc} por ahora
   */
  obtenerPorDocumento(documento: string): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/ruc/${documento}`);
  }
}