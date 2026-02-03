import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
// 1. IMPORTAR ANIMACIONES (Necesario para que el calendario se abra suavemente)
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// 2. IMPORTAR ADAPTADORES DE FECHA
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

    // ✅ 3. AGREGADOS AQUÍ:
    provideAnimationsAsync(),        // Habilita animaciones (modales, datepickers)
    provideNativeDateAdapter(),      // Habilita el manejo de fechas nativo
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' } // Pone el calendario en Español Perú
  ]
};