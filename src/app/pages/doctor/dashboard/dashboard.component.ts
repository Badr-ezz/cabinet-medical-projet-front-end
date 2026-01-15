import { Component, signal, inject, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { PatientService } from '../../../services/patient.service';
import { ConsultationService } from '../../../services/consultation.service';
import { AuthService } from '../../../services/auth.service';
import { MedecinService } from '../../../services/medecin.service';
import { RendezVousResponse } from '../../../models/appointment.model';
import { Patient } from '../../../models/patient.model';
import { Consultation } from '../../../models/consultation.model';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}

interface TodayPatient {
  id: number;
  patientId: number; // Actual patient ID from database
  nom: string;
  prenom: string;
  heure: string;
  type: string;
  status: string;
}

interface RecentActivity {
  id: number;
  type: 'consultation' | 'ordonnance' | 'patient';
  label: string;
  description: string;
  timestamp: Date;
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [DatePipe, CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html'
})
export class DoctorDashboardComponent implements OnInit {
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);
  private authService = inject(AuthService);
  private medecinService = inject(MedecinService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  doctorName = signal('');
  currentDate = signal(new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  stats = signal<StatCard[]>([
    {
      title: 'Consultations aujourd\'hui',
      value: '0',
      icon: 'consultation',
      color: 'blue',
      trend: 'Du jour'
    },
    {
      title: 'Patients suivis',
      value: '0',
      icon: 'patients',
      color: 'green',
      trend: 'Total cabinet'
    },
    {
      title: 'Ordonnances émises',
      value: '0',
      icon: 'prescription',
      color: 'purple',
      trend: 'Total'
    },
    {
      title: 'Prochain RDV',
      value: '--:--',
      icon: 'clock',
      color: 'yellow',
      trend: 'A venir'
    }
  ]);

  todayPatients = signal<TodayPatient[]>([]);
  recentActivities = signal<RecentActivity[]>([]);
  patientsMap = signal<Map<number, Patient>>(new Map()); // Store patients for name mapping

  // Chart configuration
  public weeklyChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0],
        label: 'Consultations',
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      }
    ]
  };

  public weeklyChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  ngOnInit() {
    this.loadDoctorInfo();
    this.loadDashboardData();
    this.loadRecentActivities();
    this.loadWeeklyChart();
  }

  startConsultation(patient: TodayPatient) {
    // Navigate to consultation page with patient ID and appointment ID
    this.router.navigate(['/doctor/consultation'], {
      queryParams: {
        patientId: patient.patientId,
        rendezVousId: patient.id
      }
    });
  }

  loadDoctorInfo() {
    const user = this.authService.getUser();
    if (user && user.id) {
      // Fetch doctor info from API to get nom and prenom
      this.medecinService.getById(user.id).subscribe({
        next: (medecin) => {
          this.doctorName.set(`Dr. ${medecin.nom} ${medecin.prenom}`);
        },
        error: (err) => {
          console.error('Error loading doctor info', err);
          // Fallback to login from token
          this.doctorName.set(`Dr. ${user.login || 'Médecin'}`);
        }
      });
    }
  }

  loadDashboardData() {
    const user = this.authService.getUser();
    if (!user) return;

    const cabinetId = user.cabinetId || 1;
    const medecinId = user.id;
    const today = this.appointmentService.getTodayDate();

    // 1. Fetch Patients first (to map names)
    this.patientService.getByCabinetId(cabinetId).subscribe({
      next: (patients: Patient[]) => {
        this.updateStat('Patients suivis', patients.length.toString());

        // Store patients map for later use
        const patientMap = new Map<number, Patient>();
        patients.forEach(p => patientMap.set(p.id!, p));
        this.patientsMap.set(patientMap);

        // 2. Then Fetch Appointments
        this.appointmentService.getByCabinetMedecinAndDate(cabinetId, medecinId, today).subscribe({
          next: (appointments: RendezVousResponse[]) => {
            // Update next appointment
            const now = new Date();
            const nextApt = appointments
              .filter(a => a.statut !== 'ANNULE' && a.statut !== 'TERMINE')
              .sort((a, b) => a.heureRdv.localeCompare(b.heureRdv))
              .find(a => {
                const [hours, minutes] = a.heureRdv.split(':');
                const aptDate = new Date();
                aptDate.setHours(parseInt(hours), parseInt(minutes), 0);
                return aptDate > now;
              });

            if (nextApt) {
              this.updateStat('Prochain RDV', nextApt.heureRdv.substring(0, 5));
            }

            // Map to TodayPatient
            const patientsList: TodayPatient[] = appointments.map(apt => {
              const patient = patients.find(p => p.id === apt.patientId);
              return {
                id: apt.idRendezVous,
                patientId: apt.patientId, // Store actual patient ID
                nom: patient ? patient.nom : 'Inconnu',
                prenom: patient ? patient.prenom : '',
                heure: apt.heureRdv.substring(0, 5),
                type: 'Consultation', // Default or derive from type
                status: apt.statut === 'CONFIRME' ? 'en-attente' :
                  apt.statut === 'EN_COURS' ? 'en-cours' :
                    apt.statut === 'TERMINE' ? 'termine' : apt.statut.toLowerCase()
              };
            });
            this.todayPatients.set(patientsList);
          },
          error: (err: any) => {
            // Silent fail - keep default values
          }
        });
      },
      error: (err: any) => {
        // Silent fail - keep default values
      }
    });

    // 3. Get Consultations and count ordonnances + today's consultations
    this.consultationService.getByMedecinId(medecinId).subscribe({
      next: (consultations: Consultation[]) => {
        // Count total ordonnances from all consultations
        const totalOrdonnances = consultations.reduce((total, consultation) => {
          return total + (consultation.ordonnances?.length || 0);
        }, 0);
        this.updateStat('Ordonnances émises', totalOrdonnances.toString());

        // Count today's consultations
        const todayStr = new Date().toISOString().split('T')[0];
        const todayConsultations = consultations.filter(c => {
          return c.dateConsultation === todayStr;
        });
        this.updateStat('Consultations aujourd\'hui', todayConsultations.length.toString());
      },
      error: (err: any) => {
        // Silent fail - keep default values
      }
    });
  }

  updateStat(title: string, value: string) {
    this.stats.update(stats =>
      stats.map(s => s.title === title ? { ...s, value } : s)
    );
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'termine': return 'bg-gray-100 text-gray-600';
      case 'en-cours': return 'bg-green-100 text-green-700';
      case 'en-attente': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'termine': return 'Terminé';
      case 'en-cours': return 'En cours';
      case 'en-attente': return 'En attente';
      default: return status;
    }
  }

  newConsultation() {
    this.router.navigate(['/doctor/consultation']);
  }

  getPatientsEnAttente(): number {
    return this.todayPatients().filter(p => p.status === 'en-attente').length;
  }

  loadRecentActivities() {
    const user = this.authService.getUser();
    if (!user) return;

    const cabinetId = user.cabinetId || 1;

    // First load patients to ensure patientsMap is populated
    this.patientService.getByCabinetId(cabinetId).subscribe({
      next: (patients: Patient[]) => {
        // Build patient map
        const patientMap = new Map<number, Patient>();
        patients.forEach(p => patientMap.set(p.id!, p));

        // Now load consultations with patient names
        this.consultationService.getByMedecinId(user.id).subscribe({
          next: (consultations: Consultation[]) => {
            const activities: RecentActivity[] = [];

            // Sort by most recent first (using createdAt)
            const sortedConsultations = consultations
              .filter(c => c.createdAt)
              .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
              .slice(0, 5); // Take only last 5

            sortedConsultations.forEach((consultation) => {
              const consultationTime = new Date(consultation.createdAt!);
              const patient = patientMap.get(consultation.patientId);
              const patientName = patient ? `${patient.prenom} ${patient.nom}` : `Patient #${consultation.patientId}`;

              // Add consultation activity
              activities.push({
                id: consultation.id * 10,
                type: 'consultation',
                label: 'Consultation terminée',
                description: `${patientName} - ${this.getTimeAgo(consultationTime)}`,
                timestamp: consultationTime
              });

              // Add ordonnance activity if consultation has ordonnances
              if (consultation.ordonnances && consultation.ordonnances.length > 0) {
                activities.push({
                  id: consultation.id * 10 + 1,
                  type: 'ordonnance',
                  label: 'Ordonnance générée',
                  description: `${patientName} - ${this.getTimeAgo(consultationTime)}`,
                  timestamp: consultationTime
                });
              }
            });

            // Sort all activities by timestamp and take top 5
            const sortedActivities = activities
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .slice(0, 5);

            this.recentActivities.set(sortedActivities);
          }
        });
      }
    });
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `il y a ${diffHours}h`;
    } else {
      return `il y a ${diffDays}j`;
    }
  }

  loadWeeklyChart() {
    const user = this.authService.getUser();
    if (!user) return;

    this.consultationService.getByMedecinId(user.id).subscribe({
      next: (consultations: Consultation[]) => {
        // Get current week (Monday to Saturday)
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);

        // Count consultations for each day
        const weekData = [0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat

        consultations.forEach(consultation => {
          const consultationDate = new Date(consultation.dateConsultation);
          consultationDate.setHours(0, 0, 0, 0);

          // Calculate days difference from Monday
          const diffTime = consultationDate.getTime() - monday.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // If consultation is within this week (0-5 = Mon-Sat)
          if (diffDays >= 0 && diffDays < 6) {
            weekData[diffDays]++;
          }
        });

        // Update chart data
        this.weeklyChartData.datasets[0].data = weekData;

        // Force chart update
        if (this.chart) {
          this.chart.update();
        }
        this.cdr.detectChanges();
      }
    });
  }
}
