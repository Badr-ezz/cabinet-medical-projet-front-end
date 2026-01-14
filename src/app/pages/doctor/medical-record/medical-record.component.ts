import { Component, signal, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PatientService } from '../../../services/patient.service';

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
  imports: [FormsModule, CommonModule],
  templateUrl: './medical-record.component.html'
})
export class MedicalRecordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);

  currentPatient = signal({
    id: 0,
    nom: 'Chargement...',
    prenom: '',
    cin: ''
  });

  dossier = signal<DossierMedical>({
    antecedentsMedicaux: '',
    antecedentsChirurgicaux: '',
    allergies: '',
    traitementsEnCours: '', // Backend key 'traitements' mapped manually if needed
    habitudes: ''
  });

  // Navigation tabs
  activeTab = signal<'summary' | 'history' | 'lifestyle' | 'consultations' | 'documents'>('summary');
  patientId: number | null = null;
  dossierId: number | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.patientId = +idStr;
        this.loadData(this.patientId);
      }
    });
  }

  loadData(patientId: number) {
    // 1. Load Patient Info
    this.patientService.getById(patientId).subscribe({
      next: (p) => {
        this.currentPatient.set({
          id: p.id,
          nom: p.nom,
          prenom: p.prenom,
          cin: p.cin
        });
      },
      error: (err) => console.error('Error loading patient', err)
    });

    // 2. Load Dossier Medical
    this.patientService.getDossierByPatientId(patientId).subscribe({
      next: (d) => {
        if (d) {
          this.dossierId = d.idDossier || null; // Capture existing ID if any
          this.dossier.set({
            antecedentsMedicaux: d.antecedentsMedicaux || '',
            antecedentsChirurgicaux: d.antecedentsChirurgicaux || '',
            allergies: d.allergies || '',
            traitementsEnCours: d.traitements || '', // Key mismatch handled here
            habitudes: d.habitudes || ''
          });
        }
      },
      error: (err) => console.error('Error loading dossier', err)
    });
  }

  switchTab(tab: 'summary' | 'history' | 'lifestyle' | 'consultations' | 'documents') {
    this.activeTab.set(tab);
  }

  // Helper to split string into array for display
  splitList(text: string): string[] {
    return text ? text.split('\n') : [];
  }

  updateDossier(field: keyof DossierMedical, value: string) {
    this.dossier.update(d => ({ ...d, [field]: value }));
  }

  saveDossier() {
    if (!this.patientId) return;

    // Map back to backend DTO structure
    const updatedDossier: any = {
      idDossier: this.dossierId,
      patientId: this.patientId,
      antecedentsMedicaux: this.dossier().antecedentsMedicaux,
      antecedentsChirurgicaux: this.dossier().antecedentsChirurgicaux,
      allergies: this.dossier().allergies,
      traitements: this.dossier().traitementsEnCours,
      habitudes: this.dossier().habitudes
    };

    console.log('Saving dossier...', updatedDossier);

    this.patientService.updateDossier(this.patientId, updatedDossier).subscribe({
      next: (res) => {
        console.log('Dossier saved:', res);
        this.dossierId = res.idDossier || this.dossierId; // Update ID if new
        alert('Dossier médical mis à jour avec succès !');
      },
      error: (err) => {
        console.error('Error saving dossier', err);
        alert('Erreur lors de la sauvegarde du dossier.');
      }
    });
  }
}
