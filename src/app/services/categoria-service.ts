import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria } from '../models/categoria'; 
import { environment } from '../../environments/environment';

export interface CategoriaRequest {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl = `${environment.base}/categorias`;  // ⭐ BACKTICKS

  constructor(private http: HttpClient) { }

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl);
  }

  listarCategoriasActivas(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/activas`);
  }

  crearCategoria(categoria: CategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, categoria);
  }

  obtenerCategoria(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${id}`);
  }

  actualizarCategoria(id: number, categoria: CategoriaRequest): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, categoria);
  }

  eliminarCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}