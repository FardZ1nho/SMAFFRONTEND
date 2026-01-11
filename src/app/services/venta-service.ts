// src/app/services/venta.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Venta, VentaRequest, EstadoVenta } from '../models/venta';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private apiUrl = `${environment.base}/ventas`;

  constructor(private http: HttpClient) { }

  // ========== CREAR Y GUARDAR ==========
  
  crearVenta(venta: VentaRequest): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, venta);
  }

  guardarBorrador(venta: VentaRequest): Observable<Venta> {
    return this.http.post<Venta>(`${this.apiUrl}/borrador`, venta);
  }

  // ========== ACCIONES ==========
  
  completarVenta(id: number): Observable<Venta> {
    return this.http.post<Venta>(`${this.apiUrl}/${id}/completar`, {});
  }

  cancelarVenta(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  // ========== CONSULTAR ==========
  
  listarTodas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl);
  }

  obtenerVenta(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`);
  }

  buscarPorCodigo(codigo: string): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/codigo/${codigo}`);
  }

  listarPorEstado(estado: EstadoVenta): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.apiUrl}/estado/${estado}`);
  }

  listarBorradores(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.apiUrl}/borradores`);
  }

  listarCompletadas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.apiUrl}/completadas`);
  }

  listarPorFecha(inicio: Date, fin: Date): Observable<Venta[]> {
    const params = new HttpParams()
      .set('inicio', inicio.toISOString())
      .set('fin', fin.toISOString());
    return this.http.get<Venta[]>(`${this.apiUrl}/fechas`, { params });
  }

  buscarPorCliente(nombreCliente: string): Observable<Venta[]> {
    const params = new HttpParams().set('cliente', nombreCliente);
    return this.http.get<Venta[]>(`${this.apiUrl}/buscar`, { params });
  }

  // ========== MODIFICAR ==========
  
  actualizarVenta(id: number, venta: VentaRequest): Observable<Venta> {
    return this.http.put<Venta>(`${this.apiUrl}/${id}`, venta);
  }

  eliminarVenta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ========== ESTADÍSTICAS ==========
  
  contarPorEstado(estado: EstadoVenta): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estadisticas/estado/${estado}`);
  }
}