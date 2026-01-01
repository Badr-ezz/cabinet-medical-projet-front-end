import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
export class PrescriptionsComponent {
  currentPatient = signal({
    nom: 'Benali',
    prenom: 'Ahmed',
    cin: 'AB123456'
  });

  medicaments = signal<Medicament[]>([
    { id: 1, nom: 'Paracétamol 1000mg', posologie: '1 comprimé 3 fois par jour', duree: '5 jours' },
    { id: 2, nom: 'Amoxicilline 500mg', posologie: '1 gélule 2 fois par jour', duree: '7 jours' }
  ]);

  examens = signal<Examen[]>([
    { id: 1, type: 'Bilan sanguin complet', details: 'NFS, Glycémie, HbA1c, Créatinine' }
  ]);

  newMedicament = signal({ nom: '', posologie: '', duree: '' });
  newExamen = signal({ type: '', details: '' });

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
    console.log('Générer ordonnance médicaments:', this.medicaments());
    alert('Ordonnance médicaments générée (simulation)');
  }

  generateOrdonnanceExamens() {
    console.log('Générer ordonnance examens:', this.examens());
    alert('Ordonnance examens générée (simulation)');
  }

  printOrdonnance(type: string) {
    console.log('Imprimer ordonnance:', type);
    alert('Impression lancée (simulation)');
  }
}
