import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Patient {
  id: number;
  cin: string;
  nom: string;
  prenom: string;
  telephone: string;
  dateNaissance: string;
  email: string;
}

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './patients.component.html'
})
export class PatientsComponent {
  // Signal pour la recherche
  searchTerm = signal('');
  searchType = signal<'cin' | 'nom'>('nom');

  // Signal pour le modal
  isModalOpen = signal(false);

  // Données fictives des patients
  patients = signal<Patient[]>([
    { id: 1, cin: 'AB123456', nom: 'Benali', prenom: 'Ahmed', telephone: '0661234567', dateNaissance: '1985-03-15', email: 'ahmed.benali@email.com' },
    { id: 2, cin: 'CD789012', nom: 'Zahrae', prenom: 'Fatima', telephone: '0662345678', dateNaissance: '1990-07-22', email: 'fatima.zahrae@email.com' },
    { id: 3, cin: 'EF345678', nom: 'Alami', prenom: 'Mohamed', telephone: '0663456789', dateNaissance: '1978-11-08', email: 'mohamed.alami@email.com' },
    { id: 4, cin: 'GH901234', nom: 'Idrissi', prenom: 'Sara', telephone: '0664567890', dateNaissance: '1995-01-30', email: 'sara.idrissi@email.com' },
    { id: 5, cin: 'IJ567890', nom: 'Tazi', prenom: 'Youssef', telephone: '0665678901', dateNaissance: '1982-09-12', email: 'youssef.tazi@email.com' },
    { id: 6, cin: 'KL123789', nom: 'El Fassi', prenom: 'Amina', telephone: '0666789012', dateNaissance: '1988-04-25', email: 'amina.elfassi@email.com' },
    { id: 7, cin: 'MN456123', nom: 'Bouazza', prenom: 'Karim', telephone: '0667890123', dateNaissance: '1975-12-03', email: 'karim.bouazza@email.com' },
    { id: 8, cin: 'OP789456', nom: 'Senhaji', prenom: 'Leila', telephone: '0668901234', dateNaissance: '1992-06-18', email: 'leila.senhaji@email.com' }
  ]);

  // Computed signal pour filtrer les patients
  filteredPatients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.patients();

    return this.patients().filter(patient => {
      if (this.searchType() === 'cin') {
        return patient.cin.toLowerCase().includes(term);
      } else {
        return patient.nom.toLowerCase().includes(term) || patient.prenom.toLowerCase().includes(term);
      }
    });
  });

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  // Actions fictives
  editPatient(patient: Patient) {
    console.log('Modifier patient:', patient);
  }

  deletePatient(patient: Patient) {
    console.log('Supprimer patient:', patient);
  }
}
