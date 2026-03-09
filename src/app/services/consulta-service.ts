import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  
  // ⚠️ Ajusta esta URL si tu backend está en otro puerto
  private apiUrl = `${environment.base}/api/consultas`; 

  constructor(private http: HttpClient) {}

  /**
   * Consulta un RUC (11 dígitos) o DNI (8 dígitos) en la API
   */
  consultarDocumento(numero: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/documento/${numero}`);
  }
}