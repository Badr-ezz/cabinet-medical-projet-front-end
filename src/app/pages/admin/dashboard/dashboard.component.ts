import { Component, signal } from '@angular/core';

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
  imports: [],
  templateUrl: './dashboard.component.html'
})
export class AdminDashboardComponent {
  stats = signal<StatCard[]>([
    { 
      title: 'Cabinets médicaux', 
      value: '24', 
      icon: 'cabinet',
      color: 'blue',
      trend: '+3 ce mois'
    },
    { 
      title: 'Utilisateurs', 
      value: '156', 
      icon: 'users',
      color: 'green',
      trend: '+12 cette semaine'
    },
    { 
      title: 'Médecins', 
      value: '48', 
      icon: 'doctor',
      color: 'purple',
      trend: 'Actifs'
    },
    { 
      title: 'Patients', 
      value: '12,847', 
      icon: 'patients',
      color: 'yellow',
      trend: '+324 ce mois'
    }
  ]);

  recentActivities = signal([
    { action: 'Nouveau cabinet créé', detail: 'Cabinet Dentaire El Jadida', time: 'Il y a 2h', type: 'create' },
    { action: 'Utilisateur ajouté', detail: 'Dr. Fatima Bennani - Médecin', time: 'Il y a 3h', type: 'user' },
    { action: 'Cabinet désactivé', detail: 'Cabinet Médical Oujda', time: 'Il y a 5h', type: 'warning' },
    { action: 'Import médicaments', detail: '250 médicaments importés', time: 'Hier', type: 'import' },
    { action: 'Mise à jour système', detail: 'Version 2.4.1 installée', time: 'Il y a 2 jours', type: 'update' }
  ]);

  cabinetsOverview = signal([
    { name: 'Cabinet Médical Casablanca', users: 12, patients: 1250, status: 'active' },
    { name: 'Cabinet Dentaire Rabat', users: 8, patients: 890, status: 'active' },
    { name: 'Cabinet Pédiatrie Marrakech', users: 6, patients: 650, status: 'active' },
    { name: 'Cabinet Médical Fès', users: 4, patients: 420, status: 'inactive' }
  ]);
}
