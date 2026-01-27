import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  // Asegúrate que environment.base sea 'http://localhost:8080/api' (o similar)
  private apiUrl = `${environment.base}/users`; 

  constructor(private http: HttpClient) { }

  listar(): Observable<any[]> {
    // Esto llama al endpoint GET en tu UsersController de Java
    return this.http.get<any[]>(this.apiUrl);
  }
}