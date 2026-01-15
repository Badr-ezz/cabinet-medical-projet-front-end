import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap, catchError, of, forkJoin } from 'rxjs';
import { Facture, FactureRequest, PaiementRequest, BillingStats, FactureWithPatient } from '../models/facture.model';
import { AuthService } from './auth.service';
import { PatientService } from './patient.service';
import { Patient } from '../models/patient.model';

/**
 * BillingService - Service pour la gestion de la facturation
 * 
 * Communique avec le backend rendezvous-service sur le port 8083
 * La facturation est intégrée au service de rendez-vous
 * 
 * Endpoints disponibles :
 * - POST   /api/factures                     → Créer une facture
 * - GET    /api/factures                     → Liste toutes les factures
 * - GET    /api/factures/{id}                → Récupère une facture par ID
 * - GET    /api/factures/cabinet/{cabinetId} → Liste les factures d'un cabinet
 * - GET    /api/factures/patient/{patientId} → Liste les factures d'un patient
 * - GET    /api/factures/rendez-vous/{rdvId} → Facture d'un rendez-vous
 * - PUT    /api/factures/{id}                → Modifier une facture
 * - PATCH  /api/factures/{id}/payer          → Valider le paiement
 * - PATCH  /api/factures/{id}/annuler        → Annuler une facture
 * - DELETE /api/factures/{id}                → Supprimer une facture
 */
@Injectable({
  providedIn: 'root'
})
export class BillingService {

  // API sur le même port que rendezvous-service
  private readonly API_URL = 'http://localhost:8083/api/factures';

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private patientService = inject(PatientService);

  // Cache des factures
  private facturesCache = signal<FactureWithPatient[]>([]);
  
  // Statistiques calculées
  stats = computed<BillingStats>(() => {
    const factures = this.facturesCache();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    return {
      totalFactures: factures.length,
      totalPaye: factures
        .filter(f => f.statut === 'PAYEE')
        .reduce((sum, f) => sum + (f.montant || 0), 0),
      totalEnAttente: factures
        .filter(f => f.statut === 'EN_ATTENTE')
        .reduce((sum, f) => sum + (f.montant || 0), 0),
      facturesAujourdhui: factures
        .filter(f => f.dateCreation?.split('T')[0] === today).length,
      facturesCeMois: factures
        .filter(f => (f.dateCreation?.split('T')[0] || '') >= startOfMonth).length
    };
  });

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

  // ============ API CALLS ============

  /**
   * Récupère toutes les factures
   */
  getAll(): Observable<Facture[]> {
    return this.http.get<Facture[]>(this.API_URL, { headers: this.getAuthHeaders() })
      .pipe(catchError(() => of([] as Facture[])));
  }

  /**
   * Récupère une facture par son ID
   */
  getById(id: number): Observable<Facture | null> {
    return this.http.get<Facture>(`${this.API_URL}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(() => of(null)));
  }

  /**
   * Récupère les factures d'un cabinet avec les infos patient
   */
  getByCabinetId(cabinetId: number): Observable<FactureWithPatient[]> {
    return this.http.get<Facture[]>(
      `${this.API_URL}/cabinet/${cabinetId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(factures => {
        // Mettre à jour le cache avec les factures brutes d'abord
        this.facturesCache.set(factures.map(f => ({ ...f })));
      }),
      catchError(() => of([] as Facture[]))
    );
  }

  /**
   * Récupère les factures d'un cabinet avec enrichissement des données patient
   */
  getByCabinetIdWithPatients(cabinetId: number): Observable<FactureWithPatient[]> {
    return forkJoin({
      factures: this.http.get<Facture[]>(
        `${this.API_URL}/cabinet/${cabinetId}`,
        { headers: this.getAuthHeaders() }
      ).pipe(catchError(() => of([] as Facture[]))),
      patients: this.patientService.getByCabinetId(cabinetId)
        .pipe(catchError(() => of([] as Patient[])))
    }).pipe(
      map(({ factures, patients }) => {
        return factures.map(facture => {
          const patient = patients.find((p: Patient) => p.id === facture.patientId);
          return {
            ...facture,
            patientNom: patient?.nom || facture.patientNom,
            patientPrenom: patient?.prenom || facture.patientPrenom,
            patient: patient ? {
              id: patient.id,
              nom: patient.nom,
              prenom: patient.prenom,
              cin: patient.cin,
              numTel: patient.numTel
            } : undefined
          } as FactureWithPatient;
        });
      }),
      tap(factures => this.facturesCache.set(factures))
    );
  }

  /**
   * Récupère les factures d'un patient
   */
  getByPatientId(patientId: number): Observable<Facture[]> {
    return this.http.get<Facture[]>(
      `${this.API_URL}/patient/${patientId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(() => of([] as Facture[])));
  }

  /**
   * Récupère la facture d'un rendez-vous
   */
  getByRendezVousId(rendezVousId: number): Observable<Facture | null> {
    return this.http.get<Facture>(
      `${this.API_URL}/rendez-vous/${rendezVousId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(() => of(null)));
  }

  /**
   * Crée une nouvelle facture
   */
  create(facture: FactureRequest): Observable<Facture | null> {
    return this.http.post<Facture>(this.API_URL, facture, { headers: this.getAuthHeaders() })
      .pipe(catchError(() => of(null)));
  }

  /**
   * Met à jour une facture existante
   */
  update(id: number, facture: Partial<FactureRequest>): Observable<Facture | null> {
    return this.http.put<Facture>(`${this.API_URL}/${id}`, facture, { headers: this.getAuthHeaders() })
      .pipe(catchError(() => of(null)));
  }

  /**
   * Valide le paiement d'une facture
   * C'est la fonction principale pour la secrétaire
   */
  validatePayment(id: number, paiement: PaiementRequest): Observable<Facture | null> {
    return this.http.patch<Facture>(
      `${this.API_URL}/${id}/payer`,
      paiement,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(facture => {
        if (facture) {
          // Mettre à jour le cache
          const currentCache = this.facturesCache();
          const updatedCache = currentCache.map(f => 
            f.idFacture === id ? { ...f, ...facture } : f
          );
          this.facturesCache.set(updatedCache);
        }
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Annule une facture
   */
  cancel(id: number): Observable<Facture | null> {
    return this.http.patch<Facture>(
      `${this.API_URL}/${id}/annuler`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(facture => {
        if (facture) {
          const currentCache = this.facturesCache();
          const updatedCache = currentCache.map(f => 
            f.idFacture === id ? { ...f, ...facture, statut: 'ANNULEE' as const } : f
          );
          this.facturesCache.set(updatedCache);
        }
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Supprime une facture
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          const currentCache = this.facturesCache();
          this.facturesCache.set(currentCache.filter(f => f.idFacture !== id));
        }),
        map(() => true),
        catchError(() => of(false))
      );
  }

  // ============ UTILITY METHODS ============

  /**
   * Récupère le cache actuel des factures
   */
  getCachedFactures(): FactureWithPatient[] {
    return this.facturesCache();
  }

  /**
   * Génère un numéro de facture unique
   */
  generateNumeroFacture(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FAC-${year}${month}-${random}`;
  }

  /**
   * Formate un montant en DH
   */
  formatMontant(montant: number): string {
    return `${montant.toFixed(2)} DH`;
  }

  /**
   * Retourne le libellé du mode de paiement
   */
  getModePaiementLabel(mode: string | null): string {
    if (!mode) return '-';
    switch (mode) {
      case 'ESPECES': return 'Espèces';
      case 'CARTE': return 'Carte bancaire';
      case 'CHEQUE': return 'Chèque';
      case 'VIREMENT': return 'Virement';
      default: return mode;
    }
  }

  /**
   * Retourne le libellé du statut
   */
  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'PAYEE': return 'Payée';
      case 'EN_ATTENTE': return 'En attente';
      case 'ANNULEE': return 'Annulée';
      default: return statut;
    }
  }

  /**
   * Retourne les classes CSS pour le statut
   */
  getStatutClass(statut: string): string {
    switch (statut) {
      case 'PAYEE': return 'bg-green-100 text-green-800';
      case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-800';
      case 'ANNULEE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
