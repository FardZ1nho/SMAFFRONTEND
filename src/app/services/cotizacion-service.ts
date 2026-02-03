import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CotizacionRequest, CotizacionResponse } from '../models/cotizacion';

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {

  private apiUrl = 'http://localhost:8080/cotizaciones'; // Ajusta tu puerto si es necesario

  constructor(private http: HttpClient) { }

  listar(): Observable<CotizacionResponse[]> {
    return this.http.get<CotizacionResponse[]>(this.apiUrl);
  }

  registrar(cotizacion: CotizacionRequest): Observable<any> {
    return this.http.post(this.apiUrl, cotizacion);
  }

  aprobar(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/aprobar`, {});
  }

  // ✅ EL MÉTODO MÁGICO PARA EL PDF
  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      responseType: 'blob' // Importante: Indica que esperamos un archivo, no JSON
    });
  }
}