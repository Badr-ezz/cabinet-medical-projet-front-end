import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';
import { Patient } from '../models/patient.model';
import { RendezVousResponse, StatutRDV } from '../models/appointment.model';

/**
 * Interface pour les statistiques du dashboard secrétaire
 */
export interface SecretaryDashboardStats {
  totalPatients: number;
  rdvToday: number;
  rdvConfirmed: number;
  rdvPending: number;
  rdvCancelled: number;
  patientsThisMonth: number;
}

/**
 * Interface pour un rendez-vous affiché dans le dashboard
 */
export interface DashboardAppointment {
  id: number;
  time: string;
  patientName: string;
  motif: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'in_progress' | 'completed';
}

/**
 * SecretaryDashboardService - Service pour récupérer les données du dashboard secrétaire
 * 
 * Agrège les données de plusieurs microservices :
 * - patient-service (port 8085)
 * - rendezvous-service (port 8083)
 */
@Injectable({
  providedIn: 'root'
})
export class SecretaryDashboardService {
  
  private readonly PATIENT_API = 'http://localhost:8085/api/patients';
  private readonly RDV_API = 'http://localhost:8083/api/rendezvous';
  
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
   * Récupère l'ID du cabinet de l'utilisateur connecté
   */
  private getCabinetId(): number {
    return this.authService.getCabinetId() || 0;
  }

  /**
   * Récupère toutes les statistiques du dashboard
   */
  getDashboardStats(): Observable<SecretaryDashboardStats> {
    const cabinetId = this.getCabinetId();
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    return forkJoin({
      patients: this.http.get<Patient[]>(
        `${this.PATIENT_API}/by-cabinet/${cabinetId}`,
        { headers: this.getAuthHeaders() }
      ).pipe(catchError(() => of([] as Patient[]))),
      
      todayAppointments: this.http.get<RendezVousResponse[]>(
        `${this.RDV_API}/by-date?date=${today}`,
        { headers: this.getAuthHeaders() }
      ).pipe(catchError(() => of([] as RendezVousResponse[]))),
      
      allAppointments: this.http.get<RendezVousResponse[]>(
        `${this.RDV_API}/cabinet/${cabinetId}`,
        { headers: this.getAuthHeaders() }
      ).pipe(catchError(() => of([] as RendezVousResponse[])))
    }).pipe(
      map(({ patients, todayAppointments, allAppointments }) => {
        // Filtrer les RDV d'aujourd'hui par statut
        const rdvConfirmed = todayAppointments.filter(r => r.statut === 'CONFIRME').length;
        const rdvPending = todayAppointments.filter(r => r.statut === 'EN_ATTENTE').length;
        const rdvCancelled = todayAppointments.filter(r => r.statut === 'ANNULE').length;

        // Calculer les nouveaux patients ce mois
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // Note: nécessite createdAt sur Patient pour un calcul précis
        const patientsThisMonth = 0; 

        return {
          totalPatients: patients.length,
          rdvToday: todayAppointments.length,
          rdvConfirmed,
          rdvPending,
          rdvCancelled,
          patientsThisMonth
        };
      })
    );
  }

  /**
   * Récupère les rendez-vous du jour avec les noms des patients
   */
  getTodayAppointments(): Observable<DashboardAppointment[]> {
    const cabinetId = this.getCabinetId();
    const today = new Date().toISOString().split('T')[0];

    return forkJoin({
      appointments: this.http.get<RendezVousResponse[]>(
        `${this.RDV_API}/by-date?date=${today}`,
        { headers: this.getAuthHeaders() }
      ).pipe(catchError(() => of([] as RendezVousResponse[]))),
      
      patients: this.http.get<Patient[]>(
        `${this.PATIENT_API}/by-cabinet/${cabinetId}`,
        { headers: this.getAuthHeaders() }
      ).pipe(catchError(() => of([] as Patient[])))
    }).pipe(
      map(({ appointments, patients }) => {
        // Créer un map des patients pour lookup rapide
        const patientMap = new Map<number, Patient>();
        patients.forEach(p => patientMap.set(p.id, p));

        // Transformer les RDV avec les noms des patients
        return appointments
          .map(rdv => {
            const patient = patientMap.get(rdv.patientId);
            return {
              id: rdv.idRendezVous,
              time: rdv.heureRdv.substring(0, 5), // "HH:mm:ss" -> "HH:mm"
              patientName: patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu',
              motif: rdv.motif || 'Consultation',
              status: this.mapStatus(rdv.statut)
            };
          })
          .sort((a, b) => a.time.localeCompare(b.time)); // Trier par heure
      })
    );
  }

  /**
   * Mappe le statut backend vers le statut frontend
   */
  private mapStatus(statut: StatutRDV): 'confirmed' | 'pending' | 'cancelled' | 'in_progress' | 'completed' {
    switch (statut) {
      case 'CONFIRME': return 'confirmed';
      case 'EN_ATTENTE': return 'pending';
      case 'ANNULE': return 'cancelled';
      case 'EN_COURS': return 'in_progress';
      case 'TERMINE': return 'completed';
      default: return 'pending';
    }
  }
}
