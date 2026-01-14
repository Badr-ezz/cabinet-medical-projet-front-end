import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cabinet, CreateCabinetRequest } from '../models/cabinet.model';

/**
 * CabinetService - Service pour la gestion des cabinets médicaux
 * 
 * Communique avec le backend cabinet-service sur le port 8082
 * 
 * Endpoints disponibles :
 * - POST   /api/cabinets       → Créer un cabinet
 * - GET    /api/cabinets       → Récupérer tous les cabinets
 * - GET    /api/cabinets/active → Récupérer les cabinets actifs
 * - GET    /api/cabinets/{id}  → Récupérer un cabinet par ID
 * - PUT    /api/cabinets/{id}  → Mettre à jour un cabinet
 * - DELETE /api/cabinets/{id}  → Désactiver un cabinet (soft delete)
 */
@Injectable({
  providedIn: 'root'
})
export class CabinetService {
  
  // URL de base de l'API cabinet-service
  private readonly API_URL = 'http://localhost:8081/api/cabinets';
  
  private http = inject(HttpClient);

  /**
   * Récupère tous les cabinets (actifs et inactifs)
   * @returns Observable<Cabinet[]>
   */
  getAll(): Observable<Cabinet[]> {
    return this.http.get<Cabinet[]>(this.API_URL);
  }

  /**
   * Récupère uniquement les cabinets actifs
   * @returns Observable<Cabinet[]>
   */
  getActive(): Observable<Cabinet[]> {
    return this.http.get<Cabinet[]>(`${this.API_URL}/active`);
  }

  /**
   * Récupère un cabinet par son ID
   * @param id - L'identifiant du cabinet
   * @returns Observable<Cabinet>
   */
  getById(id: number): Observable<Cabinet> {
    return this.http.get<Cabinet>(`${this.API_URL}/${id}`);
  }

  /**
   * Crée un nouveau cabinet
   * @param cabinet - Les données du cabinet à créer
   * @returns Observable<Cabinet> - Le cabinet créé avec son ID
   */
  create(cabinet: CreateCabinetRequest): Observable<Cabinet> {
    return this.http.post<Cabinet>(this.API_URL, cabinet);
  }

  /**
   * Met à jour un cabinet existant
   * @param id - L'identifiant du cabinet à mettre à jour
   * @param cabinet - Les nouvelles données du cabinet
   * @returns Observable<Cabinet> - Le cabinet mis à jour
   */
  update(id: number, cabinet: CreateCabinetRequest): Observable<Cabinet> {
    return this.http.put<Cabinet>(`${this.API_URL}/${id}`, cabinet);
  }

  /**
   * Désactive un cabinet (soft delete)
   * Le cabinet n'est pas supprimé mais son statut actif passe à false
   * @param id - L'identifiant du cabinet à désactiver
   * @returns Observable<void>
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
