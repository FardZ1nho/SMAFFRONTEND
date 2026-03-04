import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FinanzasDashboard } from '../models/finanzas';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class FinanzasService {
  private apiUrl = `${environment.base}/finanzas`;

  constructor(private http: HttpClient) { }

  obtenerDashboard(inicio?: string, fin?: string): Observable<FinanzasDashboard> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fin) params = params.set('fin', fin);

    return this.http.get<FinanzasDashboard>(`${this.apiUrl}/dashboard`, { params });
  }
}