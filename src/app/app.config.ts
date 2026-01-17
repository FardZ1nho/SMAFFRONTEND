import { ApplicationConfig } from '@angular/core';
// 1. IMPORTAR withInMemoryScrolling
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jw.interceptor'; 

export const appConfig: ApplicationConfig = {
  providers: [
    // 2. CONFIGURAR EL SCROLL AQUÍ 👇
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled', // Resetea el scroll al cambiar de página
        anchorScrolling: 'enabled'            // Permite usar anclas #seccion
      })
    ),
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    provideCharts(withDefaultRegisterables())
  ]
};