import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Almacen, AlmacenRequest } from '../models/almacen';
import { environment } from '../../environments/environment'; // ⭐ AGREGAR

@Injectable({
    providedIn: 'root'
})
export class AlmacenService {
    private baseUrl = `${environment.base}/almacenes`; // ⭐ CAMBIAR

    constructor(private http: HttpClient) { }

    crearAlmacen(request: AlmacenRequest): Observable<Almacen> {
        return this.http.post<Almacen>(this.baseUrl, request);
    }

    actualizarAlmacen(id: number, request: AlmacenRequest): Observable<Almacen> {
        return this.http.put<Almacen>(`${this.baseUrl}/${id}`, request);
    }

    obtenerAlmacenPorId(id: number): Observable<Almacen> {
        return this.http.get<Almacen>(`${this.baseUrl}/${id}`);
    }

    obtenerAlmacenPorCodigo(codigo: string): Observable<Almacen> {
        return this.http.get<Almacen>(`${this.baseUrl}/codigo/${codigo}`);
    }

    listarTodosLosAlmacenes(): Observable<Almacen[]> {
        return this.http.get<Almacen[]>(this.baseUrl);
    }

    listarAlmacenesActivos(): Observable<Almacen[]> {
        return this.http.get<Almacen[]>(`${this.baseUrl}/activos`);
    }

    cambiarEstadoAlmacen(id: number, activo: boolean): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/${id}/estado?activo=${activo}`, null);
    }

    eliminarAlmacen(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}