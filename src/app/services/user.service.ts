import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserRequest } from '../models/user.model';
import { AuthService } from './auth.service';

/**
 * UserService - Service pour la gestion des utilisateurs
 * 
 * Communique avec le backend user-service sur le port 8081
 * 
 * Endpoints disponibles :
 * - GET    /api/users              → Liste tous les utilisateurs
 * - GET    /api/users/{id}         → Récupère un utilisateur par ID
 * - GET    /api/users/byCabinet/{id} → Liste les utilisateurs d'un cabinet
 * - POST   /api/users              → Crée un utilisateur
 * - PUT    /api/users              → Met à jour un utilisateur
 * - DELETE /api/users/{id}         → Supprime un utilisateur
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  // URL de base de l'API user-service
  private readonly API_URL = 'http://localhost:8081/api/users';
  
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Retourne les headers avec le token d'authentification
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Récupère tous les utilisateurs
   * @returns Observable<User[]>
   */
  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL, { headers: this.getAuthHeaders() });
  }

  /**
   * Récupère un utilisateur par son ID
   * @param id - L'identifiant de l'utilisateur
   * @returns Observable<User>
   */
  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Récupère un utilisateur par son login
   * @param login - Le login de l'utilisateur
   * @returns Observable<User>
   */
  getByLogin(login: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/byLogin/${login}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Récupère les utilisateurs d'un cabinet
   * @param cabinetId - L'identifiant du cabinet
   * @returns Observable<User[]>
   */
  getByCabinetId(cabinetId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/byCabinet/${cabinetId}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Crée un nouvel utilisateur
   * @param user - Les données de l'utilisateur à créer
   * @returns Observable<User> - L'utilisateur créé avec son ID
   */
  create(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.API_URL, user, { headers: this.getAuthHeaders() });
  }

  /**
   * Met à jour un utilisateur existant
   * @param user - Les nouvelles données de l'utilisateur (doit inclure l'id)
   * @returns Observable<User> - L'utilisateur mis à jour
   */
  update(user: CreateUserRequest): Observable<User> {
    return this.http.put<User>(this.API_URL, user, { headers: this.getAuthHeaders() });
  }

  /**
   * Supprime un utilisateur
   * @param id - L'identifiant de l'utilisateur à supprimer
   * @returns Observable<void>
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, { headers: this.getAuthHeaders() });
  }
}
