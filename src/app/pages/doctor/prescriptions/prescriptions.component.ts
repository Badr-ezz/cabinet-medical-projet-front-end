import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrdonnanceService, TypeOrdonnance } from '../../../services/ordonnance.service';

interface Medicament {
  id: number;
  nom: string;
  posologie: string;
  duree: string;
}

interface Examen {
  id: number;
  type: string;
  details: string;
}

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './prescriptions.component.html'
})
export class PrescriptionsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ordonnanceService = inject(OrdonnanceService);

  consultationId: number | null = null;

  currentPatient = signal({
    nom: 'Benali',
    prenom: 'Ahmed',
    cin: 'AB123456'
  });

  // Lists
  medicaments = signal<Medicament[]>([]);

  examens = signal<Examen[]>([]);

  // Form Inputs
  newMedicament = signal({ nom: '', posologie: '', duree: '' });
  newExamen = signal({ type: '', details: '' });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.consultationId = params['consultationId'] ? +params['consultationId'] : null;
      console.log('Prescriptions Component Init. Consultation ID:', this.consultationId);

      if (this.consultationId) {
        // TODO: Fetch existing ordonnances/medicaments for this consultation
        // This requires a method in OrdonnanceService to getByConsultationId
        // For now, we start empty.
      }
    });
  }

  updateNewMedicament(field: 'nom' | 'posologie' | 'duree', value: string) {
    this.newMedicament.update(m => ({ ...m, [field]: value }));
  }

  updateNewExamen(field: 'type' | 'details', value: string) {
    this.newExamen.update(e => ({ ...e, [field]: value }));
  }

  addMedicament() {
    if (this.newMedicament().nom) {
      const newId = Math.max(...this.medicaments().map(m => m.id), 0) + 1;
      this.medicaments.update(m => [...m, { ...this.newMedicament(), id: newId }]);
      this.newMedicament.set({ nom: '', posologie: '', duree: '' });
    }
  }

  removeMedicament(id: number) {
    this.medicaments.update(m => m.filter(med => med.id !== id));
  }

  addExamen() {
    if (this.newExamen().type) {
      const newId = Math.max(...this.examens().map(e => e.id), 0) + 1;
      this.examens.update(e => [...e, { ...this.newExamen(), id: newId }]);
      this.newExamen.set({ type: '', details: '' });
    }
  }

  removeExamen(id: number) {
    this.examens.update(e => e.filter(ex => ex.id !== id));
  }

  generateOrdonnanceMedicaments() {
    console.log('Generate Ordonnance Medicaments clicked.');
    if (!this.consultationId) {
      console.error('No consultation ID!');
      alert('ATTENTION: Cette page doit être ouverte depuis une consultation pour sauvegarder l\'ordonnance.\n\nVeuillez passer par "Nouvelle consultation" et ajouter les médicaments directement là-bas.');
      return;
    }
    if (this.medicaments().length === 0) {
      alert('La liste des médicaments est vide.');
      return;
    }

    console.log('Creating ordonnance for consultation:', this.consultationId);

    // 1. Create Ordonnance
    this.ordonnanceService.createOrdonnance({
      consultationId: this.consultationId,
      type: TypeOrdonnance.MEDICAMENT
    }).subscribe({
      next: (ord) => {
        console.log('Ordonnance created:', ord);
        // 2. Add Medicaments
        let completed = 0;
        const total = this.medicaments().length;

        this.medicaments().forEach(med => {
          console.log('Adding medicament:', med);
          this.ordonnanceService.addMedicament({
            ordonnanceId: ord.id,
            nom: med.nom,
            dosage: med.posologie,
            duree: med.duree
          }).subscribe({
            next: () => {
              completed++;
              if (completed === total) {
                console.log('All medicaments added.');
                alert('Ordonnance enregistrée avec succès!');
              }
            },
            error: (e) => console.error('Error adding medicament:', e)
          });
        });
      },
      error: (err) => {
        console.error('Error creating ordonnance', err);
        alert('Erreur lors de la création de l\'ordonnance.');
      }
    });
  }

  generateOrdonnanceExamens() {
    console.log('Generate Ordonnance Examens clicked.');
    if (!this.consultationId) {
      // ... same checks
      alert('Erreur: Aucune consultation associée.');
      return;
    }
    // ...
    const details = this.examens().map(e => `- ${e.type}: ${e.details}`).join('\n');

    this.ordonnanceService.createOrdonnance({
      consultationId: this.consultationId,
      type: TypeOrdonnance.EXAMEN,
      contenuLibre: details
    }).subscribe({
      next: () => {
        console.log('Exam ordonnance saved.');
        alert('Ordonnance d\'examens enregistrée avec succès!');
      },
      error: (err) => {
        console.error('Error creating exam ordonnance', err);
        alert('Erreur lors de l\'enregistrement.');
      }
    });
  }

  printOrdonnance(type: string) {
    console.log('Imprimer ordonnance:', type);
    alert('Impression lancée (simulation)');
  }
}
