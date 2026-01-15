import { Component, signal, inject, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminDashboardService, DashboardStats, CabinetOverview, RecentActivity, EvolutionChartData } from '../../../services/admin-dashboard.service';
import { Chart, registerables } from 'chart.js';

// Enregistrer tous les composants Chart.js
Chart.register(...registerables);

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private dashboardService = inject(AdminDashboardService);
  
  @ViewChild('evolutionChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  // État de chargement
  isLoading = signal(true);
  isChartLoading = signal(true);
  hasError = signal(false);

  // Données du dashboard
  stats = signal<StatCard[]>([]);
  recentActivities = signal<RecentActivity[]>([]);
  cabinetsOverview = signal<CabinetOverview[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.loadChartData();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
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
            title: 'Cabinets médicaux', 
            value: dashboardStats.totalCabinets.toString(), 
            icon: 'cabinet',
            color: 'blue',
            trend: dashboardStats.newCabinetsThisMonth > 0 
              ? `+${dashboardStats.newCabinetsThisMonth} ce mois` 
              : `${dashboardStats.activeCabinets} actifs`
          },
          { 
            title: 'Utilisateurs', 
            value: dashboardStats.totalUsers.toString(), 
            icon: 'users',
            color: 'green',
            trend: dashboardStats.newUsersThisWeek > 0 
              ? `+${dashboardStats.newUsersThisWeek} cette semaine`
              : 'Total enregistrés'
          },
          { 
            title: 'Médecins', 
            value: dashboardStats.totalDoctors.toString(), 
            icon: 'doctor',
            color: 'purple',
            trend: 'Actifs'
          },
          { 
            title: 'Patients', 
            value: this.formatNumber(dashboardStats.totalPatients), 
            icon: 'patients',
            color: 'yellow',
            trend: dashboardStats.newPatientsThisMonth > 0 
              ? `+${dashboardStats.newPatientsThisMonth} ce mois`
              : 'Total enregistrés'
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

    // Charger l'aperçu des cabinets
    this.dashboardService.getCabinetsOverview().subscribe({
      next: (cabinets) => {
        this.cabinetsOverview.set(cabinets.slice(0, 5)); // Limiter à 5 cabinets
      },
      error: (err) => {
        console.error('Erreur lors du chargement des cabinets:', err);
      }
    });

    // Charger les activités récentes
    this.dashboardService.getRecentActivities().subscribe({
      next: (activities) => {
        this.recentActivities.set(activities);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des activités:', err);
      }
    });
  }

  /**
   * Charge les données du graphique d'évolution
   */
  loadChartData(): void {
    this.isChartLoading.set(true);
    
    this.dashboardService.getEvolutionChartData().subscribe({
      next: (data) => {
        this.createChart(data);
        this.isChartLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du graphique:', err);
        this.isChartLoading.set(false);
      }
    });
  }

  /**
   * Crée le graphique d'évolution
   */
  private createChart(data: EvolutionChartData): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Cabinets',
            data: data.cabinets,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'Utilisateurs',
            data: data.users,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'Patients',
            data: data.patients,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#F59E0B',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                weight: 500
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleFont: {
              size: 14,
              weight: 600
            },
            bodyFont: {
              size: 13
            },
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            usePointStyle: true
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 12
              },
              callback: function(value) {
                return value.toLocaleString('fr-FR');
              }
            }
          }
        }
      }
    });
  }

  /**
   * Rafraîchit les données du dashboard
   */
  refreshData(): void {
    this.loadDashboardData();
    this.loadChartData();
  }

  /**
   * Formate un nombre avec des séparateurs de milliers
   */
  private formatNumber(num: number): string {
    return num.toLocaleString('fr-FR');
  }
}
