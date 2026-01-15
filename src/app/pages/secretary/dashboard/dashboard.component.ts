import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SecretaryDashboardService, SecretaryDashboardStats, DashboardAppointment } from '../../../services/secretary-dashboard.service';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(SecretaryDashboardService);

  // Date actuelle
  currentDate = signal(new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  // État de chargement
  isLoading = signal(true);
  hasError = signal(false);

  // Statistiques
  stats = signal<StatCard[]>([]);

  // Rendez-vous du jour
  upcomingAppointments = signal<DashboardAppointment[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Charge toutes les données du dashboard
   */
  loadDashboardData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    // Charger les statistiques
    this.dashboardService.getDashboardStats().subscribe({
      next: (dashboardStats) => {
        this.stats.set([
          { 
            title: 'Patients inscrits', 
            value: this.formatNumber(dashboardStats.totalPatients), 
            icon: 'patients', 
            color: 'blue', 
            trend: dashboardStats.patientsThisMonth > 0 
              ? `+${dashboardStats.patientsThisMonth}` 
              : ''
          },
          { 
            title: 'RDV aujourd\'hui', 
            value: dashboardStats.rdvToday.toString(), 
            icon: 'calendar', 
            color: 'green', 
            trend: dashboardStats.rdvConfirmed > 0 
              ? `${dashboardStats.rdvConfirmed} confirmé${dashboardStats.rdvConfirmed > 1 ? 's' : ''}` 
              : ''
          },
          { 
            title: 'Paiements du jour', 
            value: '0 DH', // TODO: Intégrer le service de facturation
            icon: 'money', 
            color: 'yellow', 
            trend: ''
          },
          { 
            title: 'En attente', 
            value: dashboardStats.rdvPending.toString(), 
            icon: 'waiting', 
            color: 'red', 
            trend: ''
          }
        ]);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des statistiques:', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });

    // Charger les rendez-vous du jour
    this.dashboardService.getTodayAppointments().subscribe({
      next: (appointments) => {
        this.upcomingAppointments.set(appointments);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rendez-vous:', err);
      }
    });
  }

  /**
   * Rafraîchit les données du dashboard
   */
  refreshData(): void {
    this.loadDashboardData();
  }

  /**
   * Formate un nombre avec séparateur de milliers
   */
  private formatNumber(num: number): string {
    return num.toLocaleString('fr-FR');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      default: return status;
    }
  }
}
