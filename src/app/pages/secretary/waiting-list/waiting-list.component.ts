import { Component, signal } from '@angular/core';

interface WaitingPatient {
  id: number;
  nom: string;
  prenom: string;
  heureArrivee: string;
  motif: string;
  position: number;
}

@Component({
  selector: 'app-waiting-list',
  standalone: true,
  imports: [],
  templateUrl: './waiting-list.component.html'
})
export class WaitingListComponent {
  // Données fictives de la liste d'attente
  waitingPatients = signal<WaitingPatient[]>([
    { id: 1, nom: 'Benali', prenom: 'Ahmed', heureArrivee: '09:15', motif: 'Consultation générale', position: 1 },
    { id: 2, nom: 'Zahrae', prenom: 'Fatima', heureArrivee: '09:25', motif: 'Suivi traitement', position: 2 },
    { id: 3, nom: 'Alami', prenom: 'Mohamed', heureArrivee: '09:40', motif: 'Première visite', position: 3 },
    { id: 4, nom: 'Idrissi', prenom: 'Sara', heureArrivee: '09:55', motif: 'Contrôle', position: 4 },
    { id: 5, nom: 'Tazi', prenom: 'Youssef', heureArrivee: '10:10', motif: 'Consultation', position: 5 }
  ]);

  // Temps d'attente estimé par patient (en minutes)
  estimatedWaitTime = signal(15);

  sendToDoctor(patient: WaitingPatient) {
    console.log('Envoyer au médecin:', patient);
    // En réalité, on retirerait le patient de la liste
  }

  removeFromList(patient: WaitingPatient) {
    console.log('Retirer de la liste:', patient);
  }

  getEstimatedTime(position: number): string {
    const minutes = position * this.estimatedWaitTime();
    if (minutes < 60) {
      return `~${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `~${hours}h${remainingMinutes > 0 ? remainingMinutes : ''}`;
  }
}
