import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { JwtHelperService } from '@auth0/angular-jwt';
import { JwtRequestDTO } from '../models/jwtRequestDTO';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment'; // ⭐ AGREGAR

interface JwtResponse {
  jwttoken: string;
}

interface UserInfo {
  username: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private jwtHelper = new JwtHelperService();
  private currentUserSubject: BehaviorSubject<UserInfo | null>;
  public currentUser$: Observable<UserInfo | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.currentUserSubject = new BehaviorSubject<UserInfo | null>(this.getUserFromToken());
    this.currentUser$ = this.currentUserSubject.asObservable();
    
    const currentUser = this.currentUserSubject.value;
    console.log('🔐 LoginService inicializado con usuario:', currentUser);
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // ⭐ CAMBIAR URL
  login(request: JwtRequestDTO): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${environment.base}/login`, request).pipe(
      tap(response => {
        if (this.isBrowser() && response.jwttoken) {
          sessionStorage.setItem('token', response.jwttoken);
          const userInfo = this.getUserFromToken();
          this.currentUserSubject.next(userInfo);
          console.log('✅ Login exitoso:', userInfo);
        }
      })
    );
  }

  logout(): void {
    if (this.isBrowser()) {
      sessionStorage.removeItem('token');
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
      console.log('👋 Sesión cerrada');
    }
  }

  verificar(): boolean {
    if (!this.isBrowser()) return false;
    
    const token = sessionStorage.getItem('token');
    if (!token) return false;

    try {
      const isExpired = this.jwtHelper.isTokenExpired(token);
      if (isExpired) {
        console.log('⚠️ Token expirado');
        this.logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Error al verificar token:', error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.verificar();
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return sessionStorage.getItem('token');
  }

  private getUserFromToken(): UserInfo | null {
    if (!this.isBrowser()) return null;
    
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.log('⚠️ No hay token en sessionStorage');
      return null;
    }

    try {
      const decodedToken = this.jwtHelper.decodeToken(token);
      console.log('🔍 Token decodificado:', decodedToken);
      
      const userInfo: UserInfo = {
        username: decodedToken?.sub || decodedToken?.username || 'Usuario',
        role: decodedToken?.role || decodedToken?.authorities?.[0] || 'USER'
      };
      
      console.log('👤 Usuario extraído del token:', userInfo);
      return userInfo;
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
      return null;
    }
  }

  refreshUser(): void {
    const userInfo = this.getUserFromToken();
    this.currentUserSubject.next(userInfo);
    console.log('🔄 Usuario refrescado:', userInfo);
  }

  showRole(): string {
    const user = this.currentUserSubject.value;
    return user?.role || '';
  }

  showUsername(): string {
    const user = this.currentUserSubject.value;
    return user?.username || '';
  }

  hasRole(role: string): boolean {
    return this.showRole() === role;
  }
}