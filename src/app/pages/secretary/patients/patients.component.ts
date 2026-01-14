import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { Patient, PatientRequest } from '../../../models/patient.model';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './patients.component.html'
})
export class PatientsComponent implements OnInit {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // États de l'interface
  isModalOpen = signal(false);
  editingPatient = signal<Patient | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Recherche
  searchTerm = signal('');
  searchType = signal<'cin' | 'nom'>('nom');

  // Données
  patients = signal<Patient[]>([]);
  cabinetId = signal<number | null>(null);

  // Types de mutuelle disponibles
  typesMutuelle = ['CNSS', 'CNOPS', 'RMA', 'SAHAM', 'AXA', 'Autre', 'Aucune'];

  // Sexes disponibles
  sexes = [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Féminin' }
  ];

  // Formulaire
  formData = signal<PatientRequest>({
    cin: '',
    nom: '',
    prenom: '',
    dateNaissance: '',
    sexe: '',
    numTel: '',
    typeMutuelle: '',
    cabinetId: 0
  });

  // Computed signal pour filtrer les patients
  filteredPatients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.patients();

    return this.patients().filter(patient => {
      if (this.searchType() === 'cin') {
        return patient.cin.toLowerCase().includes(term);
      } else {
        return patient.nom.toLowerCase().includes(term) || 
               patient.prenom.toLowerCase().includes(term);
      }
    });
  });

  ngOnInit(): void {
    // Récupère le cabinetId depuis le token
    const cabId = this.authService.getCabinetId();
    if (cabId) {
      this.cabinetId.set(cabId);
      this.loadPatients();
    } else {
      this.errorMessage.set('Impossible de récupérer les informations du cabinet');
    }
  }

  /**
   * Charge les patients du cabinet connecté
   */
  loadPatients(): void {
    const cabId = this.cabinetId();
    if (!cabId) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.patientService.getByCabinetId(cabId).subscribe({
      next: (patients) => {
        this.patients.set(patients);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des patients:', error);
        this.errorMessage.set('Impossible de charger les patients');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Ouvre le modal pour créer un patient
   */
  openModal(): void {
    this.editingPatient.set(null);
    this.formData.set({
      cin: '',
      nom: '',
      prenom: '',
      dateNaissance: '',
      sexe: '',
      numTel: '',
      typeMutuelle: '',
      cabinetId: this.cabinetId() || 0
    });
    this.errorMessage.set('');
    this.isModalOpen.set(true);
  }

  /**
   * Ouvre le modal pour modifier un patient
   */
  openEditModal(patient: Patient): void {
    this.editingPatient.set(patient);
    this.formData.set({
      cin: patient.cin,
      nom: patient.nom,
      prenom: patient.prenom,
      dateNaissance: patient.dateNaissance || '',
      sexe: patient.sexe || '',
      numTel: patient.numTel || '',
      typeMutuelle: patient.typeMutuelle || '',
      cabinetId: patient.cabinetId
    });
    this.errorMessage.set('');
    this.isModalOpen.set(true);
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingPatient.set(null);
    this.errorMessage.set('');
  }

  /**
   * Met à jour un champ du formulaire
   */
  updateFormField(field: keyof PatientRequest, value: string | number): void {
    this.formData.update(f => ({ ...f, [field]: value }));
  }

  /**
   * Sauvegarde le patient (création ou modification)
   */
  savePatient(): void {
    const data = this.formData();

    // Validation
    if (!data.cin || !data.nom || !data.prenom) {
      this.errorMessage.set('Veuillez remplir les champs obligatoires (CIN, Nom, Prénom)');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const editing = this.editingPatient();

    if (editing) {
      // Mode modification
      this.patientService.update(editing.id, data).subscribe({
        next: (updatedPatient) => {
          this.patients.update(patients =>
            patients.map(p => p.id === updatedPatient.id ? updatedPatient : p)
          );
          this.isLoading.set(false);
          this.showSuccess('Patient modifié avec succès');
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.errorMessage.set(error.error?.message || 'Erreur lors de la modification');
          this.isLoading.set(false);
        }
      });
    } else {
      // Mode création
      this.patientService.create(data).subscribe({
        next: (newPatient) => {
          this.patients.update(patients => [...patients, newPatient]);
          this.isLoading.set(false);
          this.showSuccess('Patient créé avec succès');
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          if (error.status === 409) {
            this.errorMessage.set('Un patient avec ce CIN existe déjà');
          } else {
            this.errorMessage.set(error.error?.message || 'Erreur lors de la création');
          }
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Supprime un patient
   */
  deletePatient(patient: Patient): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${patient.prenom} ${patient.nom}" ?`)) {
      this.isLoading.set(true);

      this.patientService.delete(patient.id).subscribe({
        next: () => {
          this.patients.update(patients => patients.filter(p => p.id !== patient.id));
          this.isLoading.set(false);
          this.showSuccess('Patient supprimé avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.errorMessage.set('Erreur lors de la suppression');
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Calcule l'âge à partir de la date de naissance
   */
  calculateAge(dateNaissance: string | undefined): string {
    if (!dateNaissance) return '-';
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} ans`;
  }

  /**
   * Navigue vers l'agenda pour prendre un RDV pour ce patient
   */
  takeAppointment(patient: Patient): void {
    this.router.navigate(['/secretary/appointments'], {
      queryParams: {
        patientId: patient.id
      }
    });
  }

  /**
   * Affiche un message de succès temporaire
   */
  private showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 3000);
  }
}
