import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor'; // Vérifiez que ce fichier existe bien

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    
    // ⚡ EN LIEN AVEC L'ERREUR : On force le client HTTP à utiliser notre intercepteur JWT
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    
    provideAnimations()
  ]
};
