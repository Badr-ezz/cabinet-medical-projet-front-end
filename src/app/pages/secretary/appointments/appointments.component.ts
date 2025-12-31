import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Appointment {
  id: number;
  date: string;
  heure: string;
  patient: string;
  motif: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './appointments.component.html'
})
export class AppointmentsComponent {
  // Filtre par date
  filterDate = signal('');
  
  // Modal
  isModalOpen = signal(false);

  // Données fictives
  appointments = signal<Appointment[]>([
    { id: 1, date: '2025-12-31', heure: '09:00', patient: 'Ahmed Benali', motif: 'Consultation générale', status: 'confirmed' },
    { id: 2, date: '2025-12-31', heure: '09:30', patient: 'Fatima Zahrae', motif: 'Suivi traitement', status: 'confirmed' },
    { id: 3, date: '2025-12-31', heure: '10:00', patient: 'Mohamed Alami', motif: 'Première visite', status: 'pending' },
    { id: 4, date: '2025-12-31', heure: '10:30', patient: 'Sara Idrissi', motif: 'Contrôle', status: 'confirmed' },
    { id: 5, date: '2025-12-31', heure: '11:00', patient: 'Youssef Tazi', motif: 'Consultation', status: 'cancelled' },
    { id: 6, date: '2026-01-02', heure: '09:00', patient: 'Amina El Fassi', motif: 'Suivi', status: 'pending' },
    { id: 7, date: '2026-01-02', heure: '10:00', patient: 'Karim Bouazza', motif: 'Consultation', status: 'confirmed' },
    { id: 8, date: '2026-01-03', heure: '14:00', patient: 'Leila Senhaji', motif: 'Première visite', status: 'pending' }
  ]);

  // Filtrage par date
  filteredAppointments = computed(() => {
    const date = this.filterDate();
    if (!date) return this.appointments();
    return this.appointments().filter(apt => apt.date === date);
  });

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

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

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  editAppointment(apt: Appointment) {
    console.log('Modifier RDV:', apt);
  }

  cancelAppointment(apt: Appointment) {
    console.log('Annuler RDV:', apt);
  }
}
