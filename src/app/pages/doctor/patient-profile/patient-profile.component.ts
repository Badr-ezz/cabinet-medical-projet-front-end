import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PatientInfo {
  id: number;
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  email: string;
  adresse: string;
  groupeSanguin: string;
}

interface Consultation {
  id: number;
  date: string;
  type: string;
  diagnostic: string;
  medecin: string;
}

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './patient-profile.component.html'
})
export class PatientProfileComponent {
  patient = signal<PatientInfo>({
    id: 1,
    cin: 'AB123456',
    nom: 'Benali',
    prenom: 'Ahmed',
    dateNaissance: '1985-03-15',
    telephone: '0661234567',
    email: 'ahmed.benali@email.com',
    adresse: '123 Rue Mohammed V, Casablanca',
    groupeSanguin: 'A+'
  });

  dossierMedical = signal({
    antecedentsMedicaux: 'Hypertension artérielle (depuis 2018), Diabète type 2 (depuis 2020)',
    antecedentsChirurgicaux: 'Appendicectomie (2005)',
    allergies: 'Pénicilline, Aspirine',
    traitementsEnCours: 'Metformine 500mg 2x/jour, Amlodipine 5mg 1x/jour',
    habitudes: 'Non-fumeur, Alcool occasionnel'
  });

  historiqueConsultations = signal<Consultation[]>([
    { id: 1, date: '2025-12-28', type: 'Consultation générale', diagnostic: 'Grippe saisonnière', medecin: 'Dr. Alami' },
    { id: 2, date: '2025-11-15', type: 'Suivi diabète', diagnostic: 'Contrôle glycémie - stable', medecin: 'Dr. Alami' },
    { id: 3, date: '2025-10-02', type: 'Contrôle tension', diagnostic: 'TA normale sous traitement', medecin: 'Dr. Alami' },
    { id: 4, date: '2025-08-20', type: 'Consultation générale', diagnostic: 'Lombalgie aiguë', medecin: 'Dr. Alami' }
  ]);

  startConsultation() {
    console.log('Démarrer consultation pour:', this.patient().prenom, this.patient().nom);
  }
}
