import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CotizacionRequest, CotizacionResponse, EstadoPipeline } from '../models/cotizacion';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {

  private apiUrl = `${environment.base}/cotizaciones`; 

  constructor(private http: HttpClient) { }

  listar(): Observable<CotizacionResponse[]> {
    return this.http.get<CotizacionResponse[]>(this.apiUrl);
  }

  registrar(cotizacion: CotizacionRequest): Observable<CotizacionResponse> {
    return this.http.post<CotizacionResponse>(this.apiUrl, cotizacion);
  }

  // ⭐ NUEVO: Mueve la cotización por el embudo CRM
  actualizarEstadoPipeline(id: number, estado: EstadoPipeline, motivoPerdida?: string): Observable<CotizacionResponse> {
    let params = new HttpParams().set('estado', estado);
    
    // Si la arrastran a PERDIDA y escriben un motivo, lo enviamos
    if (motivoPerdida) {
      params = params.set('motivoPerdida', motivoPerdida);
    }

    // Enviamos un body vacío {} porque los datos van como parámetros en la URL
    return this.http.put<CotizacionResponse>(`${this.apiUrl}/${id}/estado`, {}, { params });
  }

  // ✅ EL MÉTODO MÁGICO PARA EL PDF (Intacto)
  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      responseType: 'blob' 
    });
  }
}