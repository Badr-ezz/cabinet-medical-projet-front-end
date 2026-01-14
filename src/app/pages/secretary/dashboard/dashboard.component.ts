import { Component, signal } from '@angular/core';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}

interface Appointment {
  time: string;
  patient: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  // Date actuelle
  currentDate = signal(new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  // Statistiques fictives
  stats = signal<StatCard[]>([
    { title: 'Patients inscrits', value: '1,234', icon: 'patients', color: 'blue', trend: '+12%' },
    { title: 'RDV aujourd\'hui', value: '18', icon: 'calendar', color: 'green', trend: '+3' },
    { title: 'Paiements du jour', value: '2,450 DH', icon: 'money', color: 'yellow', trend: '+850 DH' },
    { title: 'En attente', value: '5', icon: 'waiting', color: 'red', trend: '' }
  ]);

  // Prochains RDV fictifs
  upcomingAppointments = signal<Appointment[]>([
    { time: '09:00', patient: 'Ahmed Benali', status: 'confirmed' },
    { time: '09:30', patient: 'Fatima Zahrae', status: 'confirmed' },
    { time: '10:00', patient: 'Mohamed Alami', status: 'pending' },
    { time: '10:30', patient: 'Sara Idrissi', status: 'confirmed' },
    { time: '11:00', patient: 'Youssef Tazi', status: 'cancelled' }
  ]);

  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }
}
