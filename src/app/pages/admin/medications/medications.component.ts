import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Medication {
  id: number;
  nom: string;
  forme: string;
  dosage: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-medications',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './medications.component.html'
})
export class MedicationsComponent {
  searchTerm = signal('');

  medications = signal<Medication[]>([
    { id: 1, nom: 'Paracétamol', forme: 'Comprimé', dosage: '500mg', status: 'active' },
    { id: 2, nom: 'Paracétamol', forme: 'Comprimé', dosage: '1000mg', status: 'active' },
    { id: 3, nom: 'Amoxicilline', forme: 'Gélule', dosage: '500mg', status: 'active' },
    { id: 4, nom: 'Amoxicilline', forme: 'Suspension', dosage: '250mg/5ml', status: 'active' },
    { id: 5, nom: 'Ibuprofène', forme: 'Comprimé', dosage: '400mg', status: 'active' },
    { id: 6, nom: 'Oméprazole', forme: 'Gélule', dosage: '20mg', status: 'active' },
    { id: 7, nom: 'Metformine', forme: 'Comprimé', dosage: '500mg', status: 'active' },
    { id: 8, nom: 'Metformine', forme: 'Comprimé', dosage: '850mg', status: 'active' },
    { id: 9, nom: 'Amlodipine', forme: 'Comprimé', dosage: '5mg', status: 'active' },
    { id: 10, nom: 'Amlodipine', forme: 'Comprimé', dosage: '10mg', status: 'active' },
    { id: 11, nom: 'Atorvastatine', forme: 'Comprimé', dosage: '20mg', status: 'active' },
    { id: 12, nom: 'Aspirine', forme: 'Comprimé', dosage: '100mg', status: 'inactive' },
    { id: 13, nom: 'Ventoline', forme: 'Aérosol', dosage: '100µg', status: 'active' },
    { id: 14, nom: 'Doliprane', forme: 'Suppositoire', dosage: '300mg', status: 'active' },
    { id: 15, nom: 'Augmentin', forme: 'Comprimé', dosage: '1g', status: 'active' }
  ]);

  filteredMedications = computed(() => {
    if (!this.searchTerm()) {
      return this.medications();
    }
    return this.medications().filter(m => 
      m.nom.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
      m.forme.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
      m.dosage.toLowerCase().includes(this.searchTerm().toLowerCase())
    );
  });

  importMedications() {
    console.log('Import médicaments...');
    alert('Fonctionnalité d\'import (simulation)\n\nFormats supportés: CSV, Excel\nLa liste sera mise à jour après validation.');
  }

  toggleStatus(medication: Medication) {
    const newStatus = medication.status === 'active' ? 'inactive' : 'active';
    console.log('Toggle status:', medication.nom, '->', newStatus);
    alert(`Médicament ${newStatus === 'active' ? 'activé' : 'désactivé'} (simulation)`);
  }
}
