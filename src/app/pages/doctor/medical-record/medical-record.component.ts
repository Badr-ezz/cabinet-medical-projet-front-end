import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface DossierMedical {
  antecedentsMedicaux: string;
  antecedentsChirurgicaux: string;
  allergies: string;
  traitementsEnCours: string;
  habitudes: string;
}

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './medical-record.component.html'
})
export class MedicalRecordComponent {
  currentPatient = signal({
    nom: 'Benali',
    prenom: 'Ahmed',
    cin: 'AB123456'
  });

  dossier = signal<DossierMedical>({
    antecedentsMedicaux: 'Hypertension artérielle (depuis 2018)\nDiabète type 2 (depuis 2020)\nAsthme léger (depuis enfance)',
    antecedentsChirurgicaux: 'Appendicectomie (2005)\nHernie inguinale (2015)',
    allergies: 'Pénicilline\nAspirine\nArachides',
    traitementsEnCours: 'Metformine 500mg - 2 fois par jour\nAmlodipine 5mg - 1 fois par jour\nVentoline - si besoin',
    habitudes: 'Non-fumeur\nAlcool occasionnel (vin, événements)\nSédentaire\nAlimentation équilibrée'
  });

  updateDossier(field: keyof DossierMedical, value: string) {
    this.dossier.update(d => ({ ...d, [field]: value }));
  }

  saveDossier() {
    console.log('Mettre à jour dossier:', this.dossier());
    alert('Dossier médical mis à jour (simulation)');
  }
}
