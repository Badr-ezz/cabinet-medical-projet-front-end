import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

/**
 * Configuration de l'application Angular
 * 
 * Providers configurés :
 * - provideZoneChangeDetection : Optimise la détection de changements
 * - provideRouter : Configure le routage avec les routes définies
 * - provideHttpClient : Active HttpClient pour les appels API
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient() // Nécessaire pour AuthService
  ]
};
