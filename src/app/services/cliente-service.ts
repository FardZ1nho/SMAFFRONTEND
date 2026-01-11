// src/app/services/cliente.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ClienteRequest } from '../models/cliente';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:8080/clientes';

  constructor(private http: HttpClient) { }

  // CRUD básico
  crearCliente(cliente: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  obtenerCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  listarClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  listarClientesActivos(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/activos`);
  }

  actualizarCliente(id: number, cliente: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente);
  }

  eliminarCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      observe: 'response',
      responseType: 'text' as 'json'
    });
  }

  // Búsquedas
  obtenerClientePorDocumento(numeroDocumento: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/documento/${numeroDocumento}`);
  }

  buscarClientesPorNombre(nombre: string): Observable<Cliente[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar-nombre`, { params });
  }

  buscarClientes(termino: string): Observable<Cliente[]> {
    const params = new HttpParams().set('termino', termino);
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar`, { params });
  }

  // Filtros
  listarClientesPorTipo(tipoCliente: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/tipo/${tipoCliente}`);
  }
}