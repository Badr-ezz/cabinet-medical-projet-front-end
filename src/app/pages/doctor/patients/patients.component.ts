import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Patient {
  id: number;
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  dernierVisite: string;
}

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './patients.component.html'
})
export class DoctorPatientsComponent {
  searchCIN = signal('');
  searchNom = signal('');

  patients = signal<Patient[]>([
    { id: 1, cin: 'AB123456', nom: 'Benali', prenom: 'Ahmed', dateNaissance: '1985-03-15', telephone: '0661234567', dernierVisite: '2025-12-28' },
    { id: 2, cin: 'CD789012', nom: 'El Fassi', prenom: 'Fatima', dateNaissance: '1990-07-22', telephone: '0662345678', dernierVisite: '2025-12-30' },
    { id: 3, cin: 'EF345678', nom: 'Tazi', prenom: 'Karim', dateNaissance: '1978-11-08', telephone: '0663456789', dernierVisite: '2026-01-01' },
    { id: 4, cin: 'GH901234', nom: 'Bennani', prenom: 'Sara', dateNaissance: '1995-05-12', telephone: '0664567890', dernierVisite: '2025-12-15' },
    { id: 5, cin: 'IJ567890', nom: 'Amrani', prenom: 'Youssef', dateNaissance: '1982-09-30', telephone: '0665678901', dernierVisite: '2025-12-20' },
    { id: 6, cin: 'KL123789', nom: 'Chraibi', prenom: 'Nadia', dateNaissance: '1988-02-18', telephone: '0666789012', dernierVisite: '2025-11-28' }
  ]);

  filteredPatients = computed(() => {
    let result = this.patients();
    
    if (this.searchCIN()) {
      result = result.filter(p => p.cin.toLowerCase().includes(this.searchCIN().toLowerCase()));
    }
    
    if (this.searchNom()) {
      result = result.filter(p => 
        p.nom.toLowerCase().includes(this.searchNom().toLowerCase()) ||
        p.prenom.toLowerCase().includes(this.searchNom().toLowerCase())
      );
    }
    
    return result;
  });

  onSearch() {
    console.log('Recherche:', this.searchCIN(), this.searchNom());
  }

  clearSearch() {
    this.searchCIN.set('');
    this.searchNom.set('');
  }
}
