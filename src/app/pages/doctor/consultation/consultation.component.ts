import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ConsultationService } from '../../../services/consultation.service';
import { AuthService } from '../../../services/auth.service';
import { PatientService } from '../../../services/patient.service';

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
export class ConsultationComponent implements OnInit {
  private router = inject(Router);
  private consultationService = inject(ConsultationService);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);

  // Default mock, will be overwritten by real data
  currentPatient = signal({
    nom: 'Chargement...',
    prenom: '',
    cin: '',
    age: 0,
    id: -1
  });

  consultationId: number | null = null;

  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const consultationIdParam = params.get('id');
      const pId = params.get('patientId');

      if (consultationIdParam) {
        // Mode: View/Edit existing consultation
        this.consultationId = +consultationIdParam;
        this.consultationService.getById(this.consultationId).subscribe({
          next: (c) => {
            // Populate Form
            this.form.set({
              type: c.type || '',
              diagnostic: c.diagnostic || '',
              observations: c.observations || '',
              traitement: ''
            });

            // Populate Exams
            if (c.examenSupplementaire) {
              this.examensList.set(c.examenSupplementaire.split('\n').filter(e => e.trim()));
            }

            // Populate Medicaments
            if (c.ordonnances && c.ordonnances.length > 0) {
              // Aggregating all medicaments from all ordonnances for now
              const allMeds = c.ordonnances.flatMap(o => o.medicaments || []);
              this.medicamentsList.set(allMeds);
            }

            // Load Patient
            this.loadPatient(c.patientId);
          },
          error: (err) => console.error('Error loading consultation', err)
        });

      } else if (pId) {
        // Mode: New consultation for specific patient
        this.loadPatient(+pId);
      } else {
        // Fallback: Fetch the first available patient
        this.patientService.getAll().subscribe({
          next: (patients) => {
            if (patients && patients.length > 0) {
              this.loadPatient(patients[0].id!);
            }
          },
          error: (err) => console.error('Failed to load patients for context', err)
        });
      }
    });
  }

  loadPatient(id: number) {
    this.patientService.getById(id).subscribe({
      next: (p) => {
        const age = p.dateNaissance ?
          new Date().getFullYear() - new Date(p.dateNaissance).getFullYear() : 0;
        this.currentPatient.set({
          nom: p.nom,
          prenom: p.prenom,
          cin: p.cin,
          age: age,
          id: p.id!
        });
      },
      error: (err) => console.error('Error loading patient for consultation', err)
    });
  }

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

  // New Lists for dynamic additions
  medicamentsList = signal<any[]>([]);
  examensList = signal<string[]>([]);

  // Temporary inputs
  nouvelExamen = signal('');
  nouveauMedicament = signal({
    nom: '',
    dosage: '',
    duree: '',
    description: '' // Instructions
  });

  updateForm(field: keyof ConsultationForm, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  // Methods to add/remove items
  addExamen() {
    if (this.nouvelExamen().trim()) {
      this.examensList.update(list => [...list, this.nouvelExamen().trim()]);
      this.nouvelExamen.set('');
    }
  }

  removeExamen(index: number) {
    this.examensList.update(list => list.filter((_, i) => i !== index));
  }

  updateNouveauMedicament(field: string, value: string) {
    this.nouveauMedicament.update(m => ({ ...m, [field]: value }));
  }

  addMedicament() {
    const med = this.nouveauMedicament();
    if (med.nom.trim()) {
      this.medicamentsList.update(list => [...list, { ...med }]);
      // Reset form
      this.nouveauMedicament.set({
        nom: '',
        dosage: '',
        duree: '',
        description: ''
      });
    }
  }

  removeMedicament(index: number) {
    this.medicamentsList.update(list => list.filter((_, i) => i !== index));
  }

  saveConsultation() {
    console.log('saveConsultation called!'); // Debug 1
    const user = this.authService.getUser();
    console.log('User from AuthService:', user); // Debug 2

    if (!user) {
      console.error('User not logged in!');
      alert('Utilisateur non connecté');
      return;
    }

    // Mock Appointment ID for now - real app needs this passed in
    const rendezVousId = 1;

    // Build payload matching ConsultationRequest interface
    const payload = {
      patientId: this.currentPatient().id,
      medecinId: user.id,
      rendezVousId: rendezVousId,
      type: this.form().type || 'CONSULTATION',
      dateConsultation: new Date().toISOString().split('T')[0],
      diagnostic: this.form().diagnostic,
      observations: this.form().observations,
      examenSupplementaire: this.examensList().join('\n'), // Join exams for backend string field
      medicaments: this.medicamentsList() // Pass structured list for backend Ordonnance
    };

    console.log('Saving consultation payload:', payload);
    console.log('Medicaments list to save:', this.medicamentsList());

    this.consultationService.create(payload).subscribe({
      next: (res) => {
        console.log('Consultation saved:', res);
        this.consultationId = res.id;
        alert('Consultation et ordonnance enregistrées avec succès!');
      },
      error: (err) => {
        console.error('Error saving consultation:', err);
        alert('Erreur lors de l\'enregistrement de la consultation');
      }
    });
  }

  modifyConsultation() {
    console.log('Modifier consultation');
    // Implement modification logic if needed
  }

  deleteConsultation() {
    if (!this.consultationId) {
      alert("Impossible de supprimer une nouvelle consultation non enregistrée.");
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer cette consultation ? Cette action est irréversible.')) {
      this.consultationService.delete(this.consultationId).subscribe({
        next: () => {
          alert('Consultation supprimée avec succès.');
          this.router.navigate(['/doctor/consultations-list']);
        },
        error: (err) => {
          console.error('Error deleting consultation:', err);
          alert('Erreur lors de la suppression de la consultation.');
        }
      });
    }
  }

  generateOrdonnance() {
    // Legacy method - functionality merged into Save
    if (this.medicamentsList().length === 0) {
      alert("Ajoutez des médicaments avant de générer l'ordonnance.");
      return;
    }
    alert("L'ordonnance a été générée et enregistrée avec la consultation.");
  }
}
