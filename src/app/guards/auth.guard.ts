import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard - Garde de route pour l'authentification
 * 
 * Vérifie si l'utilisateur est connecté avant d'accéder à une route protégée.
 * Si non connecté, redirige vers /login
 * 
 * Utilisation dans app.routes.ts :
 * { path: 'admin', canActivate: [authGuard], component: ... }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifie si un token existe
  if (authService.isLoggedIn()) {
    return true; // Autorise l'accès
  }

  // Non connecté - redirige vers login
  router.navigate(['/login']);
  return false;
};
