import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// 1. CAMBIO IMPORTANTE: Usamos 'provideNoopAnimations'
// Esto permite que el calendario funcione pero SIN efectos de movimiento (evita el error de build)
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jw.interceptor'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled', 
        anchorScrolling: 'enabled'            
      })
    ),
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    provideCharts(withDefaultRegisterables()),

    // ✅ AQUÍ ESTÁ EL ARREGLO:
    provideNoopAnimations(), // Reemplaza a provideAnimationsAsync()

    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' } 
  ]
};