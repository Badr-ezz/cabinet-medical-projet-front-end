import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { AuthResponse } from '../models/auth-response.model';

/**
 * AuthService - Service d'authentification
 * 
 * Responsabilités :
 * - Appeler l'API de login
 * - Stocker le token JWT dans localStorage
 * - Décoder le token pour extraire le rôle utilisateur
 * - Gérer la déconnexion /user-service/api/auth/register
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // URL de base de l'API d'authentification
  private readonly API_URL = 'http://localhost:8089/api/auth';
  
  // Clé pour stocker le token dans localStorage
  private readonly TOKEN_KEY = 'jwt_token';
  
  // Injection des dépendances
  private http = inject(HttpClient);
  private router = inject(Router);

  /**
   * Authentifie l'utilisateur auprès de l'API
   * @param login - Email ou identifiant de l'utilisateur
   * @param pwd - Mot de passe
   * @returns Observable<AuthResponse> - La réponse d'authentification
   */
  login(login: string, pwd: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.API_URL}/login`,
      { login, pwd }
    ).pipe(
      tap(response => {
        // Stocke uniquement le token dans localStorage après un login réussi
        if (response.token && !response.tokenExpired) {
          this.saveToken(response.token);
        }
      })
    );
  }

  /**
   * Sauvegarde le token dans localStorage
   * @param token - Le token JWT à sauvegarder
   */
  private saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Récupère le token stocké dans localStorage
   * @returns Le token JWT ou null s'il n'existe pas
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Vérifie si l'utilisateur est connecté (token présent)
   * @returns true si un token est présent
   */
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Récupère le rôle de l'utilisateur depuis le token JWT
   * 
   * Le token JWT est composé de 3 parties séparées par des points :
   * - Header (base64)
   * - Payload (base64) ← contient les claims dont le rôle
   * - Signature
   * 
   * @returns Le rôle (ADMIN, MEDECIN, SECRETARY) ou null
   */
  getUserRole(): string | null {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    try {
      // Décode le payload du JWT (2ème partie)
      const payload = this.decodeToken(token);
      
      // Le rôle est stocké dans le claim "roles"
      return payload?.roles || null;
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }

  /**
   * Récupère l'ID de l'utilisateur depuis le token JWT
   * @returns L'ID utilisateur ou null
   */
  getUserId(): number | null {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    try {
      const payload = this.decodeToken(token);
      return payload?.id || null;
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }

  /**
   * Décode le payload d'un token JWT sans librairie externe
   * 
   * Étapes :
   * 1. Sépare le token en 3 parties (header.payload.signature)
   * 2. Prend la 2ème partie (payload)
   * 3. Décode le base64
   * 4. Parse le JSON
   * 
   * @param token - Le token JWT complet
   * @returns L'objet payload décodé
   */
  private decodeToken(token: string): any {
    // Sépare le token en ses 3 composants
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      throw new Error('Token JWT invalide');
    }

    // Récupère le payload (2ème partie)
    const payload = parts[1];
    
    // Décode le base64url en base64 standard
    // (JWT utilise base64url qui remplace + par - et / par _)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Décode le base64 en chaîne de caractères
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    // Parse et retourne l'objet JSON
    return JSON.parse(jsonPayload);
  }

  /**
   * Déconnecte l'utilisateur
   * - Supprime le token du localStorage
   * - Redirige vers la page de login
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }
}
