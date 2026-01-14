import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { RendezVousRequest, RendezVousResponse, TimeSlot, PatientForAppointment } from '../models/appointment.model';
import { AuthService } from './auth.service';
import { PatientService } from './patient.service';

/**
 * AppointmentService - Service pour la gestion des rendez-vous
 * 
 * Communique avec le backend rendezvous-service sur le port 8083
 * 
 * Endpoints disponibles :
 * - POST   /api/rendezvous                    → Créer un RDV
 * - GET    /api/rendezvous/cabinet/{id}       → Liste les RDV d'un cabinet
 * - GET    /api/rendezvous/by-date            → RDV par date
 * - PUT    /api/rendezvous/{id}               → Modifier un RDV
 * - PATCH  /api/rendezvous/{id}/annuler       → Annuler un RDV
 * - DELETE /api/rendezvous/{id}               → Supprimer un RDV
 */
@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  private readonly API_URL = 'http://localhost:8083/api/rendezvous';

  // Configuration des créneaux horaires
  private readonly HEURE_DEBUT = 9;   // 09:00
  private readonly HEURE_FIN = 17;    // 17:00
  private readonly DUREE_CRENEAU = 30; // 30 minutes

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private patientService = inject(PatientService);

  // Cache des rendez-vous pour éviter les appels répétés
  private appointmentsCache = signal<RendezVousResponse[]>([]);
  private lastFetchDate = signal<string>('');

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
   * Récupère tous les rendez-vous du cabinet
   */
  getAllByCabinet(cabinetId: number): Observable<RendezVousResponse[]> {
    console.log( this.getAuthHeaders() );
    
    return this.http.get<RendezVousResponse[]>(
      `${this.API_URL}/cabinet/${cabinetId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Récupère les rendez-vous pour une date donnée
   */
  getByDate(date: string): Observable<RendezVousResponse[]> {
    return this.http.get<RendezVousResponse[]>(
      `${this.API_URL}/by-date?date=${date}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(appointments => {
        this.appointmentsCache.set(appointments);
        this.lastFetchDate.set(date);
      })
    );
  }

  /**
   * Récupère les rendez-vous par cabinet et date
   */
  getByCabinetAndDate(cabinetId: number, date: string): Observable<RendezVousResponse[]> {
    // L'API ne supporte pas directement cette combinaison, on filtre côté client
    return this.getAllByCabinet(cabinetId).pipe(
      map(appointments => appointments.filter(apt => apt.dateRdv === date)),
      tap(appointments => {
        this.appointmentsCache.set(appointments);
        this.lastFetchDate.set(date);
      })
    );
  }

  /**
   * Récupère les rendez-vous par cabinet, médecin et date
   */
  getByCabinetMedecinAndDate(cabinetId: number, medecinId: number, date: string): Observable<RendezVousResponse[]> {
    return this.http.get<RendezVousResponse[]>(
      `${this.API_URL}/cabinet/${cabinetId}/medecin/${medecinId}?date=${date}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(appointments => {
        this.appointmentsCache.set(appointments);
        this.lastFetchDate.set(date);
      })
    );
  }

  /**
   * Récupère un rendez-vous par son ID
   */
  getById(id: number): Observable<RendezVousResponse> {
    return this.http.get<RendezVousResponse>(
      `${this.API_URL}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Crée un nouveau rendez-vous
   */
  create(request: RendezVousRequest): Observable<RendezVousResponse> {
    return this.http.post<RendezVousResponse>(
      this.API_URL,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Met à jour un rendez-vous
   */
  update(id: number, request: RendezVousRequest): Observable<RendezVousResponse> {
    return this.http.put<RendezVousResponse>(
      `${this.API_URL}/${id}`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Confirme un rendez-vous
   */
  confirm(id: number): Observable<RendezVousResponse> {
    return this.http.patch<RendezVousResponse>(
      `${this.API_URL}/${id}/confirmer`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Annule un rendez-vous
   */
  cancel(id: number): Observable<RendezVousResponse> {
    return this.http.patch<RendezVousResponse>(
      `${this.API_URL}/${id}/annuler`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Supprime un rendez-vous (ADMIN uniquement)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Récupère l'historique des rendez-vous d'un patient
   */
  getPatientHistory(cabinetId: number, patientId: number): Observable<RendezVousResponse[]> {
    return this.http.get<RendezVousResponse[]>(
      `${this.API_URL}/cabinet/${cabinetId}/patient/${patientId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ============ HELPERS ============

  /**
   * Génère tous les créneaux horaires pour une date donnée
   * avec indication de disponibilité basée sur les RDV en cache
   */
  generateTimeSlots(appointments: RendezVousResponse[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    // Filtrer les RDV annulés
    const activeAppointments = appointments.filter(apt => apt.statut !== 'ANNULE');

    for (let hour = this.HEURE_DEBUT; hour < this.HEURE_FIN; hour++) {
      // Créneau à l'heure pile (ex: 09:00)
      const heure1 = `${hour.toString().padStart(2, '0')}:00`;
      const apt1 = activeAppointments.find(a => this.formatHeureForSlot(a.heureRdv) === heure1);
      slots.push({
        heure: heure1,
        isFree: !apt1,
        appointment: apt1
      });

      // Créneau à la demi-heure (ex: 09:30)
      const heure2 = `${hour.toString().padStart(2, '0')}:30`;
      const apt2 = activeAppointments.find(a => this.formatHeureForSlot(a.heureRdv) === heure2);
      slots.push({
        heure: heure2,
        isFree: !apt2,
        appointment: apt2
      });
    }

    return slots;
  }

  /**
   * Convertit l'heure API (HH:mm:ss) en format slot (HH:mm)
   */
  formatHeureForSlot(heureRdv: string): string {
    // L'API retourne "10:30:00", on veut "10:30"
    return heureRdv.substring(0, 5);
  }

  /**
   * Convertit l'heure slot (HH:mm) en format API (HH:mm:ss)
   */
  formatHeureForApi(heureSlot: string): string {
    return `${heureSlot}:00`;
  }

  /**
   * Vérifie si un créneau est disponible
   */
  isSlotAvailable(appointments: RendezVousResponse[], heure: string, excludeAppointmentId?: number): boolean {
    const activeAppointments = appointments.filter(apt => 
      apt.statut !== 'ANNULE' && apt.idRendezVous !== excludeAppointmentId
    );
    return !activeAppointments.some(apt => this.formatHeureForSlot(apt.heureRdv) === heure);
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Retourne la date d'aujourd'hui au format YYYY-MM-DD
   */
  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Retourne le libellé du statut en français
   */
  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRME': return 'Confirmé';
      case 'ANNULE': return 'Annulé';
      case 'EN_COURS': return 'En cours';
      case 'TERMINE': return 'Terminé';
      default: return statut;
    }
  }

  /**
   * Retourne les classes CSS pour le statut
   */
  getStatutClass(statut: string): string {
    switch (statut) {
      case 'CONFIRME': return 'bg-green-100 text-green-800';
      case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-800';
      case 'ANNULE': return 'bg-red-100 text-red-800';
      case 'EN_COURS': return 'bg-blue-100 text-blue-800';
      case 'TERMINE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
