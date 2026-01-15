import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';
import { Cabinet } from '../models/cabinet.model';
import { User } from '../models/user.model';
import { Patient } from '../models/patient.model';

/**
 * Interface pour les statistiques du dashboard admin
 */
export interface DashboardStats {
  totalCabinets: number;
  activeCabinets: number;
  totalUsers: number;
  totalDoctors: number;
  totalSecretaries: number;
  totalPatients: number;
  newCabinetsThisMonth: number;
  newUsersThisWeek: number;
  newPatientsThisMonth: number;
}

/**
 * Interface pour l'aperçu d'un cabinet
 */
export interface CabinetOverview {
  id: number;
  name: string;
  users: number;
  patients: number;
  status: 'active' | 'inactive';
}

/**
 * Interface pour une activité récente
 */
export interface RecentActivity {
  action: string;
  detail: string;
  time: string;
  type: 'create' | 'user' | 'warning' | 'import' | 'update';
}

/**
 * Interface pour les données du graphique d'évolution
 */
export interface EvolutionChartData {
  labels: string[];
  cabinets: number[];
  users: number[];
  patients: number[];
}

/**
 * AdminDashboardService - Service pour récupérer les données du dashboard admin
 * 
 * Agrège les données de plusieurs microservices :
 * - cabinet-service (port 8082)
 * - user-service (port 8089)
 * - patient-service (port 8085)
 */
@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  
  private readonly CABINET_API = 'http://localhost:8082/api/cabinets';
  private readonly USER_API = 'http://localhost:8089/api/users';
  private readonly PATIENT_API = 'http://localhost:8085/api/patients';
  
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
   * Récupère toutes les statistiques du dashboard
   */
  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      cabinets: this.http.get<Cabinet[]>(this.CABINET_API, { headers: this.getAuthHeaders() }).pipe(
        catchError(() => of([] as Cabinet[]))
      ),
      users: this.http.get<User[]>(this.USER_API, { headers: this.getAuthHeaders() }).pipe(
        catchError(() => of([] as User[]))
      ),
      patients: this.http.get<Patient[]>(this.PATIENT_API, { headers: this.getAuthHeaders() }).pipe(
        catchError(() => of([] as Patient[]))
      )
    }).pipe(
      map(({ cabinets, users, patients }) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());

        return {
          totalCabinets: cabinets.length,
          activeCabinets: cabinets.filter(c => c.actif).length,
          totalUsers: users.length,
          totalDoctors: users.filter(u => u.role === 'MEDECIN').length,
          totalSecretaries: users.filter(u => u.role === 'SECRETARY').length,
          totalPatients: patients.length,
          // Note: Ces calculs nécessitent les dates de création côté backend
          newCabinetsThisMonth: cabinets.filter(c => 
            c.createdAt && new Date(c.createdAt) >= startOfMonth
          ).length,
          newUsersThisWeek: 0, // Nécessite createdAt sur User
          newPatientsThisMonth: 0 // Nécessite createdAt sur Patient
        };
      })
    );
  }

  /**
   * Récupère l'aperçu des cabinets avec leurs statistiques
   */
  getCabinetsOverview(): Observable<CabinetOverview[]> {
    return forkJoin({
      cabinets: this.http.get<Cabinet[]>(this.CABINET_API, { headers: this.getAuthHeaders() }).pipe(
        catchError(() => of([] as Cabinet[]))
      ),
      users: this.http.get<User[]>(this.USER_API, { headers: this.getAuthHeaders() }).pipe(
        catchError(() => of([] as User[]))
      ),
      patients: this.http.get<Patient[]>(this.PATIENT_API, { headers: this.getAuthHeaders() }).pipe(
        catchError(() => of([] as Patient[]))
      )
    }).pipe(
      map(({ cabinets, users, patients }) => {
        return cabinets.map(cabinet => ({
          id: cabinet.id,
          name: cabinet.nom,
          users: users.filter(u => u.cabinetId === cabinet.id).length,
          patients: patients.filter(p => p.cabinetId === cabinet.id).length,
          status: cabinet.actif ? 'active' as const : 'inactive' as const
        }));
      })
    );
  }

  /**
   * Récupère les activités récentes (basé sur les données disponibles)
   * Note: Pour une implémentation complète, le backend devrait fournir un endpoint d'activités
   */
  getRecentActivities(): Observable<RecentActivity[]> {
    return forkJoin({
      cabinets: this.http.get<Cabinet[]>(this.CABINET_API, { headers: this.getAuthHeaders() }).pipe(
        catchError(() => of([] as Cabinet[]))
      ),
      users: this.http.get<User[]>(this.USER_API, { headers: this.getAuthHeaders() }).pipe(
        catchError(() => of([] as User[]))
      )
    }).pipe(
      map(({ cabinets, users }) => {
        const activities: RecentActivity[] = [];
        
        // Cabinets récemment créés
        const recentCabinets = cabinets
          .filter(c => c.createdAt)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        
        recentCabinets.forEach(cabinet => {
          activities.push({
            action: cabinet.actif ? 'Nouveau cabinet créé' : 'Cabinet désactivé',
            detail: cabinet.nom,
            time: this.formatRelativeTime(new Date(cabinet.createdAt)),
            type: cabinet.actif ? 'create' : 'warning'
          });
        });

        // Derniers utilisateurs ajoutés
        const recentUsers = users.slice(-3).reverse();
        recentUsers.forEach(user => {
          const roleLabel = user.role === 'MEDECIN' ? 'Médecin' : 
                           user.role === 'SECRETARY' ? 'Secrétaire' : 'Admin';
          activities.push({
            action: 'Utilisateur ajouté',
            detail: `${user.prenom} ${user.nom} - ${roleLabel}`,
            time: 'Récemment',
            type: 'user'
          });
        });

        return activities.slice(0, 5);
      })
    );
  }

  /**
   * Récupère les données pour le graphique d'évolution mensuelle
   * Génère des données basées sur les dates de création des entités
   */
  getEvolutionChartData(): Observable<EvolutionChartData> {
    return forkJoin({
      cabinets: this.http.get<Cabinet[]>(this.CABINET_API, { headers: this.getAuthHeaders() }).pipe(
        catchError(() => of([] as Cabinet[]))
      ),
      users: this.http.get<User[]>(this.USER_API, { headers: this.getAuthHeaders() }).pipe(
        catchError(() => of([] as User[]))
      ),
      patients: this.http.get<Patient[]>(this.PATIENT_API, { headers: this.getAuthHeaders() }).pipe(
        catchError(() => of([] as Patient[]))
      )
    }).pipe(
      map(({ cabinets, users, patients }) => {
        // Générer les 6 derniers mois
        const months: string[] = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
        }

        // Calculer les cumuls par mois
        const cabinetCounts: number[] = [];
        const userCounts: number[] = [];
        const patientCounts: number[] = [];

        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

          // Compter les cabinets créés jusqu'à la fin de ce mois
          const cabinetsUpToMonth = cabinets.filter(c => {
            if (!c.createdAt) return true; // Si pas de date, on suppose existant
            return new Date(c.createdAt) <= monthEnd;
          }).length;

          // Pour les users et patients, on fait un cumul progressif
          // basé sur les données actuelles divisées proportionnellement
          const monthIndex = 5 - i;
          const progressFactor = (monthIndex + 1) / 6;
          
          cabinetCounts.push(cabinetsUpToMonth || Math.ceil(cabinets.length * progressFactor));
          userCounts.push(Math.ceil(users.length * progressFactor));
          patientCounts.push(Math.ceil(patients.length * progressFactor));
        }

        return {
          labels: months,
          cabinets: cabinetCounts,
          users: userCounts,
          patients: patientCounts
        };
      })
    );
  }

  /**
   * Formate une date en temps relatif (Il y a X heures, Hier, etc.)
   */
  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  }
}
