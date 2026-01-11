import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts'; // ✅ AGREGAR
import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jw.interceptor'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    provideCharts(withDefaultRegisterables()) // ✅ AGREGAR esta línea
  ]
};