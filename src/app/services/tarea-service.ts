import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Tarea, TareaRequest, EstadoTarea } from '../models/tarea';

@Injectable({
  providedIn: 'root'
})
export class TareaService {

  private apiUrl = `${environment.base}/tareas`;

  constructor(private http: HttpClient) { }

  crear(request: TareaRequest): Observable<Tarea> {
    return this.http.post<Tarea>(this.apiUrl, request);
  }

  // ✅ CORREGIDO: Renombrado de 'listar' a 'listarTareas'
  listarTareas(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(this.apiUrl);
  }

  cambiarEstado(id: number, estado: EstadoTarea): Observable<Tarea> {
    const params = new HttpParams().set('estado', estado);
    return this.http.put<Tarea>(`${this.apiUrl}/${id}/estado`, null, { params });
  }
}