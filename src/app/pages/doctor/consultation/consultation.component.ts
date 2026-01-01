import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ConsultationForm {
  type: string;
  diagnostic: string;
  observations: string;
  traitement: string;
}

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './consultation.component.html'
})
export class ConsultationComponent {
  currentPatient = signal({
    nom: 'Benali',
    prenom: 'Ahmed',
    cin: 'AB123456',
    age: 40
  });

  consultationTypes = signal([
    'Consultation générale',
    'Suivi diabète',
    'Contrôle tension',
    'Renouvellement ordonnance',
    'Urgence',
    'Suivi post-opératoire'
  ]);

  form = signal<ConsultationForm>({
    type: '',
    diagnostic: '',
    observations: '',
    traitement: ''
  });

  updateForm(field: keyof ConsultationForm, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  saveConsultation() {
    console.log('Enregistrer consultation:', this.form());
    alert('Consultation enregistrée (simulation)');
  }

  modifyConsultation() {
    console.log('Modifier consultation');
  }

  deleteConsultation() {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette consultation ?')) {
      console.log('Supprimer consultation');
      alert('Consultation supprimée (simulation)');
    }
  }

  generateOrdonnance() {
    console.log('Générer ordonnance');
  }
}
