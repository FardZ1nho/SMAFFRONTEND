import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CuentaBancaria } from '../models/cuenta-bancaria';

@Injectable({
  providedIn: 'root'
})
export class CuentaBancariaService {

  // Asegúrate de que tu environment tenga la URL base (ej: 'http://localhost:8080/api')
  private apiUrl = `${environment.base}/cuentas-bancarias`;

  constructor(private http: HttpClient) { }

  // 1. Listar todas (Para la pantalla de administración de cuentas)
  listarTodas(): Observable<CuentaBancaria[]> {
    return this.http.get<CuentaBancaria[]>(this.apiUrl);
  }

  // 2. Listar SOLO activas (Para los desplegables en Ventas/Cobros)
  listarActivas(): Observable<CuentaBancaria[]> {
    return this.http.get<CuentaBancaria[]>(`${this.apiUrl}/activas`);
  }

  // 3. Obtener por ID (Para editar)
  obtenerPorId(id: number): Observable<CuentaBancaria> {
    return this.http.get<CuentaBancaria>(`${this.apiUrl}/${id}`);
  }

  // 4. Crear nueva cuenta
  crear(cuenta: CuentaBancaria): Observable<CuentaBancaria> {
    return this.http.post<CuentaBancaria>(this.apiUrl, cuenta);
  }

  // 5. Actualizar cuenta existente
  actualizar(id: number, cuenta: CuentaBancaria): Observable<CuentaBancaria> {
    return this.http.put<CuentaBancaria>(`${this.apiUrl}/${id}`, cuenta);
  }

  // 6. Eliminar (Cuidado: Solo si no tiene pagos asociados)
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 7. Desactivar (Recomendado si ya tiene historial)
  desactivar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/desactivar`, {});
  }
}