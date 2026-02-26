import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TareaCrmRequest, TareaCrmResponse } from '../models/tarea-crm';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class TareaCrmService {

  // Ajusta el puerto (usualmente 8080 en Spring Boot) y tu ruta base.
  // Si usas environments (environment.apiUrl), es mejor llamarlo desde ahí.
  private apiUrl =  `${environment.base}/tareascrm`

  constructor(private http: HttpClient) { }

  // 1. Crear una nueva tarea
  crearTarea(tarea: TareaCrmRequest): Observable<TareaCrmResponse> {
    return this.http.post<TareaCrmResponse>(this.apiUrl, tarea);
  }

  // 2. Obtener tareas de una cotización específica (para el Pipeline)
  obtenerPorCotizacion(cotizacionId: number): Observable<TareaCrmResponse[]> {
    return this.http.get<TareaCrmResponse[]>(`${this.apiUrl}/cotizacion/${cotizacionId}`);
  }

  // 3. Obtener todas las tareas pendientes (para el Dashboard)
  obtenerPendientes(): Observable<TareaCrmResponse[]> {
    return this.http.get<TareaCrmResponse[]>(`${this.apiUrl}/pendientes`);
  }

  // 4. Marcar tarea como completada
  completarTarea(id: number): Observable<TareaCrmResponse> {
    return this.http.put<TareaCrmResponse>(`${this.apiUrl}/${id}/completar`, {});
  }

  // 5. Eliminar tarea
  eliminarTarea(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}