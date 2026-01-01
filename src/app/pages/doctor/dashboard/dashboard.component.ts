import { Component, signal } from '@angular/core';

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
  status: 'en-attente' | 'en-cours' | 'termine';
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html'
})
export class DoctorDashboardComponent {
  doctorName = signal('Dr. Mohammed Alami');
  currentDate = signal(new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  stats = signal<StatCard[]>([
    { 
      title: 'Consultations aujourd\'hui', 
      value: '12', 
      icon: 'consultation',
      color: 'blue',
      trend: '+3 vs hier'
    },
    { 
      title: 'Patients suivis', 
      value: '847', 
      icon: 'patients',
      color: 'green',
      trend: '+24 ce mois'
    },
    { 
      title: 'Ordonnances émises', 
      value: '156', 
      icon: 'prescription',
      color: 'purple',
      trend: 'Ce mois'
    },
    { 
      title: 'Prochain RDV', 
      value: '10:30', 
      icon: 'clock',
      color: 'yellow',
      trend: 'Dans 15 min'
    }
  ]);

  todayPatients = signal<TodayPatient[]>([
    { id: 1, nom: 'Benali', prenom: 'Ahmed', heure: '09:00', type: 'Consultation générale', status: 'termine' },
    { id: 2, nom: 'El Fassi', prenom: 'Fatima', heure: '09:30', type: 'Suivi diabète', status: 'termine' },
    { id: 3, nom: 'Tazi', prenom: 'Karim', heure: '10:00', type: 'Contrôle tension', status: 'en-cours' },
    { id: 4, nom: 'Bennani', prenom: 'Sara', heure: '10:30', type: 'Consultation générale', status: 'en-attente' },
    { id: 5, nom: 'Amrani', prenom: 'Youssef', heure: '11:00', type: 'Renouvellement ordonnance', status: 'en-attente' },
    { id: 6, nom: 'Chraibi', prenom: 'Nadia', heure: '11:30', type: 'Consultation générale', status: 'en-attente' }
  ]);

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
}
