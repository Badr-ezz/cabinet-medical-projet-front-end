import { Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { PatientService } from '../../../services/patient.service';
import { ConsultationService } from '../../../services/consultation.service';
import { AuthService } from '../../../services/auth.service';
import { DatePipe } from '@angular/common';
import { RendezVousResponse } from '../../../models/appointment.model';
import { Patient } from '../../../models/patient.model';
import { Consultation } from '../../../models/consultation.model';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}

interface TodayPatient {
  id: number;
  nom: string;
  prenom: string;
  heure: string;
  type: string;
  status: string;
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './dashboard.component.html'
})
export class DoctorDashboardComponent implements OnInit {
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);
  private authService = inject(AuthService);

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

  ngOnInit() {
    this.loadDoctorInfo();
    this.loadDashboardData();
  }

  loadDoctorInfo() {
    const user = this.authService.getUser();
    if (user) {
      this.doctorName.set(`Dr. ${user.nom} ${user.prenom}`);
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

        // 2. Then Fetch Appointments
        this.appointmentService.getByCabinetMedecinAndDate(cabinetId, medecinId, today).subscribe({
          next: (appointments: RendezVousResponse[]) => {
            // Update stats
            this.updateStat('Consultations aujourd\'hui', appointments.length.toString());

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
          error: (err: any) => console.error('Error loading appointments', err)
        });
      },
      error: (err: any) => console.error('Error loading patients', err)
    });

    // 3. Get Consultations
    this.consultationService.getByMedecinId(medecinId).subscribe({
      next: (consultations: Consultation[]) => {
        // Placeholder for ordonnances count
      },
      error: (err: any) => console.error('Error loading consultations', err)
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
}
