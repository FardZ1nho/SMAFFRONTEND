import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Almacen, AlmacenRequest } from '../models/almacen';

@Injectable({
    providedIn: 'root'
})
export class AlmacenService {

    private baseUrl = 'http://localhost:8080/almacenes';

    constructor(private http: HttpClient) { }

    /**
     * Crear un nuevo almacén
     */
    crearAlmacen(request: AlmacenRequest): Observable<Almacen> {
        return this.http.post<Almacen>(this.baseUrl, request);
    }

    /**
     * Actualizar un almacén existente
     */
    actualizarAlmacen(id: number, request: AlmacenRequest): Observable<Almacen> {
        return this.http.put<Almacen>(`${this.baseUrl}/${id}`, request);
    }

    /**
     * Obtener un almacén por ID
     */
    obtenerAlmacenPorId(id: number): Observable<Almacen> {
        return this.http.get<Almacen>(`${this.baseUrl}/${id}`);
    }

    /**
     * Obtener un almacén por código
     */
    obtenerAlmacenPorCodigo(codigo: string): Observable<Almacen> {
        return this.http.get<Almacen>(`${this.baseUrl}/codigo/${codigo}`);
    }

    /**
     * Listar todos los almacenes
     */
    listarTodosLosAlmacenes(): Observable<Almacen[]> {
        return this.http.get<Almacen[]>(this.baseUrl);
    }

    /**
     * Listar solo almacenes activos
     */
    listarAlmacenesActivos(): Observable<Almacen[]> {
        return this.http.get<Almacen[]>(`${this.baseUrl}/activos`);
    }

    /**
     * Cambiar estado de un almacén (activar/desactivar)
     */
    cambiarEstadoAlmacen(id: number, activo: boolean): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/${id}/estado?activo=${activo}`, null);
        // ✅ Mejor pasar el parámetro en la URL directamente
    }

    /**
     * Eliminar un almacén
     */
    eliminarAlmacen(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}