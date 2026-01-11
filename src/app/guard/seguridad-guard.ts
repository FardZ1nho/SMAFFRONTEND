import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { LoginService } from '../services/login-service';

// ⭐ Cambiado de "authGuard" a "seguridadGuard" para coincidir con el import
export const seguridadGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const loginService = inject(LoginService);
  
  console.log('🛡️ Guard ejecutado para ruta:', state.url);
  
  if (isPlatformBrowser(platformId)) {
    if (loginService.verificar()) {
      console.log('✅ Usuario autenticado');
      return true;
    }
  }
  
  console.log('❌ No autenticado - Redirigiendo a /login');
  router.navigate(['/login']);
  return false;
};