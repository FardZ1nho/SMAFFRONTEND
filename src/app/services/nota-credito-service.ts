import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// 👇 IMPORTANTE: Importamos las interfaces desde la carpeta models.
// Si las defines aquí abajo otra vez, TypeScript creerá que son tipos diferentes
// y te dará error al asignar los datos en el componente.
import { NotaCredito, NotaCreditoRequest } from '../models/nota-credito';

@Injectable({
  providedIn: 'root'
})
export class NotaCreditoService {
  
  // Ajusta la URL base según tu environment
  private apiUrl = `${environment.base}/notas-credito`;

  constructor(private http: HttpClient) { }

  /**
   * Emitir una nueva nota de crédito
   * Recibe el objeto Request y devuelve la Nota creada
   */
  emitirNotaCredito(request: NotaCreditoRequest): Observable<NotaCredito> {
    return this.http.post<NotaCredito>(this.apiUrl, request);
  }

  /**
   * Obtener el total global de devoluciones 
   * (Devuelve un número simple para el Dashboard de Ingreso Neto)
   */
  obtenerTotalDevoluciones(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/total-global`);
  }

  /**
   * Listar TODAS las notas de crédito emitidas (Historial)
   * Se usa en la pantalla de lista de notas
   */
  listarTodas(): Observable<NotaCredito[]> {
    return this.http.get<NotaCredito[]>(this.apiUrl);
  }

  /**
   * Listar notas de crédito de una venta específica
   * Se usa si quieres ver el historial dentro del detalle de una venta
   */
  listarPorVenta(ventaId: number): Observable<NotaCredito[]> {
    return this.http.get<NotaCredito[]>(`${this.apiUrl}/venta/${ventaId}`);
  }
}