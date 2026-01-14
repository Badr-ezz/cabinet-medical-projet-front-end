import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { PatientService } from '../../../services/patient.service';
import { ConsultationService } from '../../../services/consultation.service';
import { Patient } from '../../../models/patient.model';
import { MedicalContextService } from '../../../services/medical-context.service';

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
export class PatientProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);
  private contextService = inject(MedicalContextService);

  // Initialize with empty/default data to avoid template errors before load
  patient = signal<any>({
    id: 0,
    cin: '',
    nom: 'Chargement...',
    prenom: '',
    dateNaissance: '',
    telephone: '',
    email: '',
    adresse: '',
    groupeSanguin: ''
  });

  dossierMedical = signal({
    antecedentsMedicaux: 'Aucun antécédent notable',
    antecedentsChirurgicaux: 'Aucune chirurgie',
    allergies: 'Aucune',
    traitementsEnCours: 'Aucun',
    habitudes: 'Non renseigné'
  });

  historiqueConsultations = signal<Consultation[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const id = +idStr;
        this.loadPatient(id);
      }
    });
  }

  loadPatient(id: number) {
    this.contextService.setPatientId(id); // Set active context
    this.patientService.getById(id).subscribe({
      next: (data) => {
        // Map backend Patient to local structure if needed, or use directly
        // Backend 'Patient' matches mostly, but date/time format might differ
        this.patient.set({
          id: data.id,
          cin: data.cin,
          nom: data.nom,
          prenom: data.prenom,
          dateNaissance: data.dateNaissance?.toString(),
          telephone: data.numTel || '',
          email: data.email || '',
          adresse: data.adresse || '',
          groupeSanguin: 'O+' // Default as backend doesn't have it in Patient yet
        });

        // Load consultations for this patient
        this.loadConsultations(id);
      },
      error: (err) => {
        console.error('Error loading patient', err);
      }
    });
  }

  loadConsultations(patientId: number) {
    this.consultationService.getByPatientId(patientId).subscribe({
      next: (consultations) => {
        // Map backend Consultation[] to local interface
        const mapped = consultations.map(c => ({
          id: c.id,
          date: c.dateConsultation,
          type: c.type,
          diagnostic: c.diagnostic,
          medecin: 'Dr. ' + (c.medecinId || 'Inconnu') // You might need to fetch medecin name separately
        }));
        this.historiqueConsultations.set(mapped);
      },
      error: (err) => {
        console.error('Error loading consultations for patient', err);
        this.historiqueConsultations.set([]);
      }
    });
  }

  startConsultation() {
    console.log('Démarrer consultation pour:', this.patient().prenom, this.patient().nom);
    this.router.navigate(['/doctor/consultation'], {
      queryParams: { patientId: this.patient().id }
    });
  }
}
