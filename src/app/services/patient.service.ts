import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient, PatientRequest, DossierMedical } from '../models/patient.model';
import { AuthService } from './auth.service';

/**
 * PatientService - Service pour la gestion des patients
 * 
 * Communique avec le backend patient-service sur le port 8085
 * 
 * Endpoints disponibles :
 * - GET    /api/patients                    → Liste tous les patients
 * - GET    /api/patients/{id}               → Récupère un patient par ID
 * - GET    /api/patients/cin/{cin}          → Récupère un patient par CIN
 * - GET    /api/patients/cabinet/{cabinetId}→ Liste les patients d'un cabinet
 * - GET    /api/patients/search?nom={nom}   → Recherche patients par nom
 * - POST   /api/patients                    → Crée un patient
 * - PUT    /api/patients/{id}               → Met à jour un patient
 * - DELETE /api/patients/{id}               → Supprime un patient
 */
@Injectable({
  providedIn: 'root'
})
export class PatientService {
  
  private readonly API_URL = 'http://localhost:8085/api/patients';
  private readonly DOSSIER_URL = 'http://localhost:8085/api/dossiers';
  
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
   * Récupère tous les patients
   */
  getAll(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.API_URL, { headers: this.getAuthHeaders() });
  }

  /**
   * Récupère un patient par son ID
   */
  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.API_URL}/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Récupère un patient par son CIN
   */
  getByCin(cin: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.API_URL}/cin/${cin}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Récupère les patients d'un cabinet
   */
  getByCabinetId(cabinetId: number): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.API_URL}/by-cabinet/${cabinetId}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Recherche des patients par nom
   */
  searchByNom(nom: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.API_URL}/search?nom=${encodeURIComponent(nom)}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Crée un nouveau patient
   */
  create(patient: PatientRequest): Observable<Patient> {
    return this.http.post<Patient>(this.API_URL, patient, { headers: this.getAuthHeaders() });
  }

  /**
   * Met à jour un patient existant
   */
  update(id: number, patient: PatientRequest): Observable<Patient> {
    return this.http.put<Patient>(`${this.API_URL}/${id}`, patient, { headers: this.getAuthHeaders() });
  }

  /**
   * Supprime un patient
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, { headers: this.getAuthHeaders() });
  }

  // ============ Dossier Médical ============

  /**
   * Récupère le dossier médical d'un patient
   */
  getDossierByPatientId(patientId: number): Observable<DossierMedical> {
    return this.http.get<DossierMedical>(`${this.DOSSIER_URL}/patient/${patientId}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Met à jour le dossier médical d'un patient
   */
  updateDossier(patientId: number, dossier: DossierMedical): Observable<DossierMedical> {
    return this.http.put<DossierMedical>(`${this.DOSSIER_URL}/patient/${patientId}`, dossier, { headers: this.getAuthHeaders() });
  }
}
